import type { Metadata } from "next";
import { PageHeader } from "@/components/admin/page-header";
import { ACTIVE_STATUSES, type OrderStatusName } from "@/lib/constants";
import { orderCode, toNumber } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/session";
import { productThumb, productThumbSelect } from "@/lib/catalog";
import { Kanban, type KanbanOrder } from "./kanban";

export const metadata: Metadata = { title: "Esteira de pedidos" };

export default async function OrdersBoardPage({ searchParams }: PageProps<"/admin/pedidos">) {
  await requireRole(["ADMIN", "STAFF"]);
  const { finalizados } = await searchParams;
  const finishedDays = [3, 7, 30].includes(Number(finalizados)) ? Number(finalizados) : 3;
  const since = new Date();
  since.setDate(since.getDate() - finishedDays);

  const orders = await prisma.order.findMany({
    where: {
      OR: [{ status: { in: ACTIVE_STATUSES } }, { status: { in: ["ENTREGUE", "CANCELADO"] }, updatedAt: { gte: since } }],
    },
    include: {
      user: { select: { name: true, email: true, phone: true } },
      items: { include: { product: { select: productThumbSelect } } },
      statusLogs: { orderBy: { createdAt: "asc" }, include: { user: { select: { name: true } } } },
    },
    orderBy: { createdAt: "asc" },
  });

  const data: KanbanOrder[] = orders.map((o) => ({
    id: o.id,
    code: orderCode(o.id),
    status: o.status as OrderStatusName,
    customer: o.user.name,
    email: o.user.email,
    phone: o.user.phone,
    total: toNumber(o.total),
    subtotal: toNumber(o.subtotal),
    discounts: toNumber(o.bottleDiscount) + toNumber(o.couponDiscount),
    paymentMethod: o.paymentMethod,
    address: o.deliveryAddress,
    notes: o.notes,
    createdAt: o.createdAt.toISOString(),
    estimatedDelivery: o.estimatedDelivery.toISOString(),
    items: o.items.map((i) => ({ name: i.productName, quantity: i.quantity, total: toNumber(i.total), ...productThumb(i.product) })),
    history: o.statusLogs.map((l) => ({
      to: l.toStatus as OrderStatusName,
      by: l.user?.name ?? "Sistema",
      note: l.note,
      at: l.createdAt.toISOString(),
    })),
  }));

  return (
    <>
      <PageHeader
        title="Esteira de pedidos"
        description="Arraste os cartões entre as etapas para atualizar o status. O cliente é notificado a cada mudança."
      />
      <Kanban orders={data} finishedDays={finishedDays} />
    </>
  );
}
