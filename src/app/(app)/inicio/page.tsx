import type { Metadata } from "next";
import Link from "next/link";
import { BottleWine, ChevronRight, Truck } from "lucide-react";
import { Greeting } from "@/components/app/greeting";
import { StatusBadge } from "@/components/app/status-badge";
import { TopBar, Waves } from "@/components/app/top-bar";
import { getBottleSummary } from "@/lib/discounts";
import { getCatalogProducts } from "@/lib/catalog";
import { currency, formatDate, orderCode } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { ACTIVE_STATUSES, type OrderStatusName } from "@/lib/constants";
import { CartAside, CartBar, ProductCard } from "./catalog";

export const metadata: Metadata = { title: "Início" };

export default async function HomePage() {
  const user = await requireUser();
  const [products, bottles, activeOrder] = await Promise.all([
    getCatalogProducts(),
    getBottleSummary(user.id),
    prisma.order.findFirst({
      where: { userId: user.id, status: { in: ACTIVE_STATUSES } },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return (
    <div className="relative flex flex-1 flex-col">
      <Waves />
      <TopBar />
      <div className="relative z-10 flex flex-1 flex-col gap-4 px-4 pb-28 pt-4 lg:grid lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start lg:gap-8 lg:px-0 lg:pb-8 lg:pt-0">
        <div className="flex flex-col gap-4 lg:gap-6">
          <div className="grid gap-4 lg:grid-cols-2">
            <div className={!activeOrder && bottles.balance <= 0 ? "lg:col-span-2" : ""}>
              <Greeting name={user.name} subtitle="O que vamos saborear hoje?" />
            </div>
            {(activeOrder || bottles.balance > 0) && (
              <div className="flex flex-col gap-3 lg:justify-center">
                {activeOrder && (
                  <Link href={`/pedidos/${activeOrder.id}`} className="surface flex items-center gap-3 px-4 py-3 transition hover:border-rose/40">
                    <Truck className="size-6 text-wine" />
                    <div className="flex-1 text-sm">
                      <p className="font-semibold text-cocoa">Pedido {orderCode(activeOrder.id)}</p>
                      <p className="text-xs text-muted-foreground">Previsão {formatDate(activeOrder.estimatedDelivery)}</p>
                    </div>
                    <StatusBadge status={activeOrder.status as OrderStatusName} />
                    <ChevronRight className="size-4 text-cocoa/60" />
                  </Link>
                )}
                {bottles.balance > 0 && (
                  <Link
                    href="/conta/garrafas"
                    className="flex items-center gap-3 rounded-2xl bg-wine px-4 py-3 text-primary-foreground shadow-md transition hover:bg-wine-dark"
                  >
                    <BottleWine className="size-7" />
                    <p className="flex-1 text-sm">
                      Você tem <strong>{currency(bottles.balance)}</strong> de desconto por garrafas devolvidas!
                    </p>
                    <ChevronRight className="size-5" />
                  </Link>
                )}
              </div>
            )}
          </div>

          <div>
            <h2 className="font-script text-2xl font-bold text-wine lg:text-3xl">Nossos iogurtes</h2>
            <p className="hidden text-sm text-muted-foreground lg:block">
              Feitos à mão, em pequenos lotes, com ingredientes 100% naturais.
            </p>
          </div>
          {products.length === 0 ? (
            <p className="surface px-4 py-8 text-center text-sm text-muted-foreground">
              Nenhum produto disponível no momento.
            </p>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:gap-5 xl:grid-cols-4">
              {products.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          )}
        </div>

        <CartAside bottleBalance={bottles.balance} />
      </div>
      <CartBar />
    </div>
  );
}
