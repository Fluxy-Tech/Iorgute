import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle2, XCircle } from "lucide-react";
import { PageHeader } from "@/components/admin/page-header";
import { Pagination, filterInput, sp } from "@/components/admin/pagination";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDateTime } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/session";
import type { Prisma } from "@/generated/prisma/client";

export const metadata: Metadata = { title: "Auditoria" };

const PAGE_SIZE = 30;

const ACTION_LABEL: Record<string, string> = {
  LOGIN: "Login",
  LOGIN_FAILED: "Falha de login",
  LOGOUT: "Logout",
  USER_SIGNUP: "Cadastro",
  PASSWORD_CHANGED: "Senha alterada",
  PASSWORD_CHANGE_FAILED: "Falha ao alterar senha",
  PASSWORD_RESET_REQUESTED: "Redefinição solicitada",
  PASSWORD_RESET: "Senha redefinida",
  PROFILE_UPDATED: "Dados atualizados",
  ADDRESS_UPDATED: "Endereço atualizado",
  PREFERENCES_UPDATED: "Preferências",
  ORDER_CREATED: "Pedido criado",
  ORDER_STATUS_CHANGED: "Status do pedido",
  BOTTLE_RETURN_REGISTERED: "Coleta registrada",
  BOTTLE_RETURN_DELETED: "Coleta removida",
  PRODUCT_CREATED: "Produto criado",
  PRODUCT_UPDATED: "Produto atualizado",
  COUPON_CREATED: "Cupom criado",
  COUPON_UPDATED: "Cupom atualizado",
  USER_ROLE_CHANGED: "Acesso alterado",
  USER_ACTIVATED: "Usuário reativado",
  USER_DEACTIVATED: "Usuário desativado",
  SETTINGS_UPDATED: "Configurações",
  PRODUCT_IMAGE_ADDED: "Foto adicionada",
  PRODUCT_IMAGE_REMOVED: "Foto removida",
  PRODUCT_IMAGE_COVER: "Capa do produto",
};

export default async function AuditPage({ searchParams }: PageProps<"/admin/auditoria">) {
  await requireRole(["ADMIN"]);
  const params = await searchParams;
  const filters = {
    action: sp(params.action),
    entity: sp(params.entity),
    user: sp(params.user),
    from: sp(params.from),
    to: sp(params.to),
    status: sp(params.status),
  };
  const page = Math.max(1, Number(sp(params.page)) || 1);

  const where: Prisma.AuditLogWhereInput = {
    ...(filters.action && { action: filters.action }),
    ...(filters.entity && { entity: filters.entity }),
    ...(filters.user && { userEmail: { contains: filters.user, mode: "insensitive" } }),
    ...(filters.status && { success: filters.status === "ok" }),
    ...((filters.from || filters.to) && {
      createdAt: {
        ...(filters.from && { gte: new Date(`${filters.from}T00:00:00`) }),
        ...(filters.to && { lte: new Date(`${filters.to}T23:59:59`) }),
      },
    }),
  };

  const [logs, total, actions, entities] = await Promise.all([
    prisma.auditLog.findMany({ where, orderBy: { createdAt: "desc" }, skip: (page - 1) * PAGE_SIZE, take: PAGE_SIZE }),
    prisma.auditLog.count({ where }),
    prisma.auditLog.findMany({ distinct: ["action"], select: { action: true }, orderBy: { action: "asc" } }),
    prisma.auditLog.findMany({ distinct: ["entity"], select: { entity: true }, orderBy: { entity: "asc" } }),
  ]);

  return (
    <>
      <PageHeader title="Auditoria" description="Trilha de quem fez o quê: logins, alterações de dados, pedidos, acessos e configurações." />

      <form className="mb-4 flex flex-wrap items-end gap-2">
        <select name="action" defaultValue={filters.action ?? ""} className={filterInput}>
          <option value="">Todas as ações</option>
          {actions.map((a) => (
            <option key={a.action} value={a.action}>
              {ACTION_LABEL[a.action] ?? a.action}
            </option>
          ))}
        </select>
        <select name="entity" defaultValue={filters.entity ?? ""} className={filterInput}>
          <option value="">Todas as entidades</option>
          {entities.map((e) => (
            <option key={e.entity} value={e.entity}>
              {e.entity}
            </option>
          ))}
        </select>
        <select name="status" defaultValue={filters.status ?? ""} className={filterInput}>
          <option value="">Sucesso e falha</option>
          <option value="ok">Somente sucesso</option>
          <option value="fail">Somente falhas</option>
        </select>
        <input name="user" defaultValue={filters.user} placeholder="E-mail do usuário" className={filterInput} />
        <input type="date" name="from" defaultValue={filters.from} className={filterInput} />
        <input type="date" name="to" defaultValue={filters.to} className={filterInput} />
        <button className="h-9 rounded-lg bg-wine px-4 text-sm font-semibold text-primary-foreground">Filtrar</button>
        <Link href="/admin/auditoria" className="h-9 px-2 text-sm leading-9 text-rose underline">
          Limpar
        </Link>
      </form>

      <div className="surface overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="pl-5">Quando</TableHead>
              <TableHead>Ação</TableHead>
              <TableHead>Entidade</TableHead>
              <TableHead>Usuário</TableHead>
              <TableHead>IP</TableHead>
              <TableHead>Detalhes</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {logs.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                  Nenhum registro encontrado.
                </TableCell>
              </TableRow>
            )}
            {logs.map((log) => (
              <TableRow key={log.id} className="align-top">
                <TableCell className="whitespace-nowrap pl-5 text-xs">{formatDateTime(log.createdAt)}</TableCell>
                <TableCell>
                  <span className="flex items-center gap-1.5 text-sm font-semibold text-cocoa">
                    {log.success ? <CheckCircle2 className="size-4 text-[#3E7B3A]" /> : <XCircle className="size-4 text-destructive" />}
                    {ACTION_LABEL[log.action] ?? log.action}
                  </span>
                  {log.error && <p className="mt-0.5 text-xs text-destructive">{log.error}</p>}
                </TableCell>
                <TableCell className="text-xs">
                  {log.entity}
                  {log.entityId && <span className="block max-w-32 truncate text-muted-foreground">{log.entityId}</span>}
                </TableCell>
                <TableCell className="text-xs">{log.userEmail ?? "—"}</TableCell>
                <TableCell className="text-xs">
                  {log.ip ?? "—"}
                  {log.userAgent && <span className="block max-w-40 truncate text-muted-foreground" title={log.userAgent}>{log.userAgent}</span>}
                </TableCell>
                <TableCell className="max-w-md">
                  {(log.before != null || log.after != null) && (
                    <details className="text-xs">
                      <summary className="cursor-pointer font-semibold text-rose">Ver alterações</summary>
                      <div className="mt-2 grid gap-2 md:grid-cols-2">
                        {log.before != null && (
                          <pre className="max-h-60 overflow-auto rounded-lg bg-muted p-2 text-[11px]">
                            <strong>Antes</strong>
                            {"\n"}
                            {JSON.stringify(log.before, null, 2)}
                          </pre>
                        )}
                        {log.after != null && (
                          <pre className="max-h-60 overflow-auto rounded-lg bg-peach/30 p-2 text-[11px]">
                            <strong>Depois</strong>
                            {"\n"}
                            {JSON.stringify(log.after, null, 2)}
                          </pre>
                        )}
                      </div>
                    </details>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <Pagination page={page} pageSize={PAGE_SIZE} total={total} basePath="/admin/auditoria" params={filters} />
      </div>
    </>
  );
}
