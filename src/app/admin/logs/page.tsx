import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/admin/page-header";
import { Pagination, filterInput, sp } from "@/components/admin/pagination";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDateTime } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/session";
import { cn } from "@/lib/utils";
import type { Prisma } from "@/generated/prisma/client";

export const metadata: Metadata = { title: "Log de requisições" };

const PAGE_SIZE = 50;
const KINDS: Record<string, string> = { page: "Página", rsc: "Navegação / prefetch", action: "Server action", api: "API" };
const METHOD_COLOR: Record<string, string> = {
  GET: "bg-[#E4E3F5] text-[#4B4790]",
  POST: "bg-[#F9E0C9] text-[#9A4F14]",
  PUT: "bg-[#FBE7B5] text-[#8A5A00]",
  PATCH: "bg-[#FBE7B5] text-[#8A5A00]",
  DELETE: "bg-[#F6D9D9] text-[#A3302F]",
};

export default async function RequestLogsPage({ searchParams }: PageProps<"/admin/logs">) {
  await requireRole(["ADMIN"]);
  const params = await searchParams;
  const filters = {
    method: sp(params.method),
    kind: sp(params.kind),
    path: sp(params.path),
    user: sp(params.user),
    errors: sp(params.errors),
  };
  const page = Math.max(1, Number(sp(params.page)) || 1);

  const where: Prisma.RequestLogWhereInput = {
    ...(filters.method && { method: filters.method }),
    ...(filters.kind && { kind: filters.kind }),
    ...(filters.path && { path: { contains: filters.path, mode: "insensitive" } }),
    ...(filters.user && { user: { email: { contains: filters.user, mode: "insensitive" } } }),
    ...(filters.errors === "1" && { status: { gte: 400 } }),
  };

  const dayAgo = hoursAgo(24);
  const [logs, total, last24, errors24, users24, topPaths] = await Promise.all([
    prisma.requestLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: { user: { select: { email: true } } },
    }),
    prisma.requestLog.count({ where }),
    prisma.requestLog.count({ where: { createdAt: { gte: dayAgo } } }),
    prisma.requestLog.count({ where: { createdAt: { gte: dayAgo }, status: { gte: 500 } } }),
    prisma.requestLog.groupBy({ by: ["userId"], where: { createdAt: { gte: dayAgo }, userId: { not: null } } }),
    prisma.requestLog.groupBy({
      by: ["path"],
      where: { createdAt: { gte: dayAgo }, kind: { in: ["page", "rsc"] } },
      _count: true,
      orderBy: { _count: { path: "desc" } },
      take: 5,
    }),
  ]);

  return (
    <>
      <PageHeader title="Log de requisições" description="Todas as chamadas HTTP recebidas pela aplicação (páginas, navegações, server actions e API)." />

      <div className="mb-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Requisições (24h)" value={last24.toLocaleString("pt-BR")} />
        <Stat label="Erros 5xx (24h)" value={errors24.toLocaleString("pt-BR")} danger={errors24 > 0} />
        <Stat label="Usuários ativos (24h)" value={String(users24.length)} />
        <div className="surface px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Páginas mais acessadas (24h)</p>
          <ul className="mt-1 space-y-0.5 text-xs">
            {topPaths.map((p) => (
              <li key={p.path} className="flex justify-between gap-2">
                <span className="truncate text-cocoa">{p.path}</span>
                <span className="font-semibold">{p._count}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <form className="mb-4 flex flex-wrap items-center gap-2">
        <select name="method" defaultValue={filters.method ?? ""} className={filterInput}>
          <option value="">Todos os métodos</option>
          {["GET", "POST", "PUT", "PATCH", "DELETE"].map((m) => (
            <option key={m}>{m}</option>
          ))}
        </select>
        <select name="kind" defaultValue={filters.kind ?? ""} className={filterInput}>
          <option value="">Todos os tipos</option>
          {Object.entries(KINDS).map(([k, v]) => (
            <option key={k} value={k}>
              {v}
            </option>
          ))}
        </select>
        <input name="path" defaultValue={filters.path} placeholder="Caminho contém…" className={filterInput} />
        <input name="user" defaultValue={filters.user} placeholder="E-mail do usuário" className={filterInput} />
        <label className="flex items-center gap-1.5 text-sm">
          <input type="checkbox" name="errors" value="1" defaultChecked={filters.errors === "1"} /> Só erros
        </label>
        <button className="h-9 rounded-lg bg-wine px-4 text-sm font-semibold text-primary-foreground">Filtrar</button>
        <Link href="/admin/logs" className="px-2 text-sm text-rose underline">
          Limpar
        </Link>
      </form>

      <div className="surface overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="pl-5">Quando</TableHead>
              <TableHead>Método</TableHead>
              <TableHead>Caminho</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Usuário</TableHead>
              <TableHead>IP / Agente</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {logs.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="py-8 text-center text-muted-foreground">
                  Nenhuma requisição encontrada.
                </TableCell>
              </TableRow>
            )}
            {logs.map((log) => (
              <TableRow key={log.id} className="align-top">
                <TableCell className="whitespace-nowrap pl-5 text-xs">{formatDateTime(log.createdAt)}</TableCell>
                <TableCell>
                  <span className={cn("rounded px-1.5 py-0.5 font-mono text-[11px] font-bold", METHOD_COLOR[log.method] ?? "bg-muted")}>
                    {log.method}
                  </span>
                </TableCell>
                <TableCell className="max-w-xs font-mono text-xs">
                  <span className="break-all">
                    {log.path}
                    {log.query && <span className="text-muted-foreground">{log.query}</span>}
                  </span>
                  {log.error && <p className="mt-1 font-sans text-destructive">{log.error}</p>}
                </TableCell>
                <TableCell className="text-xs">
                  {KINDS[log.kind] ?? log.kind}
                  {log.actionId && <span className="block max-w-24 truncate text-muted-foreground" title={log.actionId}>{log.actionId}</span>}
                </TableCell>
                <TableCell className="text-xs">
                  {log.status ? (
                    <span className={cn("font-semibold", log.status >= 500 ? "text-destructive" : log.status >= 300 ? "text-[#9A4F14]" : "")}>
                      {log.status}
                    </span>
                  ) : (
                    "—"
                  )}
                </TableCell>
                <TableCell className="text-xs">{log.user?.email ?? "anônimo"}</TableCell>
                <TableCell className="text-xs">
                  {log.ip ?? "—"}
                  {log.userAgent && <span className="block max-w-48 truncate text-muted-foreground" title={log.userAgent}>{log.userAgent}</span>}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <Pagination page={page} pageSize={PAGE_SIZE} total={total} basePath="/admin/logs" params={filters} />
      </div>
    </>
  );
}

function Stat({ label, value, danger }: { label: string; value: string; danger?: boolean }) {
  return (
    <div className="surface px-4 py-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className={cn("mt-1 text-2xl font-bold", danger ? "text-destructive" : "text-cocoa")}>{value}</p>
    </div>
  );
}

function hoursAgo(hours: number) {
  return new Date(Date.now() - hours * 60 * 60 * 1000);
}
