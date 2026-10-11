import type { Metadata } from "next";
import Link from "next/link";
import { ArrowDownRight, ArrowUpRight, BottleWine, Clock, DollarSign, Percent, Receipt, ShoppingBag, TicketPercent, UserPlus } from "lucide-react";
import { PageHeader } from "@/components/admin/page-header";
import { getDashboard, type Period } from "@/lib/metrics";
import { currency } from "@/lib/format";
import { requireRole } from "@/lib/session";
import { STATUS_LABEL } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { BarList, DailyBars, RevenueArea } from "./charts";

export const metadata: Metadata = { title: "Painel" };

const PERIODS: Period[] = [7, 30, 90];

export default async function DashboardPage({ searchParams }: PageProps<"/admin">) {
  await requireRole(["ADMIN", "STAFF"]);
  const { dias } = await searchParams;
  const days = (PERIODS.includes(Number(dias) as Period) ? Number(dias) : 30) as Period;
  const d = await getDashboard(days);

  return (
    <>
      <PageHeader
        title="Painel"
        description={`Métricas de vendas e coleta de vasilhames — últimos ${days} dias, comparado ao período anterior.`}
        actions={
          <div className="flex rounded-xl border border-border bg-card p-1">
            {PERIODS.map((p) => (
              <Link
                key={p}
                href={`/admin?dias=${p}`}
                className={cn(
                  "rounded-lg px-3 py-1.5 text-sm font-semibold transition",
                  p === days ? "bg-wine text-primary-foreground" : "text-cocoa hover:bg-muted",
                )}
              >
                {p} dias
              </Link>
            ))}
          </div>
        }
      />

      <section className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <Kpi icon={DollarSign} label="Faturamento" value={currency(d.current.revenue)} change={d.change.revenue} />
        <Kpi icon={ShoppingBag} label="Pedidos" value={String(d.current.orders)} change={d.change.orders} />
        <Kpi icon={Receipt} label="Ticket médio" value={currency(d.current.avgTicket)} change={d.change.avgTicket} />
        <Kpi icon={Clock} label="Pedidos na esteira" value={String(d.inProgress)} hint="em andamento agora" />
        <Kpi icon={BottleWine} label="Garrafas coletadas" value={String(d.current.bottles)} change={d.change.bottles} />
        <Kpi
          icon={Percent}
          label="Taxa de retorno"
          value={`${d.returnRate.toLocaleString("pt-BR")}%`}
          hint={`${d.current.bottles} de ${d.soldReturnable} garrafas vendidas`}
        />
        <Kpi
          icon={TicketPercent}
          label="Descontos concedidos"
          value={currency(d.current.discounts)}
          hint={`${currency(d.current.credits)} em créditos gerados`}
        />
        <Kpi icon={UserPlus} label="Novos clientes" value={String(d.current.newCustomers)} change={d.change.newCustomers} />
      </section>

      <section className="mt-6 grid gap-4 xl:grid-cols-2">
        <Panel title="Faturamento por dia" subtitle="Pedidos não cancelados">
          <RevenueArea data={d.daily} />
        </Panel>
        <Panel title="Pedidos por dia">
          <DailyBars data={d.daily} dataKey="orders" label="Pedidos" color="var(--chart-1)" />
        </Panel>
        <Panel title="Garrafas coletadas por dia" subtitle="Vasilhames devolvidos pelos clientes">
          <DailyBars data={d.daily} dataKey="bottles" label="Garrafas" color="var(--chart-2)" />
        </Panel>
        <Panel title="Pedidos por etapa da esteira" subtitle="Pedidos criados no período">
          <BarList data={d.statusCounts.map((s) => ({ name: STATUS_LABEL[s.status], value: s.count }))} unit="pedidos" />
        </Panel>
        <Panel title="Produtos mais vendidos" subtitle="Quantidade de unidades">
          <BarList data={d.topProducts.map((p) => ({ name: p.name, value: p.quantity, extra: currency(p.revenue) }))} unit="un." />
        </Panel>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
          <Panel title="Clientes que mais compram">
            <RankTable rows={d.topBuyers.map((b) => ({ id: b.id, name: b.name, sub: `${b.orders} pedidos`, value: currency(b.total) }))} />
          </Panel>
          <Panel title="Clientes que mais devolvem">
            <RankTable rows={d.topCollectors.map((c) => ({ id: c.id, name: c.name, sub: currency(c.credit), value: `${c.bottles} garrafas` }))} />
          </Panel>
        </div>
      </section>
    </>
  );
}

function Kpi({
  icon: Icon,
  label,
  value,
  change,
  hint,
}: {
  icon: typeof DollarSign;
  label: string;
  value: string;
  change?: number;
  hint?: string;
}) {
  const up = (change ?? 0) >= 0;
  return (
    <div className="surface px-4 py-4">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
        <span className="grid size-8 place-items-center rounded-lg bg-peach/60 text-wine">
          <Icon className="size-4" />
        </span>
      </div>
      <p className="mt-2 text-2xl font-bold text-cocoa">{value}</p>
      {change !== undefined ? (
        <p className={cn("mt-1 flex items-center gap-1 text-xs font-semibold", up ? "text-[#3E7B3A]" : "text-destructive")}>
          {up ? <ArrowUpRight className="size-3.5" /> : <ArrowDownRight className="size-3.5" />}
          {Math.abs(change).toLocaleString("pt-BR")}% vs período anterior
        </p>
      ) : (
        <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
      )}
    </div>
  );
}

function Panel({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div className="surface px-5 py-4">
      <h2 className="font-semibold text-cocoa">{title}</h2>
      {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
      <div className="mt-4">{children}</div>
    </div>
  );
}

function RankTable({ rows }: { rows: { id: string; name: string; sub: string; value: string }[] }) {
  if (rows.length === 0) return <p className="py-6 text-center text-sm text-muted-foreground">Sem dados no período.</p>;
  return (
    <ol className="divide-y divide-border/60">
      {rows.map((r, i) => (
        <li key={r.id} className="flex items-center gap-3 py-2 text-sm">
          <span className="grid size-6 place-items-center rounded-full bg-peach text-xs font-bold text-wine">{i + 1}</span>
          <span className="min-w-0 flex-1">
            <span className="block truncate font-semibold text-cocoa">{r.name}</span>
            <span className="text-xs text-muted-foreground">{r.sub}</span>
          </span>
          <span className="font-semibold text-cocoa">{r.value}</span>
        </li>
      ))}
    </ol>
  );
}
