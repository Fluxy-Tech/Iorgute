"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { writeAudit } from "@/lib/audit";
import { toNumber } from "@/lib/format";
import { changeOrderStatus } from "@/lib/orders";
import { getSettings } from "@/lib/settings";
import { deleteStoredObject, uploadProductImage } from "@/lib/storage";
import { assertRole } from "@/lib/session";
import { ORDER_FLOW, ROLES, SETTING_DEFAULTS, type SettingKey } from "@/lib/constants";
import { BusinessError, errorMessage, fieldErrors, type ActionResult } from "./result";

const staff = () => assertRole(["ADMIN", "STAFF"]);
const admin = () => assertRole(["ADMIN"]);

// ─────────────────────────── Esteira (kanban) ───────────────────────────

const moveSchema = z.object({
  orderId: z.number().int(),
  to: z.enum(ORDER_FLOW),
  position: z.number().int().min(0).optional(),
  note: z.string().trim().max(300).optional(),
});

export async function moveOrderAction(input: z.input<typeof moveSchema>): Promise<ActionResult> {
  try {
    const user = await staff();
    const data = moveSchema.parse(input);
    await changeOrderStatus({ orderId: data.orderId, to: data.to, actor: user, note: data.note, position: data.position });
    revalidatePath("/admin/pedidos");
    return { ok: true };
  } catch (err) {
    return { ok: false, error: errorMessage(err) };
  }
}

// ─────────────────────────── Coleta de vasilhames ───────────────────────────

const bottleSchema = z.object({
  userId: z.string().min(1, "Selecione o cliente."),
  quantity: z.coerce.number().int().min(1, "Mínimo 1 garrafa.").max(500),
  notes: z.string().trim().max(300).optional(),
});

export async function registerBottleReturnAction(_: unknown, formData: FormData): Promise<ActionResult> {
  const parsed = bottleSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, error: "Verifique os campos.", fieldErrors: fieldErrors(parsed.error) };
  try {
    const user = await staff();
    const settings = await getSettings();
    const unit = toNumber(settings.bottleCredit);
    const customer = await prisma.user.findUnique({ where: { id: parsed.data.userId } });
    if (!customer) throw new BusinessError("Cliente não encontrado.");
    const credit = Math.round(unit * parsed.data.quantity * 100) / 100;
    const created = await prisma.bottleReturn.create({
      data: {
        userId: customer.id,
        quantity: parsed.data.quantity,
        unitCredit: unit,
        credit,
        receivedBy: user.id,
        notes: parsed.data.notes || null,
      },
    });
    await prisma.notification.create({
      data: {
        userId: customer.id,
        title: "Garrafas recebidas! ♻️",
        message: `Recebemos ${parsed.data.quantity} garrafa(s). Você ganhou R$ ${credit.toFixed(2).replace(".", ",")} de desconto.`,
        link: "/conta/garrafas",
      },
    });
    await writeAudit({
      action: "BOTTLE_RETURN_REGISTERED",
      entity: "bottle_return",
      entityId: created.id,
      userId: user.id,
      userEmail: user.email,
      after: { customer: customer.email, quantity: created.quantity, credit },
    });
    revalidatePath("/admin/garrafas");
    return { ok: true, message: `${created.quantity} garrafa(s) registradas para ${customer.name}.` };
  } catch (err) {
    return { ok: false, error: errorMessage(err) };
  }
}

export async function deleteBottleReturnAction(id: string): Promise<ActionResult> {
  try {
    const user = await admin();
    const before = await prisma.bottleReturn.delete({ where: { id } });
    await writeAudit({ action: "BOTTLE_RETURN_DELETED", entity: "bottle_return", entityId: id, userId: user.id, userEmail: user.email, before });
    revalidatePath("/admin/garrafas");
    return { ok: true, message: "Registro removido." };
  } catch (err) {
    return { ok: false, error: errorMessage(err) };
  }
}

// ─────────────────────────── Produtos ───────────────────────────

const productSchema = z.object({
  id: z.string().optional(),
  name: z.string().trim().min(2, "Informe o nome."),
  flavor: z.string().trim().min(2, "Informe o sabor."),
  size: z.string().trim().min(1, "Informe o tamanho."),
  description: z.string().trim().max(500).optional(),
  price: z.coerce.number().min(0.01, "Preço inválido."),
  stock: z.coerce.number().int().min(0, "Estoque inválido."),
  returnable: z.coerce.boolean(),
  active: z.coerce.boolean(),
});

