"use client";

import Link from "next/link";
import { BottleWine, Minus, Plus, ShoppingCart, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Bottle } from "@/components/brand/bottle";
import { CartThumb } from "@/components/app/cart-thumb";
import { useCart } from "@/components/app/cart-provider";
import { ProductVisual } from "@/components/brand/product-visual";
import { currency } from "@/lib/format";

export type CatalogProduct = {
  id: string;
  name: string;
  flavor: string;
  size: string;
  description: string | null;
  price: number;
  color: string;
  stock: number;
  coverImageUrl: string | null;
};

export function ProductCard({ product }: { product: CatalogProduct }) {
  const { items, add, setQuantity } = useCart();
  const inCart = items.find((i) => i.productId === product.id)?.quantity ?? 0;
  const soldOut = product.stock <= 0;

  return (
    <div className="surface flex flex-col items-center px-3 pb-3 pt-3 text-center lg:px-4 lg:pb-4 lg:pt-4">
      <Link href={`/produto/${product.id}`} className="group flex w-full flex-col items-center rounded-xl outline-none focus-visible:ring-3 focus-visible:ring-rose/30">
        <div className="relative h-40 w-full overflow-hidden rounded-xl bg-gradient-to-b from-peach/35 to-cream-soft py-2 lg:h-52">
          <ProductVisual
            src={product.coverImageUrl}
            color={product.color}
            alt={product.name}
            className="size-full"
            bottleClassName="h-24 w-12 lg:h-32 lg:w-16"
          />
        </div>
        <p className="mt-2 text-sm font-bold leading-tight text-cocoa group-hover:text-wine">{product.name}</p>
        <p className="text-xs text-muted-foreground">{product.size}</p>
        {product.description && (
          <p className="mt-1 hidden min-h-8 text-xs leading-snug text-cocoa/70 lg:line-clamp-2">{product.description}</p>
        )}
        <p className="mt-1 font-bold text-wine">{currency(product.price)}</p>
      </Link>
      {soldOut ? (
        <span className="mt-2 rounded-full bg-muted px-3 py-1.5 text-xs font-semibold text-muted-foreground">Esgotado</span>
      ) : inCart > 0 ? (
        <div className="mt-2 flex items-center gap-3 rounded-full bg-secondary px-1 py-1">
          <button
            onClick={() => setQuantity(product.id, inCart - 1)}
            className="grid size-7 place-items-center rounded-full bg-card text-wine"
            aria-label="Diminuir"
          >
            <Minus className="size-4" />
          </button>
          <span className="w-4 text-sm font-bold text-wine">{inCart}</span>
          <button
            onClick={() => inCart < product.stock && setQuantity(product.id, inCart + 1)}
            className="grid size-7 place-items-center rounded-full bg-wine text-white disabled:opacity-40"
            disabled={inCart >= product.stock}
            aria-label="Aumentar"
          >
            <Plus className="size-4" />
          </button>
        </div>
      ) : (
        <button
          onClick={() => {
            add({
              productId: product.id,
              name: product.name,
              detail: `${product.flavor} • ${product.size}`,
              price: product.price,
              color: product.color,
              imageUrl: product.coverImageUrl,
            });
            toast.success(`${product.name} adicionado ao carrinho`);
          }}
          className="mt-2 flex items-center gap-1.5 rounded-full bg-wine px-4 py-1.5 text-xs font-bold text-primary-foreground transition hover:bg-wine-dark"
        >
          <Plus className="size-3.5" /> Adicionar
        </button>
      )}
    </div>
  );
}

export function CartBar() {
  const { count, subtotal } = useCart();
  if (count === 0) return null;
  return (
    <div className="sticky bottom-0 z-20 px-4 pb-3 lg:hidden">
      <Link
        href="/carrinho"
        className="flex items-center gap-3 rounded-2xl bg-wine px-4 py-3 text-primary-foreground shadow-[0_10px_25px_-10px_rgba(92,26,46,0.8)]"
      >
        <ShoppingCart className="size-5" />
        <span className="flex-1 font-semibold">
          Ver carrinho · {count} {count === 1 ? "item" : "itens"}
        </span>
        <span className="font-bold">{currency(subtotal)}</span>
      </Link>
    </div>
  );
}

/** Resumo do carrinho fixo na lateral (somente desktop) */
export function CartAside({ bottleBalance }: { bottleBalance: number }) {
  const { items, count, subtotal, setQuantity, remove } = useCart();
  return (
    <aside className="surface sticky top-28 hidden flex-col overflow-hidden lg:flex">
      <div className="flex items-center gap-2 border-b border-border/70 bg-peach/30 px-5 py-4">
        <ShoppingCart className="size-5 text-wine" />
        <h2 className="flex-1 font-bold text-cocoa">Meu carrinho</h2>
        <span className="rounded-full bg-wine px-2 py-0.5 text-xs font-bold text-primary-foreground">{count}</span>
      </div>
      {items.length === 0 ? (
        <div className="flex flex-col items-center gap-2 px-5 py-10 text-center">
          <Bottle color="#F2D3C2" className="h-20 w-10 opacity-80" label={false} />
          <p className="font-script text-xl font-bold text-wine">Carrinho vazio</p>
          <p className="text-sm text-muted-foreground">Adicione seus iogurtes favoritos.</p>
        </div>
      ) : (
        <>
          <ul className="max-h-[45vh] divide-y divide-border/60 overflow-y-auto">
            {items.map((item) => (
              <li key={item.productId} className="flex items-center gap-3 px-5 py-3">
                <CartThumb item={item} className="size-12" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-cocoa">{item.name}</p>
                  <p className="text-xs text-muted-foreground">{currency(item.price * item.quantity)}</p>
                </div>
                <div className="flex items-center gap-1.5">
                  <button onClick={() => setQuantity(item.productId, item.quantity - 1)} className="grid size-6 place-items-center rounded-full bg-secondary text-wine" aria-label="Diminuir">
                    <Minus className="size-3.5" />
                  </button>
                  <span className="w-4 text-center text-sm font-bold">{item.quantity}</span>
                  <button onClick={() => setQuantity(item.productId, item.quantity + 1)} className="grid size-6 place-items-center rounded-full bg-wine text-white" aria-label="Aumentar">
                    <Plus className="size-3.5" />
                  </button>
                  <button onClick={() => remove(item.productId)} className="ml-1 text-muted-foreground hover:text-destructive" aria-label="Remover">
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
          <div className="space-y-3 border-t border-border/70 px-5 py-4">
            {bottleBalance > 0 && (
              <p className="flex items-center gap-2 rounded-lg bg-[#DFF0DA] px-3 py-2 text-xs text-[#3E7B3A]">
                <BottleWine className="size-4" /> {currency(bottleBalance)} de crédito de garrafas disponível
              </p>
            )}
            <div className="flex justify-between font-bold text-cocoa">
              <span>Subtotal</span>
              <span className="text-wine">{currency(subtotal)}</span>
            </div>
            <Link
              href="/carrinho"
              className="flex h-11 items-center justify-center rounded-xl bg-wine font-bold text-primary-foreground shadow-[0_6px_14px_-6px_rgba(116,33,58,0.6)] transition hover:bg-wine-dark"
            >
              Finalizar pedido
            </Link>
          </div>
        </>
      )}
    </aside>
  );
}
