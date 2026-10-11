"use client";

import { useActionState, useEffect, useState } from "react";
import { Pencil, Plus } from "lucide-react";
import { toast } from "sonner";
import { saveCouponAction } from "@/actions/admin";
import { SubmitButton } from "@/components/forms/submit-button";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type Coupon = {
  id: string;
  code: string;
  description: string;
  type: "PERCENT" | "FIXED";
  value: number;
  minOrder: number;
  maxUses: number | null;
  expiresAt: string;
  active: boolean;
};

export function CouponDialog({ coupon }: { coupon?: Coupon }) {
  const [open, setOpen] = useState(false);
  const [state, action] = useActionState(saveCouponAction, null);
  const fe = state && !state.ok ? state.fieldErrors : undefined;

  useEffect(() => {
    if (state?.ok) {
      toast.success(state.message);
      // eslint-disable-next-line react-hooks/set-state-in-effect -- fecha o diálogo após salvar
      setOpen(false);
    } else if (state && !state.ok && !state.fieldErrors) toast.error(state.error);
  }, [state]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {coupon ? (
          <Button variant="ghost" size="icon-sm" aria-label="Editar">
            <Pencil />
          </Button>
        ) : (
          <Button className="h-10 rounded-xl bg-wine px-4 hover:bg-wine-dark">
            <Plus /> Novo cupom
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="bg-background sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-wine">{coupon ? "Editar cupom" : "Novo cupom"}</DialogTitle>
        </DialogHeader>
        <form action={action} className="grid grid-cols-2 gap-3">
          {coupon && <input type="hidden" name="id" value={coupon.id} />}
          <Field label="Código" name="code" defaultValue={coupon?.code} placeholder="BEMVINDO10" error={fe?.code} className="uppercase" />
          <div className="space-y-1.5">
            <Label>Tipo</Label>
            <Select name="type" defaultValue={coupon?.type ?? "PERCENT"}>
              <SelectTrigger className="w-full bg-cream-soft">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="PERCENT">Percentual (%)</SelectItem>
                <SelectItem value="FIXED">Valor fixo (R$)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="col-span-2">
            <Field label="Descrição" name="description" defaultValue={coupon?.description} error={fe?.description} />
          </div>
          <Field label="Valor" name="value" type="number" step="0.01" defaultValue={coupon?.value} error={fe?.value} />
          <Field label="Pedido mínimo (R$)" name="minOrder" type="number" step="0.01" defaultValue={coupon?.minOrder ?? 0} error={fe?.minOrder} />
          <Field label="Limite de usos" name="maxUses" type="number" defaultValue={coupon?.maxUses ?? ""} placeholder="Ilimitado" error={fe?.maxUses} />
          <Field label="Válido até" name="expiresAt" type="date" defaultValue={coupon?.expiresAt} error={fe?.expiresAt} />
          <label className="col-span-2 flex items-center gap-2 text-sm">
            <Checkbox name="active" defaultChecked={coupon?.active ?? true} /> Cupom ativo
          </label>
          <p className="col-span-2 text-xs text-muted-foreground">Cada cliente pode usar o mesmo cupom apenas uma vez.</p>
          <SubmitButton className="col-span-2 h-10 rounded-xl bg-wine hover:bg-wine-dark">Salvar</SubmitButton>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, error, ...props }: React.ComponentProps<typeof Input> & { label: string; error?: string }) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={props.name}>{label}</Label>
      <Input id={props.name} aria-invalid={!!error} {...props} className={`bg-cream-soft ${props.className ?? ""}`} />
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
