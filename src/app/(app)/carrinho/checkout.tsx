"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { BottleWine, Loader2, MapPin, Minus, Plus, TicketPercent, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { checkCouponAction, placeOrderAction } from "@/actions/customer";
import { useCart } from "@/components/app/cart-provider";
import { Bottle } from "@/components/brand/bottle";
import { CartThumb } from "@/components/app/cart-thumb";
import { primaryCta } from "@/components/forms/submit-button";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { currency } from "@/lib/format";
import { PAYMENT_LABEL } from "@/lib/constants";
import { cn } from "@/lib/utils";

type Props = {
  address: { line1: string; line2: string; zip: string } | null;
  delivers: boolean;
  bottleBalance: number;
  deliveryFee: number;
  deliveryDays: number;
};

type Payment = keyof typeof PAYMENT_LABEL;

export function Checkout({ address, delivers, bottleBalance, deliveryFee, deliveryDays }: Props) {
  const router = useRouter();
  const { items, subtotal, setQuantity, remove, clear } = useCart();
  const [useBottle, setUseBottle] = useState(bottleBalance > 0);
  const [couponInput, setCouponInput] = useState("");
  const [coupon, setCoupon] = useState<{ code: string; discount: number; description: string } | null>(null);
  const [payment, setPayment] = useState<Payment>("PIX");
  const [notes, setNotes] = useState("");
  const [checking, startChecking] = useTransition();
  const [placing, startPlacing] = useTransition();

  const couponDiscount = coupon ? Math.min(coupon.discount, subtotal) : 0;
  const bottleDiscount = useBottle ? Math.min(bottleBalance, Math.max(0, subtotal - couponDiscount)) : 0;
  const total = Math.max(0, subtotal - couponDiscount - bottleDiscount + deliveryFee);

  if (items.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
        <Bottle color="#F2D3C2" className="h-28 w-14 opacity-80" label={false} />
        <p className="font-script text-2xl font-bold text-wine">Seu carrinho está vazio</p>
        <p className="text-sm text-muted-foreground">Escolha seus iogurtes favoritos na tela inicial.</p>
        <Button asChild className={`${primaryCta} max-w-60`}>
          <Link href="/inicio">Ver produtos</Link>
        </Button>
      </div>
    );
  }

  function applyCoupon() {
    if (!couponInput.trim()) return;
    startChecking(async () => {
      const res = await checkCouponAction(couponInput, subtotal);
      if (res.ok && res.data) {
        setCoupon({ code: couponInput.trim().toUpperCase(), ...res.data });
        toast.success("Cupom aplicado!");
      } else if (!res.ok) {
        toast.error(res.error);
      }
    });
  }

  function placeOrder() {
    startPlacing(async () => {
      const res = await placeOrderAction({
        items: items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
        useBottleCredit: useBottle,
        couponCode: coupon?.code,
        paymentMethod: payment,
        notes: notes || undefined,
      });
      if (res.ok && res.data) {
        clear();
        toast.success(res.message);
        router.push(`/pedidos/${res.data.orderId}`);
      } else if (!res.ok) {
        toast.error(res.error);
      }
    });
  }

  return (
    <div className="mt-4 flex flex-col gap-4 lg:mt-6 lg:grid lg:grid-cols-[minmax(0,1fr)_380px] lg:items-start lg:gap-8">
      <div className="flex flex-col gap-4">
      <ul className="surface divide-y divide-border/70">
        {items.map((item) => (
          <li key={item.productId} className="flex items-center gap-3 px-3 py-3">
            <CartThumb item={item} className="size-14" />
            <div className="flex-1">
              <p className="text-sm font-bold text-cocoa">{item.name}</p>
              <p className="text-xs text-muted-foreground">{item.detail}</p>
              <p className="text-sm font-semibold text-wine">{currency(item.price * item.quantity)}</p>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => setQuantity(item.productId, item.quantity - 1)} className="grid size-7 place-items-center rounded-full bg-secondary text-wine" aria-label="Diminuir">
                <Minus className="size-4" />
              </button>
              <span className="w-4 text-center text-sm font-bold">{item.quantity}</span>
              <button onClick={() => setQuantity(item.productId, item.quantity + 1)} className="grid size-7 place-items-center rounded-full bg-wine text-white" aria-label="Aumentar">
                <Plus className="size-4" />
              </button>
              <button onClick={() => remove(item.productId)} className="ml-1 text-muted-foreground hover:text-destructive" aria-label="Remover">
                <Trash2 className="size-4" />
              </button>
            </div>
          </li>
        ))}
      </ul>

      <section className="surface px-4 py-3">
        <div className="flex items-start gap-3">
          <MapPin className="mt-0.5 size-5 text-wine" />
          {address ? (
            <div className="flex-1 text-sm">
              <p className="font-semibold text-cocoa">{address.line1}</p>
              <p className="text-muted-foreground">{address.line2}</p>
              <p className="text-muted-foreground">CEP {address.zip}</p>
              {!delivers && <p className="mt-1 text-xs font-semibold text-destructive">Ainda não entregamos nesta cidade.</p>}
            </div>
          ) : (
            <p className="flex-1 text-sm text-destructive">Cadastre um endereço de entrega.</p>
          )}
          <Link href="/conta/endereco/editar" className="text-xs font-semibold text-rose underline">
            Alterar
          </Link>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">Previsão de entrega em até {deliveryDays} dia(s).</p>
      </section>

      <section className="surface px-4 py-3">
        <p className="mb-2 text-sm font-semibold text-cocoa">Forma de pagamento</p>
        <div className="grid grid-cols-3 gap-2">
          {(Object.keys(PAYMENT_LABEL) as Payment[]).map((p) => (
            <button
              key={p}
              onClick={() => setPayment(p)}
              className={cn(
                "rounded-lg border px-2 py-2 text-xs font-semibold transition",
                payment === p ? "border-wine bg-wine text-primary-foreground" : "border-input bg-cream-soft text-cocoa",
              )}
            >
              {PAYMENT_LABEL[p]}
            </button>
          ))}
        </div>
        <Textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Observações (opcional)"
          className="mt-3 min-h-16 bg-cream-soft"
        />
      </section>
      </div>
      <div className="flex flex-col gap-4 lg:sticky lg:top-28">
      <section className="surface flex flex-col gap-3 px-4 py-3">
        <label className="flex items-center gap-3">
          <BottleWine className="size-5 text-wine" />
          <span className="flex-1 text-sm">
            <span className="block font-semibold text-cocoa">Usar crédito de garrafas</span>
            <span className="text-xs text-muted-foreground">Saldo disponível: {currency(bottleBalance)}</span>
          </span>
          <Switch checked={useBottle} onCheckedChange={setUseBottle} disabled={bottleBalance <= 0} />
        </label>
        <div className="flex items-center gap-2">
          <TicketPercent className="size-5 text-wine" />
          {coupon ? (
            <div className="flex flex-1 items-center justify-between rounded-lg bg-[#DFF0DA] px-3 py-2 text-sm text-[#3E7B3A]">
              <span>
                <strong>{coupon.code}</strong> · {coupon.description}
              </span>
              <button onClick={() => setCoupon(null)} aria-label="Remover cupom">
                <X className="size-4" />
              </button>
            </div>
          ) : (
            <>
              <input
                value={couponInput}
                onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                placeholder="Cupom de desconto"
                className="h-10 flex-1 rounded-lg border border-input bg-cream-soft px-3 text-sm uppercase outline-none focus:border-rose"
              />
              <Button variant="outline" className="h-10 rounded-lg border-rose/60 text-rose" onClick={applyCoupon} disabled={checking}>
                {checking ? <Loader2 className="animate-spin" /> : "Aplicar"}
              </Button>
            </>
          )}
        </div>
      </section>

      <section className="surface space-y-1.5 px-4 py-3 text-sm">
        <Row label="Subtotal" value={currency(subtotal)} />
        {couponDiscount > 0 && <Row label="Cupom" value={`− ${currency(couponDiscount)}`} accent />}
        {bottleDiscount > 0 && <Row label="Crédito de garrafas" value={`− ${currency(bottleDiscount)}`} accent />}
        <Row label="Entrega" value={deliveryFee > 0 ? currency(deliveryFee) : "Grátis"} />
        <div className="flex justify-between border-t border-border/70 pt-2 text-base font-bold text-wine">
          <span>Total</span>
          <span>{currency(total)}</span>
        </div>
      </section>

      <Button className={primaryCta} onClick={placeOrder} disabled={placing || !address || !delivers}>
        {placing && <Loader2 className="animate-spin" />} Finalizar pedido
      </Button>
      </div>
    </div>
  );
}

function Row({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="flex justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className={cn("font-semibold", accent ? "text-[#3E7B3A]" : "text-cocoa")}>{value}</span>
    </div>
  );
}
