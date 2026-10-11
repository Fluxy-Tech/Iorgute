import type { Metadata } from "next";
import Link from "next/link";
import { Search } from "lucide-react";
import { PageHeader } from "@/components/admin/page-header";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ROLE_DESCRIPTION, ROLE_LABEL, ROLES, type RoleName } from "@/lib/constants";
import { formatDate, initials } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/session";
import { cn } from "@/lib/utils";
import { ActiveToggle, RoleSelect } from "./user-controls";
import type { Prisma } from "@/generated/prisma/client";

export const metadata: Metadata = { title: "Usuários e acessos" };

export default async function UsersPage({ searchParams }: PageProps<"/admin/usuarios">) {
  const me = await requireRole(["ADMIN"]);
  const { q, role } = await searchParams;
  const query = typeof q === "string" ? q.trim() : "";
  const roleFilter = ROLES.includes(role as RoleName) ? (role as RoleName) : undefined;

  const where: Prisma.UserWhereInput = {
    ...(roleFilter && { role: roleFilter }),
    ...(query && {
      OR: [{ name: { contains: query, mode: "insensitive" } }, { email: { contains: query, mode: "insensitive" } }],
    }),
  };
  const [users, counts] = await Promise.all([
    prisma.user.findMany({
      where,
      orderBy: [{ role: "asc" }, { createdAt: "asc" }],
      include: { _count: { select: { orders: true, bottleReturns: true } } },
      take: 200,
    }),
    prisma.user.groupBy({ by: ["role"], _count: true }),
  ]);

  return (
    <>
      <PageHeader
        title="Usuários e acessos"
        description="O primeiro usuário cadastrado é administrador. Defina aqui quem pode acessar o painel."
      />

      <div className="mb-4 grid gap-3 md:grid-cols-3">
        {ROLES.map((r) => (
          <Link
            key={r}
            href={roleFilter === r ? "/admin/usuarios" : `/admin/usuarios?role=${r}`}
            className={cn("surface px-4 py-3 transition hover:border-rose/40", roleFilter === r && "border-wine ring-2 ring-wine/20")}
          >
            <div className="flex items-center justify-between">
              <p className="font-semibold text-cocoa">{ROLE_LABEL[r]}</p>
              <span className="text-xl font-bold text-wine">{counts.find((c) => c.role === r)?._count ?? 0}</span>
            </div>
            <p className="text-xs text-muted-foreground">{ROLE_DESCRIPTION[r]}</p>
          </Link>
        ))}
      </div>

      <form className="mb-4 flex max-w-sm items-center gap-2 rounded-xl border border-input bg-card px-3">
        <Search className="size-4 text-muted-foreground" />
        {roleFilter && <input type="hidden" name="role" value={roleFilter} />}
        <input name="q" defaultValue={query} placeholder="Buscar por nome ou e-mail" className="h-10 w-full bg-transparent text-sm outline-none" />
      </form>

      <div className="surface overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="pl-5">Usuário</TableHead>
              <TableHead>Telefone</TableHead>
              <TableHead>Desde</TableHead>
              <TableHead className="text-right">Pedidos</TableHead>
              <TableHead className="text-right">Coletas</TableHead>
              <TableHead>Acesso</TableHead>
              <TableHead>Ativo</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((u) => (
              <TableRow key={u.id} className={u.active ? "" : "opacity-60"}>
                <TableCell className="pl-5">
                  <div className="flex items-center gap-3">
                    <span className="grid size-9 place-items-center rounded-full bg-wine text-xs font-bold text-primary-foreground">
                      {initials(u.name)}
                    </span>
                    <div>
                      <p className="font-semibold text-cocoa">
                        {u.name} {u.id === me.id && <span className="text-xs font-normal text-muted-foreground">(você)</span>}
                      </p>
                      <p className="text-xs text-muted-foreground">{u.email}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-sm">{u.phone ?? "—"}</TableCell>
                <TableCell className="text-sm">{formatDate(u.createdAt)}</TableCell>
                <TableCell className="text-right">{u._count.orders}</TableCell>
                <TableCell className="text-right">{u._count.bottleReturns}</TableCell>
                <TableCell>
                  <RoleSelect userId={u.id} role={u.role} />
                </TableCell>
                <TableCell>
                  <ActiveToggle userId={u.id} active={u.active} disabled={u.id === me.id} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </>
  );
}
