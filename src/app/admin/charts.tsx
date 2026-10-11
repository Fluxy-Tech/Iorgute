"use client";

import { Area, AreaChart, Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { currency } from "@/lib/format";

type Daily = { day: string; revenue: number; orders: number; bottles: number };

const shortDay = (day: string) => `${day.slice(8, 10)}/${day.slice(5, 7)}`;

const axis = { tickLine: false, axisLine: false, tick: { fill: "var(--muted-foreground)", fontSize: 11 } };

export function RevenueArea({ data }: { data: Daily[] }) {
  const config = { revenue: { label: "Faturamento", color: "var(--chart-1)" } } satisfies ChartConfig;
  return (
    <ChartContainer config={config} className="aspect-auto h-60 w-full">
      <AreaChart data={data} margin={{ left: 4, right: 8, top: 8 }}>
        <defs>
          <linearGradient id="fillRevenue" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="var(--color-revenue)" stopOpacity={0.35} />
            <stop offset="95%" stopColor="var(--color-revenue)" stopOpacity={0.03} />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="3 3" />
        <XAxis dataKey="day" tickFormatter={shortDay} minTickGap={24} {...axis} />
        <YAxis width={64} tickFormatter={(v) => currency(v).replace(",00", "")} {...axis} />
        <ChartTooltip
          cursor={{ stroke: "var(--muted-foreground)", strokeDasharray: "3 3" }}
          content={
            <ChartTooltipContent
              labelFormatter={(_, p) => shortDay(String(p?.[0]?.payload?.day ?? ""))}
              formatter={(value) => (
                <span className="flex w-full justify-between gap-4">
                  <span className="text-muted-foreground">Faturamento</span>
                  <span className="font-semibold">{currency(Number(value))}</span>
                </span>
              )}
            />
          }
        />
        <Area
          dataKey="revenue"
          type="monotone"
          stroke="var(--color-revenue)"
          strokeWidth={2}
          fill="url(#fillRevenue)"
          activeDot={{ r: 5, stroke: "var(--card)", strokeWidth: 2 }}
        />
      </AreaChart>
    </ChartContainer>
  );
}

export function DailyBars({
  data,
  dataKey,
  label,
  color,
}: {
  data: Daily[];
  dataKey: "orders" | "bottles";
  label: string;
  color: string;
}) {
  const config = { [dataKey]: { label, color } } satisfies ChartConfig;
  return (
    <ChartContainer config={config} className="aspect-auto h-56 w-full">
      <BarChart data={data} margin={{ left: 0, right: 8, top: 8 }} barCategoryGap={2}>
        <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="3 3" />
        <XAxis dataKey="day" tickFormatter={shortDay} minTickGap={24} {...axis} />
        <YAxis width={32} allowDecimals={false} {...axis} />
        <ChartTooltip
          cursor={{ fill: "var(--muted)", opacity: 0.6 }}
          content={<ChartTooltipContent labelFormatter={(_, p) => shortDay(String(p?.[0]?.payload?.day ?? ""))} />}
        />
        <Bar dataKey={dataKey} fill={`var(--color-${dataKey})`} radius={[4, 4, 0, 0]} maxBarSize={28} />
      </BarChart>
    </ChartContainer>
  );
}

/** Barras horizontais em HTML: rótulo + valor sempre visíveis, sem depender da cor */
export function BarList({ data, unit }: { data: { name: string; value: number; extra?: string }[]; unit: string }) {
  const max = Math.max(1, ...data.map((d) => d.value));
  if (data.length === 0 || data.every((d) => d.value === 0)) {
    return <p className="py-6 text-center text-sm text-muted-foreground">Sem dados no período.</p>;
  }
  return (
    <ul className="space-y-2.5">
      {data.map((d) => (
        <li key={d.name} className="group" title={`${d.name}: ${d.value} ${unit}${d.extra ? ` · ${d.extra}` : ""}`}>
          <div className="mb-1 flex justify-between text-sm">
            <span className="truncate text-cocoa">{d.name}</span>
            <span className="shrink-0 font-semibold text-cocoa">
              {d.value} <span className="text-xs font-normal text-muted-foreground">{unit}</span>
              {d.extra && <span className="ml-2 text-xs font-normal text-muted-foreground">{d.extra}</span>}
            </span>
          </div>
          <div className="h-2.5 rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-chart-1 transition-all group-hover:brightness-110"
              style={{ width: `${(d.value / max) * 100}%` }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}
