"use client";

import { useActionState, useEffect, useMemo, useRef, useState, useTransition } from "react";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { deleteBottleReturnAction, registerBottleReturnAction } from "@/actions/admin";
import { SubmitButton } from "@/components/forms/submit-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { currency } from "@/lib/format";
import { cn } from "@/lib/utils";

type Customer = { id: string; name: string; email: string };

export function RegisterReturnForm({ customers, credit }: { customers: Customer[]; credit: number }) {
  const [state, action] = useActionState(registerBottleReturnAction, null);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Customer | null>(null);
  const [quantity, setQuantity] = useState(1);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.ok) {
      toast.success(state.message);
      // eslint-disable-next-line react-hooks/set-state-in-effect -- limpa o formulário após sucesso
      setSelected(null);
      setQuery("");
      setQuantity(1);
      formRef.current?.reset();
    } else if (state && !state.ok) toast.error(state.fieldErrors ? Object.values(state.fieldErrors)[0] : state.error);
  }, [state]);

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return customers.filter((c) => c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q)).slice(0, 6);
  }, [customers, query]);

  return (
    <form ref={formRef} action={action} className="mt-4 space-y-4">
      <input type="hidden" name="userId" value={selected?.id ?? ""} />
      <div className="space-y-1.5">
        <Label>Cliente</Label>
        {selected ? (
          <div className="flex items-center justify-between rounded-lg border border-wine/40 bg-peach/30 px-3 py-2 text-sm">
            <span>
              <span className="block font-semibold text-cocoa">{selected.name}</span>
              <span className="text-xs text-muted-foreground">{selected.email}</span>
            </span>
            <button type="button" className="text-xs font-semibold text-rose" onClick={() => setSelected(null)}>
              Trocar
            </button>
          </div>
        ) : (
          <div className="relative">
            <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar por nome ou e-mail" className="bg-cream-soft" />
            {matches.length > 0 && (
              <ul className="absolute z-10 mt-1 w-full overflow-hidden rounded-lg border bg-popover shadow-lg">
                {matches.map((c) => (
                  <li key={c.id}>
                    <button
                      type="button"
                      onClick={() => setSelected(c)}
                      className="w-full px-3 py-2 text-left text-sm hover:bg-muted"
                    >
                      <span className="block font-medium">{c.name}</span>
                      <span className="text-xs text-muted-foreground">{c.email}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="quantity">Quantidade de garrafas</Label>
        <Input
          id="quantity"
          name="quantity"
          type="number"
          min={1}
          value={quantity}
          onChange={(e) => setQuantity(Math.max(1, Number(e.target.value) || 1))}
          className="bg-cream-soft"
        />
        <p className="text-xs text-muted-foreground">Crédito gerado: {currency(quantity * credit)}</p>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="notes">Observações</Label>
        <Textarea id="notes" name="notes" placeholder="Opcional" className="bg-cream-soft" />
      </div>
      <SubmitButton className={cn("h-10 w-full rounded-xl bg-wine hover:bg-wine-dark")} disabled={!selected}>
        Registrar coleta
      </SubmitButton>
    </form>
  );
}

export function DeleteReturnButton({ id }: { id: string }) {
  const [pending, start] = useTransition();
  return (
    <button
      disabled={pending}
      aria-label="Excluir registro"
      className="text-muted-foreground hover:text-destructive disabled:opacity-40"
      onClick={() => {
        if (!confirm("Excluir este registro de coleta? O crédito do cliente será reduzido.")) return;
        start(async () => {
          const res = await deleteBottleReturnAction(id);
          if (res.ok) toast.success(res.message);
          else toast.error(res.error);
        });
      }}
    >
      <Trash2 className="size-4" />
    </button>
  );
}
