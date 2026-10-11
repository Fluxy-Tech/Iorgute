"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { writeAudit } from "@/lib/audit";
import { getBottleSummary } from "@/lib/discounts";
import { orderCode, toNumber } from "@/lib/format";
import { changeOrderStatus, evaluateCoupon, OrderError } from "@/lib/orders";
import { deliversTo, getSettings } from "@/lib/settings";
import { assertRole, requireUser } from "@/lib/session";
import { errorMessage, fieldErrors, type ActionResult } from "./result";

const ANY = ["ADMIN", "STAFF", "CUSTOMER"] as const;
const anyUser = () => assertRole([...ANY]);

// ─────────────────────────── Pedidos ───────────────────────────

const placeOrderSchema = z.object({
  items: z
    .array(z.object({ productId: z.string().min(1), quantity: z.number().int().min(1).max(50) }))
    .min(1, "Seu carrinho está vazio."),
  useBottleCredit: z.boolean(),
  couponCode: z.string().trim().max(40).optional(),
  paymentMethod: z.enum(["PIX", "CARTAO", "DINHEIRO"]),
  notes: z.string().trim().max(500).optional(),
});

export async function placeOrderAction(input: z.input<typeof placeOrderSchema>): Promise<ActionResult<{ orderId: number }>> {
  try {
    const user = await anyUser();
    const data = placeOrderSchema.parse(input);
    const [address, settings, bottles] = await Promise.all([
      prisma.address.findUnique({ where: { userId: user.id } }),
      getSettings(),
      getBottleSummary(user.id),
    ]);
    if (!address) throw new OrderError("Cadastre um endereço de entrega antes de finalizar.");
    if (!deliversTo(settings, address.city)) {
      throw new OrderError(`Ainda não entregamos em ${address.city}. Consulte a disponibilidade com a loja.`);
    }

    const order = await prisma.$transaction(async (tx) => {
      const products = await tx.product.findMany({
        where: { id: { in: data.items.map((i) => i.productId) }, active: true },
      });
      const lines = data.items.map((item) => {
        const product = products.find((p) => p.id === item.productId);
        if (!product) throw new OrderError("Um dos produtos não está mais disponível.");
        if (product.stock < item.quantity) {
          throw new OrderError(`Estoque insuficiente de ${product.name} (${product.stock} disponível).`);
        }
        const unit = toNumber(product.price);
        return { product, quantity: item.quantity, unit, total: Math.round(unit * item.quantity * 100) / 100 };
      });
      const subtotal = Math.round(lines.reduce((s, l) => s + l.total, 0) * 100) / 100;

      let couponDiscount = 0;
      let couponId: string | null = null;
      if (data.couponCode) {
        const evaluated = await evaluateCoupon(tx, data.couponCode, user.id, subtotal);
        couponDiscount = evaluated.discount;
        couponId = evaluated.coupon.id;
      }
      const bottleDiscount = data.useBottleCredit
        ? Math.min(bottles.balance, Math.max(0, subtotal - couponDiscount))
        : 0;
      const deliveryFee = toNumber(settings.deliveryFee);
      const total = Math.max(0, Math.round((subtotal - couponDiscount - bottleDiscount + deliveryFee) * 100) / 100);

      for (const line of lines) {
        await tx.product.update({ where: { id: line.product.id }, data: { stock: { decrement: line.quantity } } });
      }

      const estimated = new Date();
      estimated.setDate(estimated.getDate() + Number(settings.deliveryDays || 2));

      const created = await tx.order.create({
        data: {
          userId: user.id,
          subtotal,
          couponDiscount,
          bottleDiscount,
          deliveryFee,
          total,
          paymentMethod: data.paymentMethod,
          notes: data.notes || null,
          deliveryAddress: `${address.street} — ${address.neighborhood}, ${address.city} - ${address.state}, CEP ${address.zipCode}`,
          estimatedDelivery: estimated,
          items: {
            create: lines.map((l) => ({
              productId: l.product.id,
              productName: `${l.product.name} • ${l.product.size}`,
              quantity: l.quantity,
              unitPrice: l.unit,
              total: l.total,
            })),
          },
          statusLogs: { create: { toStatus: "RECEBIDO", changedBy: user.id, note: "Pedido realizado pelo cliente" } },
        },
      });
      if (couponId) {
        await tx.couponRedemption.create({
          data: { couponId, userId: user.id, orderId: created.id, amount: couponDiscount },
        });
      }
      await tx.notification.create({
        data: {
          userId: user.id,
          title: `Pedido ${orderCode(created.id)} recebido!`,
          message: "Recebemos seu pedido e logo ele entra em produção.",
          link: `/pedidos/${created.id}`,
        },
      });
      return created;
    });

    await writeAudit({
      action: "ORDER_CREATED",
      entity: "order",
      entityId: order.id,
      userId: user.id,
      userEmail: user.email,
      after: {
        items: data.items,
        subtotal: order.subtotal,
        couponDiscount: order.couponDiscount,
        bottleDiscount: order.bottleDiscount,
        total: order.total,
        paymentMethod: order.paymentMethod,
      },
    });
    revalidatePath("/pedidos");
    revalidatePath("/admin/pedidos");
    return { ok: true, data: { orderId: order.id }, message: `Pedido ${orderCode(order.id)} realizado!` };
  } catch (err) {
    return { ok: false, error: errorMessage(err) };
  }
}

export async function checkCouponAction(code: string, subtotal: number): Promise<ActionResult<{ discount: number; description: string }>> {
  try {
    const user = await anyUser();
    const { coupon, discount } = await evaluateCoupon(prisma, code, user.id, subtotal);
    return { ok: true, data: { discount, description: coupon.description } };
  } catch (err) {
    return { ok: false, error: errorMessage(err) };
  }
}

