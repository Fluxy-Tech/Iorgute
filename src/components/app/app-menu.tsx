"use client";

import Link from "next/link";
import { useState } from "react";
import {
  Bell,
  BottleWine,
  Heart,
  Home,
  LayoutDashboard,
  LogOut,
  Menu,
  ShoppingBag,
  ShoppingCart,
  TicketPercent,
  User,
} from "lucide-react";
import { logoutAction } from "@/actions/auth";
import { Logo } from "@/components/brand/logo";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

const links = [
  { href: "/inicio", label: "Início", icon: Home },
  { href: "/carrinho", label: "Carrinho", icon: ShoppingCart },
  { href: "/pedidos", label: "Meus pedidos", icon: ShoppingBag },
  { href: "/conta/garrafas", label: "Garrafas devolvidas", icon: BottleWine },
  { href: "/conta/descontos", label: "Meus descontos", icon: TicketPercent },
  { href: "/notificacoes", label: "Notificações", icon: Bell },
  { href: "/conta", label: "Minha conta", icon: User },
  { href: "/sobre", label: "Sobre a Iorgutê", icon: Heart },
];

export function AppMenu({ isStaff }: { isStaff: boolean }) {
  const [open, setOpen] = useState(false);
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        aria-label="Abrir menu"
        className="grid size-10 place-items-center rounded-full text-wine transition hover:bg-peach/50"
      >
        <Menu className="size-7" />
      </SheetTrigger>
      <SheetContent side="right" className="w-72 bg-background">
        <SheetHeader>
          <SheetTitle className="sr-only">Menu</SheetTitle>
          <Logo size="sm" className="self-start" />
        </SheetHeader>
        <nav className="flex flex-1 flex-col gap-1 px-3">
          {isStaff && (
            <Link
              href="/admin"
              onClick={() => setOpen(false)}
              className="mb-2 flex items-center gap-3 rounded-xl bg-wine px-3 py-2.5 font-semibold text-primary-foreground"
            >
              <LayoutDashboard className="size-5" /> Painel administrativo
            </Link>
          )}
          {links.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-cocoa transition hover:bg-peach/40"
            >
              <Icon className="size-5 text-wine" /> {label}
            </Link>
          ))}
        </nav>
        <form action={logoutAction} className="p-4">
          <button className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-rose/60 py-2.5 font-semibold text-rose hover:bg-rose/5">
            <LogOut className="size-5" /> Sair
          </button>
        </form>
      </SheetContent>
    </Sheet>
  );
}
