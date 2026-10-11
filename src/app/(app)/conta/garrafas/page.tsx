import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight, Milk } from "lucide-react";
import { BackHeader } from "@/components/app/back-header";
import { currency, formatDate } from "@/lib/format";
import { getBottleSummary } from "@/lib/discounts";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { getSettings } from "@/lib/settings";
import { HowItWorks } from "./how-it-works";

export const metadata: Metadata = { title: "Garrafas devolvidas" };

export default async function BottlesPage({ searchParams }: PageProps<"/conta/garrafas">) {
  const user = await requireUser();
  const { historico } = await searchParams;
  const [summary, settings, returns] = await Promise.all([
    getBottleSummary(user.id),
    getSettings(),
    prisma.bottleReturn.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" }, take: 30 }),
  ]);
  const showHistory = historico === "1";

  return (
    <div className="flex flex-1 flex-col px-4 pb-6 pt-6 lg:grid lg:grid-cols-2 lg:items-start lg:gap-x-8 lg:p-0">
      <div className="lg:col-span-2"><BackHeader title="Garrafas devolvidas" href="/conta" /></div>

      <div className="mt-4 flex flex-col items-center text-center lg:surface lg:row-span-2 lg:mt-6 lg:px-8 lg:py-10">
        <RecycleIllustration />
        <h2 className="mt-4 font-script text-2xl font-bold leading-tight text-cocoa">
          Devolva suas garrafas
          <br />e ganhe desconto!
        </h2>
        <p className="mt-2 max-w-72 text-sm text-cocoa/80">
          Cada garrafa retornável vale {currency(settings.bottleCredit)} de desconto na sua próxima compra.
        </p>
        <HowItWorks credit={currency(settings.bottleCredit)} />
      </div>

      <Link href={showHistory ? "/conta/garrafas" : "/conta/garrafas?historico=1"} className="surface mt-6 block px-4 py-4 transition hover:border-rose/40">
        <p className="text-sm font-semibold text-cocoa">Suas garrafas devolvidas</p>
        <div className="mt-3 flex items-center gap-4">
          <Milk className="size-8 text-wine" strokeWidth={1.4} />
          <div className="flex-1 text-sm">
            <p className="font-semibold text-cocoa">
              {summary.bottles} {summary.bottles === 1 ? "garrafa" : "garrafas"}
            </p>
            <p className="text-xs text-muted-foreground">{currency(summary.balance)} de desconto disponível</p>
          </div>
          <ChevronRight className={`size-5 text-cocoa/70 transition ${showHistory ? "rotate-90" : ""}`} />
        </div>
      </Link>

      {showHistory && (
        <div className="surface mt-3 divide-y divide-border/60">
          <div className="grid grid-cols-3 px-4 py-2 text-xs text-muted-foreground">
            <span>Total ganho</span>
            <span className="text-center">Já utilizado</span>
            <span className="text-right">Saldo</span>
          </div>
          <div className="grid grid-cols-3 px-4 py-2 text-sm font-semibold text-cocoa">
            <span>{currency(summary.earned)}</span>
            <span className="text-center">{currency(summary.spent)}</span>
            <span className="text-right text-wine">{currency(summary.balance)}</span>
          </div>
          {returns.length === 0 ? (
            <p className="px-4 py-6 text-center text-sm text-muted-foreground">Nenhuma devolução registrada ainda.</p>
          ) : (
            returns.map((r) => (
              <div key={r.id} className="flex items-center justify-between px-4 py-3 text-sm">
                <span className="text-cocoa">
                  {r.quantity} {r.quantity === 1 ? "garrafa" : "garrafas"}
                  <span className="block text-xs text-muted-foreground">{formatDate(r.createdAt)}</span>
                </span>
                <span className="font-semibold text-[#3E7B3A]">+ {currency(r.credit)}</span>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

function RecycleIllustration() {
  return (
    <svg viewBox="0 0 220 170" className="h-44 w-56" aria-hidden>
      <path d="M40 60 C50 15 120 5 160 30 C200 55 210 110 170 140 C130 170 60 160 35 125 C20 100 32 80 40 60Z" fill="var(--peach)" opacity="0.8" />
      <g fill="none" stroke="var(--wine)" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
        <rect x="98" y="12" width="24" height="12" rx="3" />
        <path d="M100 24 v12 c0 6 -14 12 -14 26 v74 c0 6 4 10 10 10 h28 c6 0 10 -4 10 -10 v-74 c0 -14 -14 -20 -14 -26 v-12" />
        <path d="M58 70 C 50 85 50 105 60 118" />
        <path d="M52 112 l8 8 l5 -10" />
        <path d="M162 70 C 170 85 170 105 160 118" />
        <path d="M156 66 l8 -4 l3 9" />
        <path d="M70 50 C 78 38 88 32 96 30" />
        <path d="M150 50 C 142 38 132 32 124 30" />
      </g>
      <path d="M150 118 c8 -16 22 -18 28 -16 c-2 10 -12 22 -28 16z" fill="none" stroke="var(--wine)" strokeWidth="3" />
    </svg>
  );
}
