import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export function Pagination({
  page,
  pageSize,
  total,
  basePath,
  params,
}: {
  page: number;
  pageSize: number;
  total: number;
  basePath: string;
  params: Record<string, string | undefined>;
}) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const href = (p: number) => {
    const sp = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) if (v) sp.set(k, v);
    sp.set("page", String(p));
    return `${basePath}?${sp.toString()}`;
  };
  return (
    <div className="flex items-center justify-between px-5 py-3 text-sm text-muted-foreground">
      <span>
        {total.toLocaleString("pt-BR")} registro(s) · página {page} de {pages}
      </span>
      <div className="flex gap-2">
        <Link
          href={href(page - 1)}
          aria-disabled={page <= 1}
          className={cn("grid size-8 place-items-center rounded-lg border bg-card", page <= 1 && "pointer-events-none opacity-40")}
        >
          <ChevronLeft className="size-4" />
        </Link>
        <Link
          href={href(page + 1)}
          aria-disabled={page >= pages}
          className={cn("grid size-8 place-items-center rounded-lg border bg-card", page >= pages && "pointer-events-none opacity-40")}
        >
          <ChevronRight className="size-4" />
        </Link>
      </div>
    </div>
  );
}

export function sp(value: string | string[] | undefined) {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

export const filterInput =
  "h-9 rounded-lg border border-input bg-card px-3 text-sm outline-none focus:border-rose";
