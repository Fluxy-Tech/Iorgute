"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  BottleWine,
  Cog,
  KanbanSquare,
  LayoutDashboard,
  LogOut,
  Menu,
  Package,
  ScrollText,
  ShieldCheck,
  Store,
  TicketPercent,
  Users,
} from "lucide-react";
import { logoutAction } from "@/actions/auth";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { ROLE_LABEL, type RoleName } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/brand/logo";
import { ADMIN_NAV, type NavItem } from "./nav";

const ICONS: Record<NavItem["icon"], typeof LayoutDashboard> = {
  dashboard: LayoutDashboard,
  kanban: KanbanSquare,
  bottle: BottleWine,
  product: Package,
  coupon: TicketPercent,
  users: Users,
  audit: ShieldCheck,
  logs: ScrollText,
  settings: Cog,
};

type User = { name: string; email: string; role: RoleName };

function NavContent({ user, onNavigate }: { user: User; onNavigate?: () => void }) {
  const pathname = usePathname();
  const items = ADMIN_NAV.filter((i) => i.roles.includes(user.role));
  return (
    <div className="flex h-full flex-col bg-sidebar text-sidebar-foreground">
      <div className="px-6 pb-4 pt-6">
        <Logo size="md" badge />
        <p className="mt-3 text-xs uppercase tracking-widest text-sidebar-foreground/60">Painel administrativo</p>
      </div>
      <nav className="flex-1 space-y-1 overflow-y-auto px-3">
        {items.map((item) => {
          const Icon = ICONS[item.icon];
          const active = item.href === "/admin" ? pathname === "/admin" : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition",
                active ? "bg-sidebar-accent font-semibold text-white shadow-inner" : "text-sidebar-foreground/80 hover:bg-sidebar-accent/60 hover:text-white",
              )}
            >
              <Icon className={cn("size-[18px]", active && "text-gold")} />
              {item.label}
            </Link>
          );
        })}
        <Link
          href="/inicio"
          onClick={onNavigate}
          className="mt-4 flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-sidebar-foreground/80 hover:bg-sidebar-accent/60 hover:text-white"
        >
          <Store className="size-[18px]" /> Ver loja (cliente)
        </Link>
      </nav>
      <div className="border-t border-sidebar-border p-4">
        <p className="truncate text-sm font-semibold text-white">{user.name}</p>
        <p className="truncate text-xs text-sidebar-foreground/70">{user.email}</p>
        <span className="mt-2 inline-block rounded-full bg-gold/90 px-2 py-0.5 text-[11px] font-bold text-cocoa">
          {ROLE_LABEL[user.role]}
        </span>
        <form action={logoutAction} className="mt-3">
          <button className="flex w-full items-center justify-center gap-2 rounded-lg border border-sidebar-foreground/30 py-2 text-sm text-sidebar-foreground hover:bg-sidebar-accent">
            <LogOut className="size-4" /> Sair
          </button>
        </form>
      </div>
    </div>
  );
}

export function AdminSidebar({ user }: { user: User }) {
  return (
    <aside className="sticky top-0 hidden h-svh w-64 shrink-0 lg:block">
      <NavContent user={user} />
    </aside>
  );
}

export function AdminMobileNav({ user }: { user: User }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="sticky top-0 z-30 flex items-center gap-3 border-b border-sidebar-border bg-sidebar px-4 py-3 lg:hidden">
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger aria-label="Abrir menu" className="text-white">
          <Menu className="size-6" />
        </SheetTrigger>
        <SheetContent side="left" className="w-64 border-0 p-0">
          <SheetTitle className="sr-only">Menu</SheetTitle>
          <NavContent user={user} onNavigate={() => setOpen(false)} />
        </SheetContent>
      </Sheet>
      <Logo size="xs" badge className="px-2 py-1" />
    </div>
  );
}
