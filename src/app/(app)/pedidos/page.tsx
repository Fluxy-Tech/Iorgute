import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { BackHeader } from "@/components/app/back-header";
import { StatusBadge } from "@/components/app/status-badge";
import { productThumb, productThumbSelect } from "@/lib/catalog";
import { ProductVisual } from "@/components/brand/product-visual";
import { Blobs } from "@/components/brand/decor";
import { ACTIVE_STATUSES, type OrderStatusName } from "@/lib/constants";
import { currency, formatDate, orderCode } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Meus pedidos" };

export default async function OrdersPage({ searchParams }: PageProps<"/pedidos">) {
  const user = await requireUser();
  const { aba } = await searchParams;
  const history = aba === "historico";

  const orders = await prisma.order.findMany({
    where: {
      userId: user.id,
      status: history ? { notIn: ACTIVE_STATUSES } : { in: ACTIVE_STATUSES },
    },
    include: { items: { include: { product: { select: productThumbSelect } } } },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return (
    <div className="relative flex flex-1 flex-col">
      <Blobs />
      <div className="relative z-10 flex flex-1 flex-col px-4 pb-6 pt-6 lg:p-0">
        <BackHeader title="Meus pedidos" href="/conta" />
        <div className="mt-4 grid grid-cols-2 gap-3 lg:max-w-md">
          <Tab href="/pedidos" active={!history}>Em andamento</Tab>
          <Tab href="/pedidos?aba=historico" active={history}>Histórico</Tab>
        </div>

        <div className="mt-4 flex flex-col gap-3 lg:grid lg:grid-cols-2 lg:gap-4">
          {orders.length === 0 && (
            <div className="surface px-4 py-10 text-center text-sm text-muted-foreground lg:col-span-2">
              {history ? "Nenhum pedido no histórico." : "Você não tem pedidos em andamento."}
              {!history && (
                <Link href="/inicio" className="mt-2 block font-semibold text-rose underline">
                  Fazer um pedido
                </Link>
              )}
            </div>
          )}
          {orders.map((order) => {
            const first = order.items[0];
            const thumb = first ? productThumb(first.product) : null;
            const extra = order.items.length - 1;
            const status = order.status as OrderStatusName;
            return (
              <Link key={order.id} href={`/pedidos/${order.id}`} className="surface block px-3 pb-2 pt-3 transition hover:border-rose/40">
                <div className="flex items-center gap-3">
                  <ProductVisual
                    src={thumb?.imageUrl}
                    color={thumb?.color ?? "#F2D3C2"}
                    alt={first?.productName ?? ""}
                    className="size-20 shrink-0 rounded-xl bg-peach/30"
                    bottleClassName="h-20 w-10"
                  />
                  <div className="flex-1">
                    <p className="text-sm font-bold text-cocoa">Pedido {orderCode(order.id)}</p>
                    <p className="text-xs text-muted-foreground">
                      {first?.productName.replace(" • ", " • ")}
                      {extra > 0 && ` +${extra} ${extra === 1 ? "item" : "itens"}`}
                    </p>
                    <p className="text-xs text-muted-foreground">{currency(order.total)}</p>
                    <StatusBadge status={status} className="mt-1.5" />
                  </div>
                  <ChevronRight className="size-5 text-cocoa/70" />
                </div>
                <div className="mt-2 flex justify-between border-t border-border/60 pt-2 text-[11px] text-muted-foreground">
                  <span>{status === "ENTREGUE" ? "Entregue em" : status === "CANCELADO" ? "Pedido em" : "Previsão de entrega"}</span>
                  <span>
                    {formatDate(
                      status === "ENTREGUE" && order.deliveredAt
                        ? order.deliveredAt
                        : status === "CANCELADO"
                          ? order.createdAt
                          : order.estimatedDelivery,
                    )}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function Tab({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className={cn(
        "rounded-full border-2 py-2 text-center text-sm font-semibold transition",
        active ? "border-wine bg-wine text-primary-foreground" : "border-wine/30 text-wine hover:bg-wine/5",
      )}
    >
      {children}
    </Link>
  );
}