export async function cancelMyOrderAction(orderId: number): Promise<ActionResult> {
  try {
    const user = await anyUser();
    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order || order.userId !== user.id) throw new OrderError("Pedido não encontrado.");
    if (order.status !== "RECEBIDO") throw new OrderError("Este pedido já entrou em produção e não pode ser cancelado pelo app.");
    await changeOrderStatus({ orderId, to: "CANCELADO", actor: user, note: "Cancelado pelo cliente" });
    revalidatePath("/pedidos");
    return { ok: true, message: "Pedido cancelado." };
  } catch (err) {
    return { ok: false, error: errorMessage(err) };
  }
}

// ─────────────────────────── Conta ───────────────────────────

const addressSchema = z.object({
  street: z.string().trim().min(3, "Informe rua, número e complemento."),
  neighborhood: z.string().trim().min(2, "Informe o bairro."),
  city: z.string().trim().min(2, "Informe a cidade."),
  state: z.string().trim().length(2, "UF com 2 letras.").toUpperCase(),
  zipCode: z.string().trim().regex(/^\d{5}-?\d{3}$/, "CEP inválido."),
});

export async function updateAddressAction(_: unknown, formData: FormData): Promise<ActionResult> {
  const parsed = addressSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, error: "Verifique os campos.", fieldErrors: fieldErrors(parsed.error) };
  try {
    const user = await anyUser();
    const data = { ...parsed.data, zipCode: parsed.data.zipCode.replace(/^(\d{5})(\d{3})$/, "$1-$2") };
    const before = await prisma.address.findUnique({ where: { userId: user.id } });
    const after = await prisma.address.upsert({ where: { userId: user.id }, update: data, create: { ...data, userId: user.id } });
    await writeAudit({ action: "ADDRESS_UPDATED", entity: "address", entityId: after.id, userId: user.id, userEmail: user.email, before, after });
    revalidatePath("/conta/endereco");
    return { ok: true, message: "Endereço atualizado!" };
  } catch (err) {
    return { ok: false, error: errorMessage(err) };
  }
}

const profileSchema = z.object({
  name: z.string().trim().min(3, "Informe seu nome completo."),
  phone: z.string().trim().min(10, "Informe um telefone com DDD."),
});

export async function updateProfileAction(_: unknown, formData: FormData): Promise<ActionResult> {
  const parsed = profileSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, error: "Verifique os campos.", fieldErrors: fieldErrors(parsed.error) };
  try {
    const user = await anyUser();
    await auth.api.updateUser({ body: parsed.data, headers: await headers() });
    await writeAudit({
      action: "PROFILE_UPDATED",
      entity: "user",
      entityId: user.id,
      userId: user.id,
      userEmail: user.email,
      before: { name: user.name, phone: user.phone },
      after: parsed.data,
    });
    revalidatePath("/conta", "layout");
    return { ok: true, message: "Dados atualizados!" };
  } catch (err) {
    return { ok: false, error: errorMessage(err) };
  }
}

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, "Informe a senha atual."),
    newPassword: z.string().min(6, "A nova senha deve ter pelo menos 6 caracteres."),
    confirm: z.string(),
  })
  .refine((d) => d.newPassword === d.confirm, { message: "As senhas não conferem.", path: ["confirm"] });

export async function changePasswordAction(_: unknown, formData: FormData): Promise<ActionResult> {
  const parsed = passwordSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, error: "Verifique os campos.", fieldErrors: fieldErrors(parsed.error) };
  const user = await requireUser();
  try {
    await auth.api.changePassword({
      body: { currentPassword: parsed.data.currentPassword, newPassword: parsed.data.newPassword, revokeOtherSessions: true },
      headers: await headers(),
    });
    await writeAudit({ action: "PASSWORD_CHANGED", entity: "user", entityId: user.id, userId: user.id, userEmail: user.email });
    return { ok: true, message: "Senha alterada com sucesso!" };
  } catch (err) {
    await writeAudit({
      action: "PASSWORD_CHANGE_FAILED",
      entity: "user",
      entityId: user.id,
      userId: user.id,
      userEmail: user.email,
      success: false,
      error: errorMessage(err),
    });
    return { ok: false, error: errorMessage(err) };
  }
}

const prefSchema = z.object({
  notifyOrders: z.boolean(),
  notifyPromotions: z.boolean(),
  favoriteFlavor: z.string().trim().max(60).nullable(),
});

export async function updatePreferencesAction(input: z.input<typeof prefSchema>): Promise<ActionResult> {
  try {
    const user = await anyUser();
    const data = prefSchema.parse(input);
    const before = await prisma.userPreference.findUnique({ where: { userId: user.id } });
    const after = await prisma.userPreference.upsert({ where: { userId: user.id }, update: data, create: { ...data, userId: user.id } });
    await writeAudit({ action: "PREFERENCES_UPDATED", entity: "user_preference", entityId: after.id, userId: user.id, userEmail: user.email, before, after });
    return { ok: true, message: "Preferências salvas!" };
  } catch (err) {
    return { ok: false, error: errorMessage(err) };
  }
}

export async function markNotificationsReadAction(): Promise<ActionResult> {
  try {
    const user = await anyUser();
    await prisma.notification.updateMany({ where: { userId: user.id, read: false }, data: { read: true } });
    revalidatePath("/", "layout");
    return { ok: true };
  } catch (err) {
    return { ok: false, error: errorMessage(err) };
  }
}
