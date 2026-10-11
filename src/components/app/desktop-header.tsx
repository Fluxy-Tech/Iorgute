"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bell,
  BottleWine,
  ChevronDown,
  LayoutDashboard,
  LogOut,
  MapPin,
  ShoppingBag,
  ShoppingCart,
  TicketPercent,
  User,
} from "lucide-react";
import { logoutAction } from "@/actions/auth";
import { Logo } from "@/components/brand/logo";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { firstName } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useCart } from "./cart-provider";

const links = [
  { href: "/inicio", label: "Início", match: ["/inicio", "/carrinho", "/produto"] },
  { href: "/pedidos", label: "Meus pedidos", match: ["/pedidos"] },
  { href: "/conta/garrafas", label: "Garrafas", match: ["/conta/garrafas"] },
  { href: "/conta/descontos", label: "Descontos", match: ["/conta/descontos"] },
  { href: "/sobre", label: "Sobre", match: ["/sobre"] },
];

/** Cabeçalho da área do cliente no desktop (substitui a barra inferior do mobile) */
export function DesktopHeader({ name, email, unread, isStaff }: { name: string; email: string; unread: number; isStaff: boolean }) {
  const pathname = usePathname();
  const { count } = useCart();
  const isActive = (match: string[]) => match.some((m) => pathname === m || pathname.startsWith(`${m}/`));

  return (
    <header className="sticky top-0 z-40 hidden border-b border-border/70 bg-background/90 backdrop-blur lg:block">
      <div className="mx-auto flex h-20 max-w-7xl items-center gap-10 px-8">
        <Link href="/inicio" aria-label="Início" className="shrink-0">
          <Logo size="md" priority />
        </Link>

        <nav className="flex flex-1 items-center gap-1">
          {links.map((l) => {
            const active = isActive(l.match);
            return (
              <Link
                key={l.href}
                href={l.href}
                className={cn(
                  "relative rounded-full px-4 py-2 text-[15px] font-semibold transition",
                  active ? "bg-wine text-primary-foreground" : "text-cocoa hover:bg-peach/50 hover:text-wine",
                )}
              >
                {l.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          {isStaff && (
            <Link
              href="/admin"
              className="mr-2 flex items-center gap-2 rounded-full border-2 border-wine/20 px-4 py-2 text-sm font-semibold text-wine transition hover:border-wine/50"
            >
              <LayoutDashboard className="size-4" /> Painel
            </Link>
          )}
          <Link
            href="/notificacoes"
            aria-label="Notificações"
            className="relative grid size-11 place-items-center rounded-full text-wine transition hover:bg-peach/50"
          >
            <Bell className="size-[22px]" />
            {unread > 0 && (
              <span className="absolute right-1.5 top-1.5 grid min-w-4 place-items-center rounded-full bg-rose px-1 text-[10px] font-bold text-white ring-2 ring-background">
                {unread}
              </span>
            )}
          </Link>
          <Link
            href="/carrinho"
            aria-label="Carrinho"
            className="relative grid size-11 place-items-center rounded-full text-wine transition hover:bg-peach/50"
          >
            <ShoppingCart className="size-[22px]" />
            {count > 0 && (
              <span className="absolute right-1 top-1 grid min-w-4 place-items-center rounded-full bg-rose px-1 text-[10px] font-bold text-white ring-2 ring-background">
                {count}
              </span>
            )}
          </Link>

          <DropdownMenu>
            <DropdownMenuTrigger className="ml-2 flex items-center gap-2.5 rounded-full py-1 pl-1 pr-3 transition hover:bg-peach/50">
              <span className="grid size-10 place-items-center rounded-full bg-wine text-primary-foreground">
                <User className="size-5" fill="currentColor" strokeWidth={1.4} />
              </span>
              <span className="text-left leading-tight">
                <span className="block text-sm font-bold text-cocoa">Olá, {firstName(name)}!</span>
                <span className="block text-xs text-muted-foreground">Minha conta</span>
              </span>
              <ChevronDown className="size-4 text-cocoa/70" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-60">
              <DropdownMenuLabel className="font-normal">
                <span className="block font-semibold text-cocoa">{name}</span>
                <span className="block truncate text-xs text-muted-foreground">{email}</span>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <MenuLink href="/conta" icon={User} label="Minha conta" />
              <MenuLink href="/pedidos" icon={ShoppingBag} label="Meus pedidos" />
              <MenuLink href="/conta/endereco" icon={MapPin} label="Meu endereço" />
              <MenuLink href="/conta/garrafas" icon={BottleWine} label="Garrafas devolvidas" />
              <MenuLink href="/conta/descontos" icon={TicketPercent} label="Meus descontos" />
              <DropdownMenuSeparator />
              <form action={logoutAction}>
                <DropdownMenuItem asChild variant="destructive">
                  <button type="submit" className="w-full">
                    <LogOut /> Sair
                  </button>
                </DropdownMenuItem>
              </form>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}

function MenuLink({ href, icon: Icon, label }: { href: string; icon: typeof User; label: string }) {
  return (
    <DropdownMenuItem asChild>
      <Link href={href}>
        <Icon className="text-wine" /> {label}
      </Link>
    </DropdownMenuItem>
  );
}