export async function saveProductAction(_: unknown, formData: FormData): Promise<ActionResult<{ id: string }>> {
  const raw = Object.fromEntries(formData);
  const parsed = productSchema.safeParse({ ...raw, returnable: raw.returnable === "on", active: raw.active === "on" });
  if (!parsed.success) return { ok: false, error: "Verifique os campos.", fieldErrors: fieldErrors(parsed.error) };
  try {
    const user = await admin();
    const { id, ...data } = parsed.data;
    const payload = { ...data, description: data.description || null };
    let productId: string;
    if (id) {
      const before = await prisma.product.findUnique({ where: { id } });
      const after = await prisma.product.update({ where: { id }, data: payload });
      await writeAudit({ action: "PRODUCT_UPDATED", entity: "product", entityId: id, userId: user.id, userEmail: user.email, before, after });
      productId = id;
    } else {
      // As fotos são enviadas logo em seguida pelo formulário, usando o id devolvido aqui
      const after = await prisma.product.create({ data: payload });
      await writeAudit({ action: "PRODUCT_CREATED", entity: "product", entityId: after.id, userId: user.id, userEmail: user.email, after });
      productId = after.id;
    }
    revalidatePath("/admin/produtos");
    revalidatePath("/inicio");
    revalidatePath(`/produto/${productId}`);
    return { ok: true, data: { id: productId }, message: id ? "Produto atualizado." : "Produto criado." };
  } catch (err) {
    return { ok: false, error: errorMessage(err) };
  }
}

// ─────────────────────────── Cupons ───────────────────────────

const couponSchema = z.object({
  id: z.string().optional(),
  code: z.string().trim().min(3, "Mínimo 3 caracteres.").max(30).regex(/^[A-Za-z0-9_-]+$/, "Use letras, números, - ou _.").transform((s) => s.toUpperCase()),
  description: z.string().trim().min(3, "Descreva o cupom."),
  type: z.enum(["PERCENT", "FIXED"]),
  value: z.coerce.number().positive("Valor inválido."),
  minOrder: z.coerce.number().min(0),
  maxUses: z.preprocess((v) => (v === "" || v == null ? null : Number(v)), z.number().int().positive().nullable()),
  expiresAt: z.preprocess((v) => (v ? new Date(`${v}T23:59:59`) : null), z.date().nullable()),
  active: z.boolean(),
});

export async function saveCouponAction(_: unknown, formData: FormData): Promise<ActionResult> {
  const raw = Object.fromEntries(formData);
  const parsed = couponSchema.safeParse({ ...raw, active: raw.active === "on" });
  if (!parsed.success) return { ok: false, error: "Verifique os campos.", fieldErrors: fieldErrors(parsed.error) };
  try {
    const user = await admin();
    const { id, ...data } = parsed.data;
    if (data.type === "PERCENT" && data.value > 100) throw new BusinessError("Percentual máximo é 100%.");
    if (id) {
      const before = await prisma.coupon.findUnique({ where: { id } });
      const after = await prisma.coupon.update({ where: { id }, data });
      await writeAudit({ action: "COUPON_UPDATED", entity: "coupon", entityId: id, userId: user.id, userEmail: user.email, before, after });
    } else {
      const exists = await prisma.coupon.findUnique({ where: { code: data.code } });
      if (exists) throw new BusinessError("Já existe um cupom com este código.");
      const after = await prisma.coupon.create({ data });
      await writeAudit({ action: "COUPON_CREATED", entity: "coupon", entityId: after.id, userId: user.id, userEmail: user.email, after });
    }
    revalidatePath("/admin/cupons");
    return { ok: true, message: id ? "Cupom atualizado." : "Cupom criado." };
  } catch (err) {
    return { ok: false, error: errorMessage(err) };
  }
}

// ─────────────────────────── Usuários e roles ───────────────────────────

