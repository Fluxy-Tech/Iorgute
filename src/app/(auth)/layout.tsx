import { redirect } from "next/navigation";
import { BadgePercent, Leaf as LeafIcon, Recycle } from "lucide-react";
import { Bottle } from "@/components/brand/bottle";
import { Leaf } from "@/components/brand/decor";
import { Logo } from "@/components/brand/logo";
import { getCurrentUser } from "@/lib/session";

export default async function AuthLayout({ children }: LayoutProps<"/">) {
  if (await getCurrentUser()) redirect("/");
  return (
    <div className="flex min-h-svh bg-background">
      <BrandPanel />
      <main className="relative isolate flex w-full flex-col overflow-hidden lg:w-1/2 lg:items-center lg:justify-center lg:py-10">
        <div className="relative mx-auto flex w-full max-w-md flex-1 flex-col lg:flex-none">{children}</div>
      </main>
    </div>
  );
}

/** Painel da marca exibido no desktop, com a mesma linguagem visual do app */
function BrandPanel() {
  const perks = [
    { icon: LeafIcon, text: "Iogurte artesanal, 100% natural" },
    { icon: Recycle, text: "Garrafas retornáveis" },
    { icon: BadgePercent, text: "Desconto a cada garrafa devolvida" },
  ];
  return (
    <aside className="sticky top-0 hidden h-svh w-1/2 flex-col justify-between overflow-hidden bg-wine px-14 py-12 text-primary-foreground lg:flex">
      <svg className="absolute -right-24 -top-24 h-96 w-96 opacity-25" viewBox="0 0 100 100" aria-hidden>
        <circle cx="50" cy="50" r="50" fill="var(--rose)" />
      </svg>
      <svg className="absolute -bottom-10 -left-10 h-64 w-[130%]" viewBox="0 0 200 80" preserveAspectRatio="none" aria-hidden>
        <path d="M0 40 C40 10 80 60 130 40 C170 25 190 50 200 80 H0 Z" fill="var(--wine-dark)" opacity="0.7" />
      </svg>

      <div className="relative">
        <Logo size="lg" badge priority className="px-5 py-3" />
        <p className="mt-4 text-lg text-[#F8E3D8]">iogurte artesanal · 100% natural</p>
      </div>

      <div className="relative flex items-end justify-center gap-6">
        <div className="absolute bottom-6 h-56 w-80 rounded-full bg-peach/20 blur-2xl" />
        <Bottle color="#E58C98" className="relative h-44 w-22" />
        <Bottle color="#F2B544" className="relative h-56 w-28" />
        <Bottle color="#F3EEE6" className="relative h-44 w-22" />
      </div>

      <div className="relative">
        <p className="font-script text-4xl font-bold leading-tight text-[#FFF3EA]">
          Feito à mão,
          <br />
          com carinho, todos os dias.
        </p>
        <ul className="mt-6 space-y-3">
          {perks.map(({ icon: Icon, text }) => (
            <li key={text} className="flex items-center gap-3 text-[#F8E3D8]">
              <span className="grid size-9 place-items-center rounded-full bg-white/10">
                <Icon className="size-4 text-gold" />
              </span>
              {text}
            </li>
          ))}
        </ul>
      </div>
      <Leaf className="absolute bottom-8 right-10 opacity-60" />
    </aside>
  );
}
