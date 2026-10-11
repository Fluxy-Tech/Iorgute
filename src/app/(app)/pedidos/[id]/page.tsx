import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Check, CircleX } from "lucide-react";
import { BackHeader } from "@/components/app/back-header";
import { StatusBadge } from "@/components/app/status-badge";
import { productThumb, productThumbSelect } from "@/lib/catalog";
import { ProductVisual } from "@/components/brand/product-visual";
import { ORDER_FLOW, PAYMENT_LABEL, STATUS_DESCRIPTION, STATUS_LABEL, type OrderStatusName } from "@/lib/constants";
import { currency, formatDate, formatDateTime, orderCode, toNumber } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { cn } from "@/lib/utils";
import { CancelOrderButton } from "./cancel-button";

export const metadata: Metadata = { title: "Pedido" };

const STEPS = ORDER_FLOW.filter((s) => s !== "CANCELADO");

export default async function OrderDetailPage({ params }: PageProps<"/pedidos/[id]">) {
  const user = await requireUser();
  const { id } = await params;
  const orderId = Number(id);
  if (!Number.isInteger(orderId)) notFound();

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      items: { include: { product: { select: productThumbSelect } } },
      statusLogs: { orderBy: { createdAt: "asc" } },
    },
  });
  if (!order || order.userId !== user.id) notFound();

  const status = order.status as OrderStatusName;
  const currentIndex = STEPS.indexOf(status as (typeof STEPS)[number]);
  const reachedAt = (s: OrderStatusName) => order.statusLogs.findLast((l) => l.toStatus === s)?.createdAt;

  return (
    <div className="flex flex-1 flex-col gap-4 px-4 pb-6 pt-6 lg:grid lg:grid-cols-2 lg:items-start lg:gap-6 lg:p-0">
      <div className="lg:col-span-2"><BackHeader title={`Pedido ${orderCode(order.id)}`} href="/pedidos" action={<StatusBadge status={status} />} /></div>

      <section className="surface px-4 py-4 lg:row-span-4 lg:px-6 lg:py-6">
        <p className="font-script text-xl font-bold text-wine">{STATUS_DESCRIPTION[status]}</p>
        <p className="text-xs text-muted-foreground">
          Feito em {formatDateTime(order.createdAt)} · Previsão {formatDate(order.estimatedDelivery)}
        </p>
        {status === "CANCELADO" ? (
          <div className="mt-4 flex items-center gap-2 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
            <CircleX className="size-4" /> Pedido cancelado
          </div>
        ) : (
          <ol className="mt-4 space-y-0">
            {STEPS.map((step, i) => {
              const done = i <= currentIndex;
              const at = reachedAt(step);
              return (
                <li key={step} className="relative flex gap-3 pb-4 last:pb-0">
                  {i < STEPS.length - 1 && (
                    <span className={cn("absolute left-[11px] top-6 h-[calc(100%-1.25rem)] w-0.5", i < currentIndex ? "bg-wine" : "bg-border")} />
                  )}
                  <span
                    className={cn(
                      "z-10 grid size-6 shrink-0 place-items-center rounded-full border-2",
                      done ? "border-wine bg-wine text-white" : "border-border bg-card",
                      i === currentIndex && "ring-4 ring-rose/20",
                    )}
                  >
                    {done && <Check className="size-3.5" strokeWidth={3} />}
                  </span>
                  <div className="-mt-0.5">
                    <p className={cn("text-sm font-semibold", done ? "text-cocoa" : "text-muted-foreground")}>{STATUS_LABEL[step]}</p>
                    {at && done && <p className="text-[11px] text-muted-foreground">{formatDateTime(at)}</p>}
                  </div>
                </li>
              );
            })}
          </ol>
        )}
      </section>

      <section className="surface divide-y divide-border/70">
        {order.items.map((item) => (
          <div key={item.id} className="flex items-center gap-3 px-3 py-3">
            <ProductVisual
              src={productThumb(item.product).imageUrl}
              color={item.product.color}
              alt={item.productName}
              className="size-14 shrink-0 rounded-lg bg-peach/30"
              bottleClassName="h-14 w-7"
              label={false}
            />
            <div className="flex-1">
              <p className="text-sm font-semibold text-cocoa">{item.productName}</p>
              <p className="text-xs text-muted-foreground">
                {item.quantity} × {currency(item.unitPrice)}
              </p>
            </div>
            <p className="text-sm font-semibold text-cocoa">{currency(item.total)}</p>
          </div>
        ))}
      </section>

      <section className="surface space-y-1.5 px-4 py-3 text-sm">
        <Row label="Subtotal" value={currency(order.subtotal)} />
        {toNumber(order.couponDiscount) > 0 && <Row label="Cupom" value={`− ${currency(order.couponDiscount)}`} />}
        {toNumber(order.bottleDiscount) > 0 && <Row label="Crédito de garrafas" value={`− ${currency(order.bottleDiscount)}`} />}
        <Row label="Entrega" value={toNumber(order.deliveryFee) > 0 ? currency(order.deliveryFee) : "Grátis"} />
        <div className="flex justify-between border-t border-border/70 pt-2 font-bold text-wine">
          <span>Total</span>
          <span>{currency(order.total)}</span>
        </div>
        <p className="pt-1 text-xs text-muted-foreground">Pagamento: {PAYMENT_LABEL[order.paymentMethod]}</p>
      </section>

      <section className="surface px-4 py-3 text-sm">
        <p className="font-semibold text-cocoa">Endereço de entrega</p>
        <p className="text-muted-foreground">{order.deliveryAddress}</p>
        {order.notes && <p className="mt-2 text-xs text-muted-foreground">Obs.: {order.notes}</p>}
      </section>

      {status === "RECEBIDO" && <CancelOrderButton orderId={order.id} />}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-semibold text-cocoa">{value}</span>
    </div>
  );
}
