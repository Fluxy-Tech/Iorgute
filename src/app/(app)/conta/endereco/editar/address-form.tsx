"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Building2, Home, Map, MapPin } from "lucide-react";
import { toast } from "sonner";
import { updateAddressAction } from "@/actions/customer";
import { IconInput } from "@/components/forms/icon-input";
import { SubmitButton, primaryCta } from "@/components/forms/submit-button";

type Address = { street: string; neighborhood: string; city: string; state: string; zipCode: string };

export function AddressForm({ initial }: { initial: Address }) {
  const router = useRouter();
  const [state, action] = useActionState(updateAddressAction, null);
  const fe = state && !state.ok ? state.fieldErrors : undefined;

  useEffect(() => {
    if (state?.ok) {
      toast.success(state.message);
      router.push("/conta/endereco");
    } else if (state && !state.ok && !state.fieldErrors) toast.error(state.error);
  }, [state, router]);

  return (
    <form action={action} className="mt-6 space-y-3">
      <IconInput icon={<MapPin />} name="street" defaultValue={initial.street} placeholder="Rua, número e complemento" required error={fe?.street} />
      <IconInput icon={<Home />} name="neighborhood" defaultValue={initial.neighborhood} placeholder="Bairro" required error={fe?.neighborhood} />
      <div className="grid grid-cols-[1fr_6rem] gap-3">
        <IconInput icon={<Building2 />} name="city" defaultValue={initial.city} placeholder="Cidade" required error={fe?.city} />
        <IconInput icon={<Map />} name="state" defaultValue={initial.state} placeholder="UF" maxLength={2} required error={fe?.state} />
      </div>
      <IconInput icon={<MapPin />} name="zipCode" defaultValue={initial.zipCode} placeholder="CEP" inputMode="numeric" required error={fe?.zipCode} />
      <SubmitButton className={`${primaryCta} mt-3`}>Salvar endereço</SubmitButton>
    </form>
  );
}
