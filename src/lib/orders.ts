import "server-only";
import { prisma } from "@/lib/prisma";
import { writeAudit } from "@/lib/audit";
import { orderCode, toNumber } from "@/lib/format";
import { STATUS_DESCRIPTION, STATUS_LABEL, type OrderStatusName } from "@/lib/constants";
import type { CurrentUser } from "@/lib/session";
import type { Prisma } from "@/generated/prisma/client";

type Tx = Prisma.TransactionClient;

export class OrderError extends Error {
  name = "BusinessError";
}

/** Valida um cupom para um cliente e retorna o desconto calculado */
export async function evaluateCoupon(db: Tx | typeof prisma, code: string, userId: string, subtotal: number) {
  const coupon = await db.coupon.findUnique({
    where: { code: code.trim().toUpperCase() },
    include: { _count: { select: { redemptions: true } } },
  });
  if (!coupon || !coupon.active) throw new OrderError("Cupom inválido.");
  if (coupon.expiresAt && coupon.expiresAt < new Date()) throw new OrderError("Este cupom expirou.");
  if (coupon.maxUses != null && coupon._count.redemptions >= coupon.maxUses) throw new OrderError("Este cupom esgotou.");
  const used = await db.couponRedemption.findUnique({ where: { couponId_userId: { couponId: coupon.id, userId } } });
  if (used) throw new OrderError("Você já utilizou este cupom.");
  const minOrder = toNumber(coupon.minOrder);
  if (subtotal < minOrder) {
    throw new OrderError(`Cupom válido para pedidos a partir de R$ ${minOrder.toFixed(2).replace(".", ",")}.`);
  }
  const value = toNumber(coupon.value);
  const raw = coupon.type === "PERCENT" ? (subtotal * value) / 100 : value;
  const discount = Math.min(subtotal, Math.round(raw * 100) / 100);
  return { coupon, discount };
}

/**
 * Move o pedido na esteira: grava histórico, ajusta estoque em cancelamentos,
 * notifica o cliente e registra auditoria.
 */
export async function changeOrderStatus(params: {
  orderId: number;
  to: OrderStatusName;
  actor: Pick<CurrentUser, "id" | "email">;
  note?: string | null;
  position?: number;
}) {
  const { orderId, to, actor, note, position } = params;

  const result = await prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({ where: { id: orderId }, include: { items: true } });
    if (!order) throw new OrderError("Pedido não encontrado.");
    const from = order.status as OrderStatusName;

    if (from === to) {
      if (position !== undefined && position !== order.position) {
        await tx.order.update({ where: { id: orderId }, data: { position } });
      }
      return { order, from, changed: false };
    }
    if (from === "CANCELADO") throw new OrderError("Pedidos cancelados não podem voltar para a esteira.");

    // Estoque: devolve ao cancelar
    if (to === "CANCELADO") {
      for (const item of order.items) {
        await tx.product.update({ where: { id: item.productId }, data: { stock: { increment: item.quantity } } });
      }
      await tx.couponRedemption.deleteMany({ where: { orderId } });
    }

    const updated = await tx.order.update({
      where: { id: orderId },
      data: {
        status: to,
        position: position ?? 0,
        deliveredAt: to === "ENTREGUE" ? new Date() : from === "ENTREGUE" ? null : undefined,
      },
    });
    await tx.orderStatusLog.create({
      data: { orderId, fromStatus: from, toStatus: to, changedBy: actor.id, note: note ?? null },
    });
    await tx.notification.create({
      data: {
        userId: order.userId,
        title: `Pedido ${orderCode(orderId)}: ${STATUS_LABEL[to]}`,
        message: STATUS_DESCRIPTION[to],
        link: `/pedidos/${orderId}`,
      },
    });
    return { order: updated, from, changed: true };
  });

  if (result.changed) {
    await writeAudit({
      action: "ORDER_STATUS_CHANGED",
      entity: "order",
      entityId: orderId,
      userId: actor.id,
      userEmail: actor.email,
      before: { status: result.from },
      after: { status: to, note: note ?? undefined },
    });
  }
  return result;
}
