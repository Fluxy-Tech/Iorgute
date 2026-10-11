"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, BottleWine, Heart, LayoutGrid, Lock, LogOut, MapPin, ShoppingBag, TicketPercent, User, UserRound } from "lucide-react";
import { logoutAction } from "@/actions/auth";
import { cn } from "@/lib/utils";

const groups = [
  [
    { href: "/conta", label: "Visão geral", icon: LayoutGrid, exact: true },
    { href: "/pedidos", label: "Meus pedidos", icon: ShoppingBag },
    { href: "/conta/endereco", label: "Meu endereço", icon: MapPin },
    { href: "/conta/garrafas", label: "Garrafas devolvidas", icon: BottleWine },
    { href: "/conta/descontos", label: "Meus descontos", icon: TicketPercent },
    { href: "/notificacoes", label: "Notificações", icon: Bell },
  ],
  [
    { href: "/conta/dados", label: "Meus dados", icon: UserRound, exact: true },
    { href: "/conta/dados/editar", label: "Editar dados", icon: User },
    { href: "/conta/dados/senha", label: "Alterar senha", icon: Lock },
    { href: "/conta/dados/preferencias", label: "Preferências", icon: Heart },
  ],
];

/** Menu lateral da conta (somente desktop) */
export function AccountNav({ name, email, phone }: { name: string; email: string; phone: string | null }) {
  const pathname = usePathname();
  return (
    <aside className="sticky top-28 hidden h-fit flex-col gap-4 lg:flex">
      <div className="surface flex flex-col items-center px-5 py-6 text-center">
        <span className="grid size-20 place-items-center rounded-full bg-wine text-primary-foreground">
          <User className="size-11" fill="currentColor" strokeWidth={1.4} />
        </span>
        <p className="mt-3 font-bold text-cocoa">{name}</p>
        <p className="w-full truncate text-sm text-cocoa/80">{email}</p>
        {phone && <p className="text-sm text-cocoa/80">{phone}</p>}
      </div>
      <nav className="surface flex flex-col gap-1 p-2">
        {groups.map((group, gi) => (
          <div key={gi} className={cn("flex flex-col gap-0.5", gi > 0 && "mt-1 border-t border-border/60 pt-2")}>
            {group.map(({ href, label, icon: Icon, exact }) => {
              const active = exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
              return (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition",
                    active ? "bg-wine font-semibold text-primary-foreground" : "text-cocoa hover:bg-peach/40",
                  )}
                >
                  <Icon className={cn("size-[18px]", !active && "text-wine")} /> {label}
                </Link>
              );
            })}
          </div>
        ))}
        <form action={logoutAction} className="mt-1 border-t border-border/60 pt-2">
          <button className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-rose transition hover:bg-rose/5">
            <LogOut className="size-[18px]" /> Sair
          </button>
        </form>
      </nav>
    </aside>
  );
}
