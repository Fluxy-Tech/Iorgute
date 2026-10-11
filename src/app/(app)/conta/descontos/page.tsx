import type { Metadata } from "next";
import { BottleWine, TicketPercent } from "lucide-react";
import { BackHeader } from "@/components/app/back-header";
import { Blobs } from "@/components/brand/decor";
import { currency, formatDate, toNumber } from "@/lib/format";
import { getBottleSummary } from "@/lib/discounts";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";

export const metadata: Metadata = { title: "Meus descontos" };

export default async function DiscountsPage() {
  const user = await requireUser();
  const now = new Date();
  const [bottles, coupons, used] = await Promise.all([
    getBottleSummary(user.id),
    prisma.coupon.findMany({
      where: {
        active: true,
        OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
        redemptions: { none: { userId: user.id } },
      },
      include: { _count: { select: { redemptions: true } } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.couponRedemption.findMany({
      where: { userId: user.id },
      include: { coupon: true },
      orderBy: { createdAt: "desc" },
    }),
  ]);
  const available = coupons.filter((c) => c.maxUses == null || c._count.redemptions < c.maxUses);

  return (
    <div className="relative flex flex-1 flex-col">
      <Blobs />
      <div className="relative z-10 flex flex-1 flex-col gap-4 px-4 pb-6 pt-6 lg:p-0">
        <BackHeader title="Meus descontos" href="/conta" />

        <div className="flex items-center gap-4 rounded-2xl bg-wine px-5 py-5 text-primary-foreground shadow-md lg:px-8 lg:py-7">
          <BottleWine className="size-10" strokeWidth={1.4} />
          <div>
            <p className="text-sm opacity-90">Crédito de garrafas</p>
            <p className="text-2xl font-bold">{currency(bottles.balance)}</p>
            <p className="text-xs opacity-80">Aplicado automaticamente no carrinho</p>
          </div>
        </div>

        <h2 className="font-script text-xl font-bold text-cocoa">Cupons disponíveis</h2>
        {available.length === 0 ? (
          <p className="surface px-4 py-6 text-center text-sm text-muted-foreground">Nenhum cupom disponível no momento.</p>
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
          {available.map((c) => (
            <div key={c.id} className="surface relative flex items-center gap-4 overflow-hidden px-4 py-4">
              <span className="absolute inset-y-0 left-0 w-1.5 bg-gold" />
              <TicketPercent className="size-8 text-wine" strokeWidth={1.5} />
              <div className="flex-1">
                <p className="text-lg font-bold tracking-wide text-wine">{c.code}</p>
                <p className="text-sm text-cocoa">{c.description}</p>
                <p className="text-xs text-muted-foreground">
                  {c.type === "PERCENT" ? `${toNumber(c.value)}% de desconto` : `${currency(c.value)} de desconto`}
                  {toNumber(c.minOrder) > 0 && ` · mínimo ${currency(c.minOrder)}`}
                  {c.expiresAt && ` · até ${formatDate(c.expiresAt)}`}
                </p>
              </div>
            </div>
          ))}
          </div>
        )}

        {used.length > 0 && (
          <>
            <h2 className="font-script text-xl font-bold text-cocoa">Já utilizados</h2>
            <div className="surface divide-y divide-border/60 lg:max-w-2xl">
              {used.map((u) => (
                <div key={u.id} className="flex justify-between px-4 py-3 text-sm">
                  <span className="text-cocoa">
                    {u.coupon.code}
                    <span className="block text-xs text-muted-foreground">{formatDate(u.createdAt)}</span>
                  </span>
                  <span className="font-semibold text-[#3E7B3A]">− {currency(u.amount)}</span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
