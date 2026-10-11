"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Heart, Home, ShoppingBag, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCart } from "./cart-provider";

const items = [
  { href: "/inicio", label: "Início", icon: Home, match: ["/inicio", "/carrinho", "/produto"], fill: false },
  { href: "/sobre", label: "Sobre", icon: Heart, match: ["/sobre"], fill: true },
  { href: "/pedidos", label: "Pedidos", icon: ShoppingBag, match: ["/pedidos"], fill: false },
  { href: "/conta", label: "Conta", icon: User, match: ["/conta", "/notificacoes"], fill: true },
];

export function BottomNav() {
  const pathname = usePathname();
  const { count } = useCart();
  return (
    <nav className="sticky bottom-0 z-30 border-t border-border/70 bg-card/95 pb-[env(safe-area-inset-bottom)] backdrop-blur">
      <ul className="grid grid-cols-4">
        {items.map(({ href, label, icon: Icon, match, fill }) => {
          const active = match.some((m) => pathname === m || pathname.startsWith(`${m}/`));
          return (
            <li key={href}>
              <Link
                href={href}
                className={cn(
                  "relative flex flex-col items-center gap-1 py-2.5 text-xs transition",
                  active ? "font-bold text-wine" : "text-[#7D625E] hover:text-wine",
                )}
              >
                <Icon className={cn("size-6", active && fill && "fill-wine")} strokeWidth={active ? 2.2 : 1.8} />
                {label}
                {href === "/inicio" && count > 0 && (
                  <span className="absolute right-[22%] top-1.5 grid min-w-4 place-items-center rounded-full bg-rose px-1 text-[10px] font-bold text-white">
                    {count}
                  </span>
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
