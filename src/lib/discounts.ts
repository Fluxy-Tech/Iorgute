import "server-only";
import { prisma } from "@/lib/prisma";
import { toNumber } from "@/lib/format";

/** Saldo de crédito de garrafas = créditos recebidos − créditos usados em pedidos não cancelados */
export async function getBottleSummary(userId: string) {
  const [returns, used] = await Promise.all([
    prisma.bottleReturn.aggregate({
      where: { userId },
      _sum: { quantity: true, credit: true },
    }),
    prisma.order.aggregate({
      where: { userId, status: { not: "CANCELADO" } },
      _sum: { bottleDiscount: true },
    }),
  ]);
  const earned = toNumber(returns._sum.credit);
  const spent = toNumber(used._sum.bottleDiscount);
  return {
    bottles: returns._sum.quantity ?? 0,
    earned,
    spent,
    balance: Math.max(0, Math.round((earned - spent) * 100) / 100),
  };
}
