import type { Metadata } from "next";
import { PageHeader } from "@/components/admin/page-header";
import { ProductVisual } from "@/components/brand/product-visual";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { currency, toNumber } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/session";
import { productImageSrc } from "@/lib/storage";
import { ProductDialog } from "./product-dialog";

export const metadata: Metadata = { title: "Produtos" };

export default async function ProductsPage() {
  await requireRole(["ADMIN"]);
  const products = await prisma.product.findMany({
    orderBy: [{ active: "desc" }, { name: "asc" }],
    include: {
      _count: { select: { items: true } },
      images: { select: { id: true, key: true }, orderBy: { position: "asc" } },
    },
  });
  return (
    <>
      <PageHeader title="Produtos" description="Catálogo exibido na tela inicial do cliente." actions={<ProductDialog />} />
      <div className="surface overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="pl-5">Produto</TableHead>
              <TableHead>Sabor</TableHead>
              <TableHead>Tamanho</TableHead>
              <TableHead className="text-right">Preço</TableHead>
              <TableHead className="text-right">Estoque</TableHead>
              <TableHead>Status</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="py-8 text-center text-muted-foreground">
                  Nenhum produto cadastrado.
                </TableCell>
              </TableRow>
            )}
            {products.map((p) => (
              <TableRow key={p.id} className={p.active ? "" : "opacity-60"}>
                <TableCell className="pl-5">
                  <div className="flex items-center gap-3">
                    <ProductVisual
                      src={p.images[0] ? productImageSrc(p.images[0]) : null}
                      color={p.color}
                      alt={p.name}
                      className="size-12 shrink-0 rounded-lg bg-peach/30"
                      bottleClassName="h-10 w-5"
                      label={false}
                    />
                    <div>
                      <p className="font-semibold text-cocoa">{p.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {p._count.items} vendas · {p.returnable ? "retornável" : "descartável"} ·{" "}
                        {p.images.length > 0 ? (
                          `${p.images.length} foto(s)`
                        ) : (
                          <span className="font-semibold text-[#9A4F14]">sem foto</span>
                        )}
                      </p>
                    </div>
                  </div>
                </TableCell>
                <TableCell>{p.flavor}</TableCell>
                <TableCell>{p.size}</TableCell>
                <TableCell className="text-right">{currency(p.price)}</TableCell>
                <TableCell className={`text-right font-semibold ${p.stock <= 5 ? "text-destructive" : ""}`}>{p.stock}</TableCell>
                <TableCell>
                  <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${p.active ? "bg-[#DFF0DA] text-[#3E7B3A]" : "bg-muted text-muted-foreground"}`}>
                    {p.active ? "Ativo" : "Inativo"}
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  <ProductDialog
                    product={{
                      id: p.id,
                      name: p.name,
                      flavor: p.flavor,
                      size: p.size,
                      description: p.description ?? "",
                      price: toNumber(p.price),
                      stock: p.stock,
                      images: p.images.map((i) => ({ id: i.id, src: productImageSrc(i) })),
                      returnable: p.returnable,
                      active: p.active,
                    }}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </>
  );
}
