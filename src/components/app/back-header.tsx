import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

export function BackHeader({
  title,
  href,
  size = "md",
  action,
}: {
  title: string;
  href: string;
  size?: "md" | "lg";
  action?: ReactNode;
}) {
  return (
    <div className="flex items-center gap-3">
      <Link
        href={href}
        aria-label="Voltar"
        className="-ml-1 grid size-9 place-items-center rounded-full text-cocoa transition hover:bg-peach/50"
      >
        <ChevronLeft className="size-6" />
      </Link>
      <h1 className={cn("flex-1 font-bold text-wine lg:font-script lg:text-3xl", size === "lg" ? "text-2xl" : "text-lg")}>{title}</h1>
      {action}
    </div>
  );
}
