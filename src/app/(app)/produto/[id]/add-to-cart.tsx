"use client";

import Link from "next/link";
import { useState } from "react";
import { Minus, Plus, ShoppingCart } from "lucide-react";
import { toast } from "sonner";
import { useCart } from "@/components/app/cart-provider";
import { primaryCta } from "@/components/forms/submit-button";
import { Button } from "@/components/ui/button";
import { currency } from "@/lib/format";

type Props = {
  product: { id: string; name: string; flavor: string; size: string; price: number; color: string; stock: number; imageUrl: string | null };
};

export function AddToCart({ product }: Props) {
  const { items, add } = useCart();
  const inCart = items.find((i) => i.productId === product.id)?.quantity ?? 0;
  const available = Math.max(0, product.stock - inCart);
  const [quantity, setQuantity] = useState(1);
  const qty = Math.min(quantity, Math.max(1, available));

  if (product.stock <= 0) {
    return <p className="rounded-xl bg-muted px-4 py-3 text-center font-semibold text-muted-foreground">Produto esgotado no momento</p>;
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-3">
        <div className="flex h-12 items-center gap-4 rounded-xl border border-input bg-cream-soft px-2">
          <button
            onClick={() => setQuantity(Math.max(1, qty - 1))}
            disabled={qty <= 1}
            className="grid size-8 place-items-center rounded-lg text-wine transition hover:bg-peach/50 disabled:opacity-40"
            aria-label="Diminuir quantidade"
          >
            <Minus className="size-4" />
          </button>
          <span className="w-6 text-center text-lg font-bold text-cocoa" aria-live="polite">
            {qty}
          </span>
          <button
            onClick={() => setQuantity(Math.min(available, qty + 1))}
            disabled={qty >= available}
            className="grid size-8 place-items-center rounded-lg text-wine transition hover:bg-peach/50 disabled:opacity-40"
            aria-label="Aumentar quantidade"
          >
            <Plus className="size-4" />
          </button>
        </div>
        <Button
          className={`${primaryCta} flex-1`}
          disabled={available <= 0}
          onClick={() => {
            add(
              {
                productId: product.id,
                name: product.name,
                detail: `${product.flavor} • ${product.size}`,
                price: product.price,
                color: product.color,
                imageUrl: product.imageUrl,
              },
              qty,
            );
            setQuantity(1);
            toast.success(`${qty}× ${product.name} adicionado ao carrinho`);
          }}
        >
          <ShoppingCart /> Adicionar · {currency(product.price * qty)}
        </Button>
      </div>
      {inCart > 0 && (
        <p className="text-sm text-muted-foreground">
          Você já tem <strong className="text-cocoa">{inCart}</strong> no carrinho.{" "}
          <Link href="/carrinho" className="font-semibold text-rose underline underline-offset-2">
            Ver carrinho
          </Link>
        </p>
      )}
      {available <= 0 && <p className="text-sm text-destructive">Você já adicionou todo o estoque disponível.</p>}
    </div>
  );
}
