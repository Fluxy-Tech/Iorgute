"use client";

import { useState, useTransition } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { updatePreferencesAction } from "@/actions/customer";
import { primaryCta } from "@/components/forms/submit-button";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

type Prefs = { notifyOrders: boolean; notifyPromotions: boolean; favoriteFlavor: string | null };

export function PreferencesForm({ initial, flavors }: { initial: Prefs; flavors: string[] }) {
  const [prefs, setPrefs] = useState(initial);
  const [pending, start] = useTransition();

  return (
    <div className="mt-6 flex flex-col gap-3">
      <label className="surface flex items-center gap-3 px-4 py-4">
        <span className="flex-1">
          <span className="block text-sm font-semibold text-cocoa">Atualizações de pedidos</span>
          <span className="text-xs text-muted-foreground">Avisos quando seu pedido mudar de etapa</span>
        </span>
        <Switch checked={prefs.notifyOrders} onCheckedChange={(v) => setPrefs((p) => ({ ...p, notifyOrders: v }))} />
      </label>
      <label className="surface flex items-center gap-3 px-4 py-4">
        <span className="flex-1">
          <span className="block text-sm font-semibold text-cocoa">Promoções e novidades</span>
          <span className="text-xs text-muted-foreground">Cupons e novos sabores</span>
        </span>
        <Switch checked={prefs.notifyPromotions} onCheckedChange={(v) => setPrefs((p) => ({ ...p, notifyPromotions: v }))} />
      </label>
      <div className="surface px-4 py-4">
        <p className="text-sm font-semibold text-cocoa">Sabor favorito</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {flavors.map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setPrefs((p) => ({ ...p, favoriteFlavor: p.favoriteFlavor === f ? null : f }))}
              className={cn(
                "rounded-full border px-3 py-1.5 text-xs font-semibold transition",
                prefs.favoriteFlavor === f ? "border-wine bg-wine text-primary-foreground" : "border-input bg-cream-soft text-cocoa",
              )}
            >
              {f}
            </button>
          ))}
        </div>
      </div>
      <Button
        className={`${primaryCta} mt-2`}
        disabled={pending}
        onClick={() =>
          start(async () => {
            const res = await updatePreferencesAction(prefs);
            if (res.ok) toast.success(res.message);
            else toast.error(res.error);
          })
        }
      >
        {pending && <Loader2 className="animate-spin" />} Salvar preferências
      </Button>
    </div>
  );
}
