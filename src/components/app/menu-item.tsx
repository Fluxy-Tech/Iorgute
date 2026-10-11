import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

/** Linha de menu em cartão (Meus pedidos, Meu endereço, ...) */
export function MenuItem({
  href,
  icon,
  title,
  subtitle,
  compact = false,
}: {
  href: string;
  icon: ReactNode;
  title: string;
  subtitle?: string;
  compact?: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "surface group flex items-center gap-4 px-4 transition hover:border-rose/40 hover:shadow-md",
        compact ? "py-3" : "py-4",
      )}
    >
      <span className={cn("grid place-items-center text-wine [&_svg]:stroke-[1.7]", compact ? "[&_svg]:size-5" : "[&_svg]:size-7")}>
        {icon}
      </span>
      <span className="flex-1">
        <span className={cn("block font-semibold text-cocoa", compact ? "text-sm" : "text-[15px]")}>{title}</span>
        {subtitle && <span className="block text-xs text-muted-foreground">{subtitle}</span>}
      </span>
      <ChevronRight className="size-5 text-cocoa/70 transition group-hover:translate-x-0.5" />
    </Link>
  );
}