export async function setUserRoleAction(userId: string, role: (typeof ROLES)[number]): Promise<ActionResult> {
  try {
    const user = await admin();
    if (!ROLES.includes(role)) throw new BusinessError("Role inválida.");
    const target = await prisma.user.findUnique({ where: { id: userId } });
    if (!target) throw new BusinessError("Usuário não encontrado.");
    if (target.role === "ADMIN" && role !== "ADMIN") {
      const admins = await prisma.user.count({ where: { role: "ADMIN", active: true } });
      if (admins <= 1) throw new BusinessError("É preciso manter ao menos um administrador ativo.");
    }
    await prisma.user.update({ where: { id: userId }, data: { role } });
    await writeAudit({
      action: "USER_ROLE_CHANGED",
      entity: "user",
      entityId: userId,
      userId: user.id,
      userEmail: user.email,
      before: { email: target.email, role: target.role },
      after: { email: target.email, role },
    });
    revalidatePath("/admin/usuarios");
    return { ok: true, message: `Acesso de ${target.name} atualizado.` };
  } catch (err) {
    return { ok: false, error: errorMessage(err) };
  }
}

export async function setUserActiveAction(userId: string, active: boolean): Promise<ActionResult> {
  try {
    const user = await admin();
    if (userId === user.id && !active) throw new BusinessError("Você não pode desativar a própria conta.");
    const target = await prisma.user.findUnique({ where: { id: userId } });
    if (!target) throw new BusinessError("Usuário não encontrado.");
    if (!active && target.role === "ADMIN") {
      const admins = await prisma.user.count({ where: { role: "ADMIN", active: true } });
      if (admins <= 1) throw new BusinessError("É preciso manter ao menos um administrador ativo.");
    }
    await prisma.$transaction([
      prisma.user.update({ where: { id: userId }, data: { active } }),
      ...(active ? [] : [prisma.session.deleteMany({ where: { userId } })]),
    ]);
    await writeAudit({
      action: active ? "USER_ACTIVATED" : "USER_DEACTIVATED",
      entity: "user",
      entityId: userId,
      userId: user.id,
      userEmail: user.email,
      before: { email: target.email, active: target.active },
      after: { email: target.email, active },
    });
    revalidatePath("/admin/usuarios");
    return { ok: true, message: active ? "Usuário reativado." : "Usuário desativado e sessões encerradas." };
  } catch (err) {
    return { ok: false, error: errorMessage(err) };
  }
}

// ─────────────────────────── Configurações ───────────────────────────

const settingsSchema = z.object({
  storeName: z.string().trim().min(2),
  storeWhatsapp: z.string().trim().min(8),
  bottleCredit: z.coerce.number().min(0).max(100).transform((n) => n.toFixed(2)),
  deliveryFee: z.coerce.number().min(0).max(500).transform((n) => n.toFixed(2)),
  deliveryDays: z.coerce.number().int().min(0).max(30).transform(String),
  deliveryCities: z.string().trim().min(2, "Informe ao menos uma cidade."),
});

export async function saveSettingsAction(_: unknown, formData: FormData): Promise<ActionResult> {
  const parsed = settingsSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, error: "Verifique os campos.", fieldErrors: fieldErrors(parsed.error) };
  try {
    const user = await admin();
    const before = await getSettings();
    const keys = Object.keys(SETTING_DEFAULTS) as SettingKey[];
    await prisma.$transaction(
      keys.map((key) =>
        prisma.setting.upsert({ where: { key }, update: { value: parsed.data[key] }, create: { key, value: parsed.data[key] } }),
      ),
    );
    await writeAudit({ action: "SETTINGS_UPDATED", entity: "setting", userId: user.id, userEmail: user.email, before, after: parsed.data });
    revalidatePath("/", "layout");
    return { ok: true, message: "Configurações salvas." };
  } catch (err) {
    return { ok: false, error: errorMessage(err) };
  }
}

// ─────────────────────────── Fotos de produto ───────────────────────────

const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif", "image/gif"];
const MAX_IMAGE_BYTES = 3 * 1024 * 1024;
const MAX_IMAGES_PER_PRODUCT = 8;

