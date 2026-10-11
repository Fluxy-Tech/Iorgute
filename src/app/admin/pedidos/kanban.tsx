"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, useTransition } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  TouchSensor,
  KeyboardSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { ArrowRight, Clock, GripVertical, Loader2, Search, XCircle } from "lucide-react";
import { toast } from "sonner";
import { moveOrderAction } from "@/actions/admin";
import { StatusBadge } from "@/components/app/status-badge";
import { ProductVisual } from "@/components/brand/product-visual";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { ORDER_FLOW, PAYMENT_LABEL, STATUS_ACCENT, STATUS_LABEL, type OrderStatusName } from "@/lib/constants";
import { currency, formatDate, formatDateTime, timeAgo } from "@/lib/format";
import { cn } from "@/lib/utils";

export type KanbanOrder = {
  id: number;
  code: string;
  status: OrderStatusName;
  customer: string;
  email: string;
  phone: string | null;
  total: number;
  subtotal: number;
  discounts: number;
  paymentMethod: keyof typeof PAYMENT_LABEL;
  address: string;
  notes: string | null;
  createdAt: string;
  estimatedDelivery: string;
  items: { name: string; quantity: number; total: number; color: string; imageUrl: string | null }[];
  history: { to: OrderStatusName; by: string; note: string | null; at: string }[];
};

function nextStatus(status: OrderStatusName): OrderStatusName | null {
  const flow = ORDER_FLOW.filter((s) => s !== "CANCELADO");
  const i = flow.indexOf(status as (typeof flow)[number]);
  return i >= 0 && i < flow.length - 1 ? flow[i + 1] : null;
}

export function Kanban({ orders: initial, finishedDays }: { orders: KanbanOrder[]; finishedDays: number }) {
  const router = useRouter();
  const [orders, setOrders] = useState(initial);
  const [query, setQuery] = useState("");
  const [dragging, setDragging] = useState<KanbanOrder | null>(null);
  const [selected, setSelected] = useState<number | null>(null);
  const [pending, startTransition] = useTransition();

  // eslint-disable-next-line react-hooks/set-state-in-effect -- sincroniza após router.refresh()
  useEffect(() => setOrders(initial), [initial]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 180, tolerance: 6 } }),
    useSensor(KeyboardSensor),
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return orders;
    return orders.filter((o) => o.code.includes(q) || o.customer.toLowerCase().includes(q) || o.email.toLowerCase().includes(q));
  }, [orders, query]);

  function move(order: KanbanOrder, to: OrderStatusName) {
    if (order.status === to) return;
    if (order.status === "CANCELADO") {
      toast.error("Pedidos cancelados não podem voltar para a esteira.");
      return;
    }
    const previous = orders;
    setOrders((list) => list.map((o) => (o.id === order.id ? { ...o, status: to } : o)));
    startTransition(async () => {
      const res = await moveOrderAction({ orderId: order.id, to });
      if (res.ok) {
        toast.success(`${order.code} → ${STATUS_LABEL[to]}`);
        router.refresh();
      } else {
        setOrders(previous);
        toast.error(res.error);
      }
    });
  }

  function onDragStart(e: DragStartEvent) {
    setDragging(orders.find((o) => o.id === e.active.id) ?? null);
  }

  function onDragEnd(e: DragEndEvent) {
    setDragging(null);
    const order = orders.find((o) => o.id === e.active.id);
    const to = e.over?.id as OrderStatusName | undefined;
    if (order && to) move(order, to);
  }

  const current = orders.find((o) => o.id === selected) ?? null;

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <label className="flex h-10 w-full max-w-xs items-center gap-2 rounded-xl border border-input bg-card px-3">
          <Search className="size-4 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por pedido ou cliente"
            className="w-full bg-transparent text-sm outline-none"
          />
        </label>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          Finalizados dos últimos
          {[3, 7, 30].map((d) => (
            <Link
              key={d}
              href={`/admin/pedidos?finalizados=${d}`}
              className={cn("rounded-lg px-2 py-1 font-semibold", d === finishedDays ? "bg-wine text-primary-foreground" : "hover:bg-muted")}
            >
              {d}d
            </Link>
          ))}
        </div>
        {pending && <Loader2 className="size-4 animate-spin text-wine" />}
      </div>

      <DndContext sensors={sensors} onDragStart={onDragStart} onDragEnd={onDragEnd} onDragCancel={() => setDragging(null)}>
        <div className="flex gap-4 overflow-x-auto pb-4">
          {ORDER_FLOW.map((status) => {
            const list = filtered.filter((o) => o.status === status);
            return (
              <Column key={status} status={status} count={list.length} total={list.reduce((s, o) => s + o.total, 0)}>
                {list.map((order) => (
                  <OrderCard key={order.id} order={order} onOpen={() => setSelected(order.id)} onAdvance={move} />
                ))}
              </Column>
            );
          })}
        </div>
        <DragOverlay>{dragging && <CardBody order={dragging} overlay />}</DragOverlay>
      </DndContext>

      <Sheet open={!!current} onOpenChange={(o) => !o && setSelected(null)}>
        <SheetContent className="w-full overflow-y-auto bg-background sm:max-w-md">
          {current && <OrderDetail order={current} onMove={(to) => move(current, to)} />}
        </SheetContent>
      </Sheet>
    </>
  );
}

