import "server-only";
import { prisma } from "@/lib/prisma";
import { toNumber } from "@/lib/format";
import { ACTIVE_STATUSES, ORDER_FLOW, type OrderStatusName } from "@/lib/constants";

const TZ = "America/Sao_Paulo";

export type Period = 7 | 30 | 90;

function range(days: number) {
  const end = new Date();
  const start = new Date(end);
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - (days - 1));
  const prevStart = new Date(start);
  prevStart.setDate(prevStart.getDate() - days);
  return { start, end, prevStart };
}

function pct(current: number, previous: number) {
  if (previous === 0) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 1000) / 10;
}

/** Lista de dias (yyyy-mm-dd no fuso da loja) para preencher séries sem buracos */
function dayKeys(start: Date, days: number) {
  const fmt = new Intl.DateTimeFormat("en-CA", { timeZone: TZ });
  return Array.from({ length: days }, (_, i) => {
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    return fmt.format(d);
  });
}

async function periodTotals(from: Date, to: Date) {
  const [orders, bottles, newCustomers] = await Promise.all([
    prisma.order.aggregate({
      where: { createdAt: { gte: from, lt: to }, status: { not: "CANCELADO" } },
      _sum: { total: true, bottleDiscount: true, couponDiscount: true },
      _count: true,
    }),
    prisma.bottleReturn.aggregate({
      where: { createdAt: { gte: from, lt: to } },
      _sum: { quantity: true, credit: true },
    }),
    prisma.user.count({ where: { role: "CUSTOMER", createdAt: { gte: from, lt: to } } }),
  ]);
  const revenue = toNumber(orders._sum.total);
  return {
    revenue,
    orders: orders._count,
    avgTicket: orders._count ? revenue / orders._count : 0,
    discounts: toNumber(orders._sum.bottleDiscount) + toNumber(orders._sum.couponDiscount),
    bottles: bottles._sum.quantity ?? 0,
    credits: toNumber(bottles._sum.credit),
    newCustomers,
  };
}

export async function getDashboard(days: Period) {
  const { start, end, prevStart } = range(days);

  const [current, previous, inProgress, salesRows, bottleRows, byStatus, topProducts, topCollectors, topBuyers, soldReturnable] =
    await Promise.all([
      periodTotals(start, end),
      periodTotals(prevStart, start),
      prisma.order.count({ where: { status: { in: ACTIVE_STATUSES } } }),
      prisma.$queryRaw<{ day: string; revenue: number; orders: number }[]>`
        SELECT to_char(("createdAt" AT TIME ZONE 'UTC') AT TIME ZONE ${TZ}, 'YYYY-MM-DD') AS day,
               COALESCE(SUM("total"), 0)::float AS revenue,
               COUNT(*)::int AS orders
        FROM "order"
        WHERE "createdAt" >= ${start} AND "status" <> 'CANCELADO'
        GROUP BY 1 ORDER BY 1`,
      prisma.$queryRaw<{ day: string; bottles: number }[]>`
        SELECT to_char(("createdAt" AT TIME ZONE 'UTC') AT TIME ZONE ${TZ}, 'YYYY-MM-DD') AS day,
               COALESCE(SUM("quantity"), 0)::int AS bottles
        FROM "bottle_return"
        WHERE "createdAt" >= ${start}
        GROUP BY 1 ORDER BY 1`,
      prisma.order.groupBy({ by: ["status"], where: { createdAt: { gte: start } }, _count: true }),
      prisma.$queryRaw<{ name: string; quantity: number; revenue: number }[]>`
        SELECT i."productName" AS name, SUM(i."quantity")::int AS quantity, SUM(i."total")::float AS revenue
        FROM "order_item" i JOIN "order" o ON o."id" = i."orderId"
        WHERE o."createdAt" >= ${start} AND o."status" <> 'CANCELADO'
        GROUP BY 1 ORDER BY 2 DESC LIMIT 6`,
      prisma.$queryRaw<{ id: string; name: string; email: string; bottles: number; credit: number }[]>`
        SELECT u."id", u."name", u."email", SUM(b."quantity")::int AS bottles, SUM(b."credit")::float AS credit
        FROM "bottle_return" b JOIN "user" u ON u."id" = b."userId"
        WHERE b."createdAt" >= ${start}
        GROUP BY 1, 2, 3 ORDER BY 4 DESC LIMIT 5`,
      prisma.$queryRaw<{ id: string; name: string; email: string; orders: number; total: number }[]>`
        SELECT u."id", u."name", u."email", COUNT(o."id")::int AS orders, SUM(o."total")::float AS total
        FROM "order" o JOIN "user" u ON u."id" = o."userId"
        WHERE o."createdAt" >= ${start} AND o."status" <> 'CANCELADO'
        GROUP BY 1, 2, 3 ORDER BY 5 DESC LIMIT 5`,
      prisma.$queryRaw<{ quantity: number }[]>`
        SELECT COALESCE(SUM(i."quantity"), 0)::int AS quantity
        FROM "order_item" i
        JOIN "order" o ON o."id" = i."orderId"
        JOIN "product" p ON p."id" = i."productId"
        WHERE o."createdAt" >= ${start} AND o."status" <> 'CANCELADO' AND p."returnable" = true`,
    ]);

  const keys = dayKeys(start, days);
  const daily = keys.map((day) => {
    const s = salesRows.find((r) => r.day === day);
    const b = bottleRows.find((r) => r.day === day);
    return { day, revenue: s?.revenue ?? 0, orders: s?.orders ?? 0, bottles: b?.bottles ?? 0 };
  });

  const statusCounts = ORDER_FLOW.map((status) => ({
    status,
    count: byStatus.find((s) => s.status === status)?._count ?? 0,
  })) as { status: OrderStatusName; count: number }[];

  const sold = soldReturnable[0]?.quantity ?? 0;

  return {
    current,
    previous,
    change: {
      revenue: pct(current.revenue, previous.revenue),
      orders: pct(current.orders, previous.orders),
      avgTicket: pct(current.avgTicket, previous.avgTicket),
      bottles: pct(current.bottles, previous.bottles),
      newCustomers: pct(current.newCustomers, previous.newCustomers),
    },
    inProgress,
    daily,
    statusCounts,
    topProducts,
    topCollectors,
    topBuyers,
    returnRate: sold > 0 ? Math.round((current.bottles / sold) * 1000) / 10 : 0,
    soldReturnable: sold,
  };
}
