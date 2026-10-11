import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Leaf, Recycle, Truck } from "lucide-react";
import { BackHeader } from "@/components/app/back-header";
import { getCatalogProducts } from "@/lib/catalog";
import { currency, toNumber } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { getSettings } from "@/lib/settings";
import { productImageSrc } from "@/lib/storage";
import { CartBar, ProductCard } from "../../inicio/catalog";
import { AddToCart } from "./add-to-cart";
import { ProductGallery } from "./gallery";

async function getProduct(id: string) {
  return prisma.product.findFirst({
    where: { id, active: true },
    include: { images: { select: { id: true, key: true }, orderBy: { position: "asc" } } },
  });
}

export async function generateMetadata({ params }: PageProps<"/produto/[id]">): Promise<Metadata> {
  const { id } = await params;
  const product = await getProduct(id);
  return { title: product ? `${product.name} ${product.size}` : "Produto" };
}

export default async function ProductPage({ params }: PageProps<"/produto/[id]">) {
  await requireUser();
  const { id } = await params;
  const [product, catalog, settings] = await Promise.all([getProduct(id), getCatalogProducts(), getSettings()]);
  if (!product) notFound();

  const price = toNumber(product.price);
  const others = catalog.filter((p) => p.id !== product.id);
  const lowStock = product.stock > 0 && product.stock <= 5;

  return (
    <div className="relative flex flex-1 flex-col">
      <div className="flex flex-1 flex-col gap-6 px-4 pb-28 pt-6 lg:gap-12 lg:p-0">
        <BackHeader title="Detalhes do produto" href="/inicio" />

        <section className="flex flex-col gap-6 lg:grid lg:grid-cols-2 lg:items-start lg:gap-12">
          <ProductGallery images={product.images.map((i) => ({ id: i.id, src: productImageSrc(i) }))} color={product.color} name={product.name} />

          <div className="flex flex-col gap-5 lg:sticky lg:top-28">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wider text-rose">
                {product.flavor} · {product.size}
              </p>
              <h1 className="mt-1 font-script text-3xl font-bold leading-tight text-wine lg:text-5xl">{product.name}</h1>
            </div>

            <div className="flex items-end gap-3">
              <p className="text-3xl font-bold text-cocoa lg:text-4xl">{currency(price)}</p>
              {lowStock && (
                <span className="mb-1 rounded-full bg-[#FBE7B5] px-2.5 py-0.5 text-xs font-semibold text-[#8A5A00]">
                  Últimas {product.stock} unidades
                </span>
              )}
            </div>

            {product.description && <p className="leading-relaxed text-cocoa/90 lg:text-lg">{product.description}</p>}

            <AddToCart
              product={{
                id: product.id,
                name: product.name,
                flavor: product.flavor,
                size: product.size,
                price,
                color: product.color,
                imageUrl: product.images[0] ? productImageSrc(product.images[0]) : null,
                stock: product.stock,
              }}
            />

            <ul className="surface divide-y divide-border/60 text-sm">
              <li className="flex items-center gap-3 px-4 py-3">
                <Leaf className="size-5 shrink-0 text-wine" />
                <span className="text-cocoa">Artesanal e 100% natural, sem conservantes</span>
              </li>
              {product.returnable && (
                <li className="flex items-center gap-3 px-4 py-3">
                  <Recycle className="size-5 shrink-0 text-wine" />
                  <span className="text-cocoa">
                    Garrafa retornável: devolva e ganhe {currency(settings.bottleCredit)} de desconto
                  </span>
                </li>
              )}
              <li className="flex items-center gap-3 px-4 py-3">
                <Truck className="size-5 shrink-0 text-wine" />
                <span className="text-cocoa">
                  Entrega em até {settings.deliveryDays} dia(s)
                  {toNumber(settings.deliveryFee) > 0 ? ` · taxa ${currency(settings.deliveryFee)}` : " · frete grátis"}
                </span>
              </li>
            </ul>
          </div>
        </section>

        {others.length > 0 && (
          <section>
            <h2 className="font-script text-2xl font-bold text-wine lg:text-3xl">Outros produtos</h2>
            <p className="mb-4 text-sm text-muted-foreground">Aproveite e experimente outros sabores.</p>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 lg:gap-5">
              {others.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </section>
        )}
      </div>
      <CartBar />
    </div>
  );
}