/** Recebe uma foto por chamada (mantém cada requisição abaixo do limite de upload) */
export async function uploadProductImageAction(formData: FormData): Promise<ActionResult<{ id: string }>> {
  try {
    const user = await admin();
    const productId = String(formData.get("productId") ?? "");
    const file = formData.get("file");
    if (!(file instanceof File) || file.size === 0) throw new BusinessError("Selecione uma imagem.");
    if (!IMAGE_TYPES.includes(file.type)) throw new BusinessError("Formato não suportado. Use JPG, PNG, WEBP, AVIF ou GIF.");
    if (file.size > MAX_IMAGE_BYTES) throw new BusinessError(`${file.name} passa de 3 MB.`);

    const product = await prisma.product.findUnique({ where: { id: productId }, select: { id: true, name: true } });
    if (!product) throw new BusinessError("Produto não encontrado.");
    const count = await prisma.productImage.count({ where: { productId } });
    if (count >= MAX_IMAGES_PER_PRODUCT) throw new BusinessError(`Limite de ${MAX_IMAGES_PER_PRODUCT} fotos por produto.`);

    const last = await prisma.productImage.findFirst({ where: { productId }, orderBy: { position: "desc" }, select: { position: true } });
    // Envia ao bucket primeiro; se o registro no banco falhar, remove o objeto para não deixar órfão
    const key = await uploadProductImage(productId, file);
    let image: { id: string };
    try {
      image = await prisma.productImage.create({
        data: { productId, key, mimeType: file.type, size: file.size, position: (last?.position ?? -1) + 1 },
        select: { id: true },
      });
    } catch (err) {
      await deleteStoredObject(key).catch((e) => console.error(`[storage] falha ao remover objeto órfão ${key}`, e));
      throw err;
    }
    await writeAudit({
      action: "PRODUCT_IMAGE_ADDED",
      entity: "product",
      entityId: productId,
      userId: user.id,
      userEmail: user.email,
      after: { imageId: image.id, key, product: product.name, file: file.name, size: file.size, type: file.type },
    });
    revalidatePath("/admin/produtos");
    revalidatePath(`/produto/${productId}`);
    revalidatePath("/inicio");
    return { ok: true, data: image };
  } catch (err) {
    return { ok: false, error: errorMessage(err) };
  }
}

export async function deleteProductImageAction(imageId: string): Promise<ActionResult> {
  try {
    const user = await admin();
    const image = await prisma.productImage.delete({
      where: { id: imageId },
      select: { id: true, productId: true, key: true, mimeType: true, size: true },
    });
    // O registro já saiu do banco; uma falha no bucket só deixa um arquivo sem uso, então não bloqueia a remoção
    let storageError: string | null = null;
    await deleteStoredObject(image.key).catch((e) => {
      storageError = e instanceof Error ? e.message : String(e);
      console.error(`[storage] falha ao remover ${image.key}`, e);
    });
    await writeAudit({
      action: "PRODUCT_IMAGE_REMOVED",
      entity: "product",
      entityId: image.productId,
      userId: user.id,
      userEmail: user.email,
      before: { imageId: image.id, key: image.key, size: image.size, type: image.mimeType },
      error: storageError,
    });
    revalidatePath("/admin/produtos");
    revalidatePath(`/produto/${image.productId}`);
    revalidatePath("/inicio");
    return { ok: true, message: "Foto removida." };
  } catch (err) {
    return { ok: false, error: errorMessage(err) };
  }
}

/** Define a foto como capa (primeira do carrossel) */
export async function setProductCoverAction(imageId: string): Promise<ActionResult> {
  try {
    const user = await admin();
    const image = await prisma.productImage.findUnique({ where: { id: imageId }, select: { productId: true } });
    if (!image) throw new BusinessError("Foto não encontrada.");
    const images = await prisma.productImage.findMany({
      where: { productId: image.productId },
      orderBy: { position: "asc" },
      select: { id: true },
    });
    const ordered = [imageId, ...images.map((i) => i.id).filter((id) => id !== imageId)];
    await prisma.$transaction(ordered.map((id, position) => prisma.productImage.update({ where: { id }, data: { position } })));
    await writeAudit({
      action: "PRODUCT_IMAGE_COVER",
      entity: "product",
      entityId: image.productId,
      userId: user.id,
      userEmail: user.email,
      after: { coverImageId: imageId },
    });
    revalidatePath("/admin/produtos");
    revalidatePath(`/produto/${image.productId}`);
    revalidatePath("/inicio");
    return { ok: true, message: "Capa atualizada." };
  } catch (err) {
    return { ok: false, error: errorMessage(err) };
  }
}
