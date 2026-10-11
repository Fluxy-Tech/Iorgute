import type { Metadata } from "next";
import { PageHeader } from "@/components/admin/page-header";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { currency, formatDate, toNumber } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/session";
import { CouponDialog } from "./coupon-dialog";

export const metadata: Metadata = { title: "Cupons" };

export default async function CouponsPage() {
  await requireRole(["ADMIN"]);
  const coupons = await prisma.coupon.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { redemptions: true } }, redemptions: { select: { amount: true } } },
  });
  const now = new Date();
  return (
    <>
      <PageHeader title="Cupons" description="Descontos exibidos em “Meus descontos” e aplicados no carrinho." actions={<CouponDialog />} />
      <div className="surface overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="pl-5">Código</TableHead>
              <TableHead>Desconto</TableHead>
              <TableHead>Pedido mínimo</TableHead>
              <TableHead>Validade</TableHead>
              <TableHead className="text-right">Usos</TableHead>
              <TableHead className="text-right">Total concedido</TableHead>
              <TableHead>Status</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {coupons.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} className="py-8 text-center text-muted-foreground">
                  Nenhum cupom cadastrado.
                </TableCell>
              </TableRow>
            )}
            {coupons.map((c) => {
              const expired = c.expiresAt && c.expiresAt < now;
              const status = !c.active ? "Inativo" : expired ? "Expirado" : "Ativo";
              return (
                <TableRow key={c.id}>
                  <TableCell className="pl-5">
                    <p className="font-bold tracking-wide text-wine">{c.code}</p>
                    <p className="text-xs text-muted-foreground">{c.description}</p>
                  </TableCell>
                  <TableCell>{c.type === "PERCENT" ? `${toNumber(c.value)}%` : currency(c.value)}</TableCell>
                  <TableCell>{toNumber(c.minOrder) > 0 ? currency(c.minOrder) : "—"}</TableCell>
                  <TableCell>{c.expiresAt ? formatDate(c.expiresAt) : "Sem validade"}</TableCell>
                  <TableCell className="text-right">
                    {c._count.redemptions}
                    {c.maxUses ? ` / ${c.maxUses}` : ""}
                  </TableCell>
                  <TableCell className="text-right">{currency(c.redemptions.reduce((s, r) => s + toNumber(r.amount), 0))}</TableCell>
                  <TableCell>
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-semibold ${status === "Ativo" ? "bg-[#DFF0DA] text-[#3E7B3A]" : "bg-muted text-muted-foreground"}`}
                    >
                      {status}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <CouponDialog
                      coupon={{
                        id: c.id,
                        code: c.code,
                        description: c.description,
                        type: c.type,
                        value: toNumber(c.value),
                        minOrder: toNumber(c.minOrder),
                        maxUses: c.maxUses,
                        expiresAt: c.expiresAt ? c.expiresAt.toISOString().slice(0, 10) : "",
                        active: c.active,
                      }}
                    />
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </>
  );
}