function Column({
  status,
  count,
  total,
  children,
}: {
  status: OrderStatusName;
  count: number;
  total: number;
  children: React.ReactNode;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: status });
  return (
    <section
      ref={setNodeRef}
      className={cn(
        "flex w-72 shrink-0 flex-col rounded-2xl border border-border/70 bg-muted/50 transition",
        isOver && "border-rose bg-peach/40 ring-2 ring-rose/30",
      )}
    >
      <header className="rounded-t-2xl border-b border-border/60 px-4 py-3" style={{ borderTop: `4px solid ${STATUS_ACCENT[status]}` }}>
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-cocoa">{STATUS_LABEL[status]}</h2>
          <span className="rounded-full bg-card px-2 py-0.5 text-xs font-bold text-cocoa">{count}</span>
        </div>
        <p className="text-xs text-muted-foreground">{currency(total)}</p>
      </header>
      <div className="flex min-h-40 flex-1 flex-col gap-2 p-2">
        {children}
        {count === 0 && <p className="py-6 text-center text-xs text-muted-foreground">Solte pedidos aqui</p>}
      </div>
    </section>
  );
}

function OrderCard({
  order,
  onOpen,
  onAdvance,
}: {
  order: KanbanOrder;
  onOpen: () => void;
  onAdvance: (order: KanbanOrder, to: OrderStatusName) => void;
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: order.id, disabled: order.status === "CANCELADO" });
  const next = nextStatus(order.status);
  return (
    <div ref={setNodeRef} className={cn(isDragging && "opacity-30")}>
      <CardBody
        order={order}
        handle={
          order.status !== "CANCELADO" && (
            <button {...listeners} {...attributes} aria-label="Arrastar" className="cursor-grab touch-none text-muted-foreground active:cursor-grabbing">
              <GripVertical className="size-4" />
            </button>
          )
        }
        onOpen={onOpen}
        footer={
          next && (
            <button
              onClick={() => onAdvance(order, next)}
              className="mt-2 flex w-full items-center justify-center gap-1 rounded-lg bg-secondary py-1.5 text-xs font-semibold text-wine transition hover:bg-peach"
            >
              {STATUS_LABEL[next]} <ArrowRight className="size-3.5" />
            </button>
          )
        }
      />
    </div>
  );
}

function CardBody({
  order,
  handle,
  footer,
  onOpen,
  overlay,
}: {
  order: KanbanOrder;
  handle?: React.ReactNode;
  footer?: React.ReactNode;
  onOpen?: () => void;
  overlay?: boolean;
}) {
  const late = !["ENTREGUE", "CANCELADO"].includes(order.status) && new Date(order.estimatedDelivery) < new Date();
  const units = order.items.reduce((s, i) => s + i.quantity, 0);
  return (
    <article className={cn("rounded-xl border border-border/70 bg-card p-3 shadow-sm", overlay && "rotate-2 shadow-xl")}>
      <div className="flex items-start gap-2">
        {handle}
        <button onClick={onOpen} className="min-w-0 flex-1 text-left">
          <div className="flex items-center justify-between gap-2">
            <span className="font-bold text-wine">{order.code}</span>
            <span className="text-sm font-bold text-cocoa">{currency(order.total)}</span>
          </div>
          <p className="truncate text-sm text-cocoa">{order.customer}</p>
          <div className="mt-2 flex items-center gap-1">
            {order.items.slice(0, 4).map((item, i) => (
              <ProductVisual
                key={i}
                src={item.imageUrl}
                color={item.color}
                alt={item.name}
                className="size-8 rounded-md bg-peach/30"
                bottleClassName="h-8 w-4"
                label={false}
              />
            ))}
            <span className="ml-1 text-xs text-muted-foreground">
              {units} {units === 1 ? "unidade" : "unidades"}
            </span>
          </div>
          <p className={cn("mt-2 flex items-center gap-1 text-[11px]", late ? "font-semibold text-destructive" : "text-muted-foreground")}>
            <Clock className="size-3" />
            {late ? "Atrasado · " : ""}Entrega {formatDate(order.estimatedDelivery)} · {timeAgo(order.createdAt)}
          </p>
        </button>
      </div>
      {footer}
    </article>
  );
}

