import { ProductVisual } from "@/components/brand/product-visual";
import { cn } from "@/lib/utils";
import type { CartItem } from "./cart-provider";

/** Miniatura de um item do carrinho: foto de capa ou garrafinha na cor do sabor */
export function CartThumb({ item, className }: { item: CartItem; className?: string }) {
  return (
    <ProductVisual
      src={item.imageUrl}
      color={item.color}
      alt={item.name}
      className={cn("shrink-0 rounded-lg bg-peach/30", className)}
      bottleClassName="h-full w-auto py-0.5"
      label={false}
    />
  );
}
