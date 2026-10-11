"use client";

import { useActionState } from "react";
import { Mail } from "lucide-react";
import { requestResetAction } from "@/actions/auth";
import { IconInput } from "@/components/forms/icon-input";
import { SubmitButton, primaryCta } from "@/components/forms/submit-button";

export function ForgotForm() {
  const [state, action] = useActionState(requestResetAction, null);
  return (
    <form action={action} className="mt-6 space-y-4">
      <IconInput icon={<Mail />} name="email" type="email" placeholder="E-mail" required />
      {state && (
        <p className={`rounded-lg px-3 py-2 text-sm ${state.ok ? "bg-[#DFF0DA] text-[#3E7B3A]" : "bg-destructive/10 text-destructive"}`}>
          {state.ok ? state.message : state.error}
        </p>
      )}
      <SubmitButton className={primaryCta}>Enviar link</SubmitButton>
    </form>
  );
}
