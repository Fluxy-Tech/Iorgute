import "server-only";
import { prisma } from "@/lib/prisma";
import { toNumber } from "@/lib/format";
import { productImageSrc } from "@/lib/storage";
import type { Prisma } from "@/generated/prisma/client";

/** Produtos ativos com a URL da foto de capa */
export async function getCatalogProducts() {
  const products = await prisma.product.findMany({
    where: { active: true },
    orderBy: [{ name: "asc" }, { size: "asc" }],
    include: { images: { select: { id: true, key: true }, orderBy: { position: "asc" }, take: 1 } },
  });
  return products.map((p) => ({
    id: p.id,
    name: p.name,
    flavor: p.flavor,
    size: p.size,
    description: p.description,
    price: toNumber(p.price),
    color: p.color,
    stock: p.stock,
    coverImageUrl: p.images[0] ? productImageSrc(p.images[0]) : null,
  }));
}

/** Campos para exibir a miniatura do produto (capa ou garrafinha na cor do sabor) em pedidos, kanban etc. */
export const productThumbSelect = {
  color: true,
  images: { select: { id: true, key: true }, orderBy: { position: "asc" }, take: 1 },
} satisfies Prisma.ProductSelect;

export function productThumb(product: { color: string; images: { id: string; key: string }[] }) {
  return { color: product.color, imageUrl: product.images[0] ? productImageSrc(product.images[0]) : null };
}
