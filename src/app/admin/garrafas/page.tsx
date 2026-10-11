import type { Metadata } from "next";
import { PageHeader } from "@/components/admin/page-header";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { currency, formatDateTime } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/session";
import { getSettings } from "@/lib/settings";
import { DeleteReturnButton, RegisterReturnForm } from "./forms";

export const metadata: Metadata = { title: "Coleta de vasilhames" };

export default async function BottlesAdminPage() {
  const user = await requireRole(["ADMIN", "STAFF"]);
  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);

  const [customers, returns, month, total, settings] = await Promise.all([
    prisma.user.findMany({
      where: { active: true },
      select: { id: true, name: true, email: true },
      orderBy: { name: "asc" },
    }),
    prisma.bottleReturn.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
      include: { user: { select: { name: true, email: true } }, staff: { select: { name: true } } },
    }),
    prisma.bottleReturn.aggregate({ where: { createdAt: { gte: monthStart } }, _sum: { quantity: true, credit: true }, _count: { userId: true } }),
    prisma.bottleReturn.aggregate({ _sum: { quantity: true, credit: true } }),
    getSettings(),
  ]);
  const participants = await prisma.bottleReturn.groupBy({ by: ["userId"], where: { createdAt: { gte: monthStart } } });

  return (
    <>
      <PageHeader
        title="Coleta de vasilhames"
        description={`Registre as garrafas devolvidas. Cada garrafa gera ${currency(settings.bottleCredit)} de crédito para o cliente.`}
      />
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Garrafas no mês" value={String(month._sum.quantity ?? 0)} />
        <Stat label="Créditos gerados no mês" value={currency(month._sum.credit)} />
        <Stat label="Clientes participantes no mês" value={String(participants.length)} />
        <Stat label="Total histórico" value={`${total._sum.quantity ?? 0} garrafas`} sub={currency(total._sum.credit)} />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[380px_1fr]">
        <div className="surface h-fit px-5 py-5">
          <h2 className="font-semibold text-cocoa">Registrar devolução</h2>
          <RegisterReturnForm customers={customers} credit={Number(settings.bottleCredit)} />
        </div>
        <div className="surface overflow-hidden">
          <h2 className="px-5 pt-4 font-semibold text-cocoa">Últimas coletas</h2>
          <Table className="mt-2">
            <TableHeader>
              <TableRow>
                <TableHead className="pl-5">Data</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead className="text-right">Garrafas</TableHead>
                <TableHead className="text-right">Crédito</TableHead>
                <TableHead>Recebido por</TableHead>
                {user.role === "ADMIN" && <TableHead />}
              </TableRow>
            </TableHeader>
            <TableBody>
              {returns.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                    Nenhuma coleta registrada.
                  </TableCell>
                </TableRow>
              )}
              {returns.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="pl-5 text-xs">{formatDateTime(r.createdAt)}</TableCell>
                  <TableCell>
                    <p className="font-medium">{r.user.name}</p>
                    <p className="text-xs text-muted-foreground">{r.user.email}</p>
                  </TableCell>
                  <TableCell className="text-right font-semibold">{r.quantity}</TableCell>
                  <TableCell className="text-right">{currency(r.credit)}</TableCell>
                  <TableCell className="text-xs">{r.staff?.name ?? "—"}</TableCell>
                  {user.role === "ADMIN" && (
                    <TableCell>
                      <DeleteReturnButton id={r.id} />
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </>
  );
}

function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="surface px-4 py-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-bold text-cocoa">{value}</p>
      {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
    </div>
  );
}
