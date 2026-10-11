"use client";

import { useActionState, useEffect } from "react";
import { toast } from "sonner";
import { saveSettingsAction } from "@/actions/admin";
import { SubmitButton } from "@/components/forms/submit-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { SettingKey } from "@/lib/constants";

export function SettingsForm({ settings }: { settings: Record<SettingKey, string> }) {
  const [state, action] = useActionState(saveSettingsAction, null);
  const fe = state && !state.ok ? state.fieldErrors : undefined;

  useEffect(() => {
    if (state?.ok) toast.success(state.message);
    else if (state && !state.ok) toast.error(state.error);
  }, [state]);

  return (
    <form action={action} className="grid max-w-3xl gap-6">
      <section className="surface grid gap-4 px-5 py-5 sm:grid-cols-2">
        <h2 className="font-semibold text-cocoa sm:col-span-2">Loja</h2>
        <Field label="Nome da loja" name="storeName" defaultValue={settings.storeName} error={fe?.storeName} />
        <Field label="WhatsApp" name="storeWhatsapp" defaultValue={settings.storeWhatsapp} error={fe?.storeWhatsapp} />
      </section>
      <section className="surface grid gap-4 px-5 py-5 sm:grid-cols-2">
        <h2 className="font-semibold text-cocoa sm:col-span-2">Garrafas retornáveis</h2>
        <Field
          label="Crédito por garrafa devolvida (R$)"
          name="bottleCredit"
          type="number"
          step="0.01"
          defaultValue={settings.bottleCredit}
          error={fe?.bottleCredit}
          hint="Vale para novas coletas; coletas antigas mantêm o valor da época."
        />
      </section>
      <section className="surface grid gap-4 px-5 py-5 sm:grid-cols-2">
        <h2 className="font-semibold text-cocoa sm:col-span-2">Entrega</h2>
        <Field label="Taxa de entrega (R$)" name="deliveryFee" type="number" step="0.01" defaultValue={settings.deliveryFee} error={fe?.deliveryFee} />
        <Field label="Prazo de entrega (dias)" name="deliveryDays" type="number" defaultValue={settings.deliveryDays} error={fe?.deliveryDays} />
        <div className="sm:col-span-2">
          <Field
            label="Cidades atendidas"
            name="deliveryCities"
            defaultValue={settings.deliveryCities}
            error={fe?.deliveryCities}
            hint="Separe por vírgula. Ex.: Uberlândia, Araguari"
          />
        </div>
      </section>
      <SubmitButton className="h-10 w-48 rounded-xl bg-wine hover:bg-wine-dark">Salvar configurações</SubmitButton>
    </form>
  );
}

function Field({
  label,
  error,
  hint,
  ...props
}: React.ComponentProps<typeof Input> & { label: string; error?: string; hint?: string }) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={props.name}>{label}</Label>
      <Input id={props.name} aria-invalid={!!error} className="bg-cream-soft" {...props} />
      {error ? <p className="text-xs text-destructive">{error}</p> : hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}
