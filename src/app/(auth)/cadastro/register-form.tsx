"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Building2, Home, Lock, Mail, MapPin, Phone, User } from "lucide-react";
import { registerAction } from "@/actions/auth";
import { IconInput, PasswordInput } from "@/components/forms/icon-input";
import { SubmitButton, primaryCta } from "@/components/forms/submit-button";

export function RegisterForm() {
  const [state, action] = useActionState(registerAction, null);
  const fe = state && !state.ok ? state.fieldErrors : undefined;

  return (
    <form action={action} className="mt-6 space-y-3">
      <IconInput icon={<User />} name="name" placeholder="Nome completo" autoComplete="name" required error={fe?.name} />
      <IconInput icon={<Mail />} name="email" type="email" placeholder="E-mail" autoComplete="email" required error={fe?.email} />
      <IconInput icon={<Phone />} name="phone" type="tel" placeholder="Telefone" autoComplete="tel" required error={fe?.phone} />
      <PasswordInput icon={<Lock />} name="password" placeholder="Senha" autoComplete="new-password" required minLength={6} error={fe?.password} />

      <p className="pt-3 text-[15px] font-medium text-cocoa">Endereço de entrega</p>
      <IconInput icon={<MapPin />} name="street" placeholder="Rua, número e complemento" autoComplete="street-address" required error={fe?.street} />
      <IconInput icon={<Home />} name="neighborhood" placeholder="Bairro" required error={fe?.neighborhood} />
      <IconInput icon={<Building2 />} name="city" placeholder="Cidade" autoComplete="address-level2" required error={fe?.city} />
      <IconInput icon={<MapPin />} name="zipCode" placeholder="CEP" inputMode="numeric" autoComplete="postal-code" required error={fe?.zipCode} />

      {state && !state.ok && !fe && (
        <p className="rounded-lg bg-destructive/10 px-3 py-2 text-center text-sm text-destructive">{state.error}</p>
      )}
      <SubmitButton className={`${primaryCta} mt-4 rounded-full`}>Criar conta</SubmitButton>
      <p className="pt-4 text-center text-[15px] text-cocoa">
        Já tem uma conta?{" "}
        <Link href="/login" className="font-semibold text-rose underline underline-offset-2">
          Entrar
        </Link>
      </p>
    </form>
  );
}
