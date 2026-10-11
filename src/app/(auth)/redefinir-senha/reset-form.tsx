"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Lock } from "lucide-react";
import { resetPasswordAction } from "@/actions/auth";
import { PasswordInput } from "@/components/forms/icon-input";
import { SubmitButton, primaryCta } from "@/components/forms/submit-button";

export function ResetForm({ token }: { token: string }) {
  const [state, action] = useActionState(resetPasswordAction, null);
  if (state?.ok) {
    return (
      <div className="mt-6 space-y-4">
        <p className="rounded-lg bg-[#DFF0DA] px-3 py-2 text-sm text-[#3E7B3A]">{state.message}</p>
        <Link href="/login" className="block text-center font-semibold text-rose underline">
          Ir para o login
        </Link>
      </div>
    );
  }
  return (
    <form action={action} className="mt-6 space-y-4">
      <input type="hidden" name="token" value={token} />
      <PasswordInput icon={<Lock />} name="password" placeholder="Nova senha" minLength={6} required />
      {state && !state.ok && <p className="text-sm text-destructive">{state.error}</p>}
      <SubmitButton className={primaryCta}>Salvar nova senha</SubmitButton>
    </form>
  );
}
