"use client";

import { useActionState, useEffect, useRef } from "react";
import { Lock } from "lucide-react";
import { toast } from "sonner";
import { changePasswordAction } from "@/actions/customer";
import { BackHeader } from "@/components/app/back-header";
import { PasswordInput } from "@/components/forms/icon-input";
import { SubmitButton, primaryCta } from "@/components/forms/submit-button";

export default function ChangePasswordPage() {
  const [state, action] = useActionState(changePasswordAction, null);
  const formRef = useRef<HTMLFormElement>(null);
  const fe = state && !state.ok ? state.fieldErrors : undefined;

  useEffect(() => {
    if (state?.ok) {
      toast.success(state.message);
      formRef.current?.reset();
    } else if (state && !state.ok && !state.fieldErrors) toast.error(state.error);
  }, [state]);

  return (
    <div className="flex flex-1 flex-col px-4 pb-6 pt-6 lg:max-w-2xl lg:p-0">
      <BackHeader title="Alterar senha" href="/conta/dados" />
      <form ref={formRef} action={action} className="mt-6 space-y-3">
        <PasswordInput icon={<Lock />} name="currentPassword" placeholder="Senha atual" autoComplete="current-password" required error={fe?.currentPassword} />
        <PasswordInput icon={<Lock />} name="newPassword" placeholder="Nova senha" autoComplete="new-password" minLength={6} required error={fe?.newPassword} />
        <PasswordInput icon={<Lock />} name="confirm" placeholder="Confirme a nova senha" autoComplete="new-password" required error={fe?.confirm} />
        <p className="px-1 text-xs text-muted-foreground">Por segurança, as outras sessões abertas serão encerradas.</p>
        <SubmitButton className={`${primaryCta} mt-3`}>Alterar senha</SubmitButton>
      </form>
    </div>
  );
}
