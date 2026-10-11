"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Mail, Phone, User } from "lucide-react";
import { toast } from "sonner";
import { updateProfileAction } from "@/actions/customer";
import { IconInput } from "@/components/forms/icon-input";
import { SubmitButton, primaryCta } from "@/components/forms/submit-button";

export function ProfileForm({ name, phone, email }: { name: string; phone: string; email: string }) {
  const router = useRouter();
  const [state, action] = useActionState(updateProfileAction, null);
  const fe = state && !state.ok ? state.fieldErrors : undefined;

  useEffect(() => {
    if (state?.ok) {
      toast.success(state.message);
      router.push("/conta/dados");
    } else if (state && !state.ok && !state.fieldErrors) toast.error(state.error);
  }, [state, router]);

  return (
    <form action={action} className="mt-6 space-y-3">
      <IconInput icon={<User />} name="name" defaultValue={name} placeholder="Nome completo" required error={fe?.name} />
      <IconInput icon={<Phone />} name="phone" defaultValue={phone} placeholder="Telefone" type="tel" required error={fe?.phone} />
      <IconInput icon={<Mail />} value={email} disabled readOnly className="opacity-60" />
      <p className="px-1 text-xs text-muted-foreground">Para alterar o e-mail, fale com a loja.</p>
      <SubmitButton className={`${primaryCta} mt-3`}>Salvar</SubmitButton>
    </form>
  );
}
