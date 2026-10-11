import type { Metadata } from "next";
import Link from "next/link";
import { BottleWine, ChevronRight, LogOut, MapPin, ShoppingBag, TicketPercent, UserRound } from "lucide-react";
import { logoutAction } from "@/actions/auth";
import { Greeting } from "@/components/app/greeting";
import { MenuItem } from "@/components/app/menu-item";
import { StatusBadge } from "@/components/app/status-badge";
import { TopBar, Waves } from "@/components/app/top-bar";
import { productThumb, productThumbSelect } from "@/lib/catalog";
import { ProductVisual } from "@/components/brand/product-visual";
import { ACTIVE_STATUSES, type OrderStatusName } from "@/lib/constants";
import { getBottleSummary } from "@/lib/discounts";
import { currency, formatDate, orderCode } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";

export const metadata: Metadata = { title: "Minha conta" };

export default async function AccountPage() {
  const user = await requireUser();
  const [bottles, activeCount, address, recent] = await Promise.all([
    getBottleSummary(user.id),
    prisma.order.count({ where: { userId: user.id, status: { in: ACTIVE_STATUSES } } }),
    prisma.address.findUnique({ where: { userId: user.id } }),
    prisma.order.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 4,
      include: { items: { take: 1, include: { product: { select: productThumbSelect } } } },
    }),
  ]);

  return (
    <div className="relative flex flex-1 flex-col">
      <Waves />
      <TopBar />
      <div className="relative z-10 flex flex-1 flex-col gap-3 px-4 pb-6 pt-4 lg:gap-6 lg:p-0">
        <Greeting name={user.name} />

        {/* Mobile: menu em cartões, como no layout */}
        <div className="mt-1 flex flex-col gap-3 lg:hidden">
          <MenuItem href="/pedidos" icon={<ShoppingBag />} title="Meus pedidos" subtitle="Acompanhe seus pedidos" />
          <MenuItem href="/conta/endereco" icon={<MapPin />} title="Meu endereço" subtitle="Edite seu endereço de entrega" />
          <MenuItem href="/conta/garrafas" icon={<BottleWine />} title="Garrafas devolvidas" subtitle="Ganhe seu desconto" />
          <MenuItem href="/conta/descontos" icon={<TicketPercent />} title="Meus descontos" subtitle="Veja suas vantagens" />
          <MenuItem href="/conta/dados" icon={<UserRound />} title="Meus dados" subtitle="Altere suas informações" />
        </div>
        <form action={logoutAction} className="mt-3 lg:hidden">
          <button className="flex h-12 w-full items-center justify-center gap-2 rounded-xl border-2 border-rose/50 text-base font-semibold text-rose transition hover:bg-rose/5">
            <LogOut className="size-5" /> Sair
          </button>
        </form>

        {/* Desktop: visão geral */}
        <div className="hidden gap-4 lg:grid lg:grid-cols-3">
          <OverviewCard href="/pedidos" icon={ShoppingBag} label="Pedidos em andamento" value={String(activeCount)} hint="Acompanhe a entrega" />
          <OverviewCard
            href="/conta/garrafas"
            icon={BottleWine}
            label="Garrafas devolvidas"
            value={`${bottles.bottles}`}
            hint={`${currency(bottles.balance)} de desconto disponível`}
          />
          <OverviewCard
            href="/conta/endereco"
            icon={MapPin}
            label="Endereço de entrega"
            value={address ? address.street : "Não cadastrado"}
            hint={address ? `${address.neighborhood} — ${address.city}` : "Cadastre para fazer pedidos"}
            small
          />
        </div>

        <section className="surface hidden overflow-hidden lg:block">
          <div className="flex items-center justify-between border-b border-border/60 px-6 py-4">
            <h2 className="font-script text-2xl font-bold text-wine">Pedidos recentes</h2>
            <Link href="/pedidos?aba=historico" className="text-sm font-semibold text-rose hover:underline">
              Ver todos
            </Link>
          </div>
          {recent.length === 0 ? (
            <p className="px-6 py-10 text-center text-sm text-muted-foreground">
              Você ainda não fez pedidos.{" "}
              <Link href="/inicio" className="font-semibold text-rose underline">
                Conheça nossos iogurtes
              </Link>
            </p>
          ) : (
            <ul className="divide-y divide-border/60">
              {recent.map((o) => (
                <li key={o.id}>
                  <Link href={`/pedidos/${o.id}`} className="flex items-center gap-4 px-6 py-3 transition hover:bg-peach/20">
                    <ProductVisual
                      src={o.items[0] ? productThumb(o.items[0].product).imageUrl : null}
                      color={o.items[0]?.product.color ?? "#F2D3C2"}
                      alt={o.items[0]?.productName ?? ""}
                      className="size-12 shrink-0 rounded-lg bg-peach/30"
                      bottleClassName="h-12 w-6"
                      label={false}
                    />
                    <span className="w-28 font-bold text-cocoa">Pedido {orderCode(o.id)}</span>
                    <span className="flex-1 truncate text-sm text-muted-foreground">{o.items[0]?.productName}</span>
                    <span className="w-28 text-sm text-muted-foreground">{formatDate(o.createdAt)}</span>
                    <span className="w-24 text-right font-semibold text-cocoa">{currency(o.total)}</span>
                    <span className="w-36 text-right">
                      <StatusBadge status={o.status as OrderStatusName} />
                    </span>
                    <ChevronRight className="size-4 text-cocoa/60" />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}

function OverviewCard({
  href,
  icon: Icon,
  label,
  value,
  hint,
  small,
}: {
  href: string;
  icon: typeof ShoppingBag;
  label: string;
  value: string;
  hint: string;
  small?: boolean;
}) {
  return (
    <Link href={href} className="surface group flex flex-col gap-3 px-5 py-5 transition hover:border-rose/40 hover:shadow-md">
      <div className="flex items-center justify-between">
        <span className="grid size-11 place-items-center rounded-xl bg-peach/60 text-wine">
          <Icon className="size-6" strokeWidth={1.7} />
        </span>
        <ChevronRight className="size-5 text-cocoa/50 transition group-hover:translate-x-0.5" />
      </div>
      <div>
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className={small ? "truncate text-base font-bold text-cocoa" : "text-3xl font-bold text-cocoa"}>{value}</p>
        <p className="truncate text-xs text-muted-foreground">{hint}</p>
      </div>
    </Link>
  );
}