function OrderDetail({ order, onMove }: { order: KanbanOrder; onMove: (to: OrderStatusName) => void }) {
  const next = nextStatus(order.status);
  return (
    <>
      <SheetHeader>
        <SheetTitle className="flex items-center gap-3 text-xl text-wine">
          Pedido {order.code} <StatusBadge status={order.status} />
        </SheetTitle>
        <SheetDescription>Criado em {formatDateTime(order.createdAt)}</SheetDescription>
      </SheetHeader>
      <div className="space-y-4 px-4 pb-6 text-sm">
        <div className="surface px-4 py-3">
          <p className="font-semibold text-cocoa">{order.customer}</p>
          <p className="text-muted-foreground">{order.email}</p>
          {order.phone && <p className="text-muted-foreground">{order.phone}</p>}
          <p className="mt-2 text-muted-foreground">{order.address}</p>
          {order.notes && <p className="mt-2 rounded-lg bg-peach/40 px-2 py-1 text-cocoa">Obs.: {order.notes}</p>}
        </div>
        <div className="surface divide-y divide-border/60">
          {order.items.map((i, idx) => (
            <div key={idx} className="flex items-center gap-3 px-4 py-2">
              <ProductVisual src={i.imageUrl} color={i.color} alt={i.name} className="size-10 shrink-0 rounded-md bg-peach/30" bottleClassName="h-10 w-5" label={false} />
              <span className="flex-1">
                {i.quantity}× {i.name}
              </span>
              <span className="font-semibold">{currency(i.total)}</span>
            </div>
          ))}
          <div className="space-y-1 px-4 py-2">
            <div className="flex justify-between text-muted-foreground">
              <span>Subtotal</span>
              <span>{currency(order.subtotal)}</span>
            </div>
            {order.discounts > 0 && (
              <div className="flex justify-between text-[#3E7B3A]">
                <span>Descontos</span>
                <span>− {currency(order.discounts)}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-wine">
              <span>Total · {PAYMENT_LABEL[order.paymentMethod]}</span>
              <span>{currency(order.total)}</span>
            </div>
          </div>
        </div>

        {order.status !== "CANCELADO" && (
          <div className="flex flex-col gap-2">
            {next && (
              <Button className="h-10 rounded-xl bg-wine hover:bg-wine-dark" onClick={() => onMove(next)}>
                Mover para {STATUS_LABEL[next]} <ArrowRight />
              </Button>
            )}
            <div className="grid grid-cols-2 gap-2">
              {ORDER_FLOW.filter((s) => s !== order.status && s !== next && s !== "CANCELADO").map((s) => (
                <Button key={s} variant="outline" className="h-9 rounded-lg text-xs" onClick={() => onMove(s)}>
                  {STATUS_LABEL[s]}
                </Button>
              ))}
            </div>
            <Button variant="destructive" className="h-9 rounded-lg" onClick={() => onMove("CANCELADO")}>
              <XCircle /> Cancelar pedido
            </Button>
          </div>
        )}

        <div>
          <p className="mb-2 font-semibold text-cocoa">Histórico da esteira</p>
          <ol className="space-y-2 border-l-2 border-border pl-4">
            {order.history.map((h, i) => (
              <li key={i} className="relative">
                <span className="absolute -left-[21px] top-1 size-3 rounded-full border-2 border-card" style={{ background: STATUS_ACCENT[h.to] }} />
                <p className="font-semibold text-cocoa">{STATUS_LABEL[h.to]}</p>
                <p className="text-xs text-muted-foreground">
                  {formatDateTime(h.at)} · {h.by}
                  {h.note && ` · ${h.note}`}
                </p>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </>
  );
}
