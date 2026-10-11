"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Lock, Mail } from "lucide-react";
import { loginAction } from "@/actions/auth";
import { IconInput, PasswordInput } from "@/components/forms/icon-input";
import { SubmitButton, outlineCta, primaryCta } from "@/components/forms/submit-button";
import { Button } from "@/components/ui/button";

export function LoginForm({ next }: { next: string }) {
  const [state, action] = useActionState(loginAction, null);
  const fe = state && !state.ok ? state.fieldErrors : undefined;

  return (
    <form action={action} className="mt-8 space-y-4">
      <input type="hidden" name="next" value={next} />
      <IconInput icon={<Mail />} name="email" type="email" placeholder="E-mail" autoComplete="email" required error={fe?.email} />
      <PasswordInput icon={<Lock />} name="password" placeholder="Senha" autoComplete="current-password" required error={fe?.password} />
      {state && !state.ok && !fe && (
        <p className="rounded-lg bg-destructive/10 px-3 py-2 text-center text-sm text-destructive">{state.error}</p>
      )}
      <SubmitButton className={`${primaryCta} mt-2`}>Entrar</SubmitButton>

      <div className="flex flex-col items-center gap-3 pt-6">
        <p className="text-[15px] text-cocoa">Ainda não tem uma conta?</p>
        <Button asChild variant="outline" className={`${outlineCta} max-w-60`}>
          <Link href="/cadastro">Criar conta</Link>
        </Button>
        <Link href="/esqueci-senha" className="mt-6 text-sm text-rose underline underline-offset-2">
          Esqueceu sua senha?
        </Link>
      </div>
    </form>
  );
}
