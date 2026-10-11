"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { writeAudit } from "@/lib/audit";
import { getCurrentUser } from "@/lib/session";
import { errorMessage, fieldErrors, type ActionResult } from "./result";

const loginSchema = z.object({
  email: z.email("Informe um e-mail válido.").trim().toLowerCase(),
  password: z.string().min(1, "Informe sua senha."),
});

export async function loginAction(_: unknown, formData: FormData): Promise<ActionResult> {
  const parsed = loginSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, error: "Verifique os campos.", fieldErrors: fieldErrors(parsed.error) };
  try {
    await auth.api.signInEmail({ body: parsed.data, headers: await headers() });
  } catch (err) {
    await writeAudit({
      action: "LOGIN_FAILED",
      entity: "session",
      userEmail: parsed.data.email,
      success: false,
      error: errorMessage(err),
    });
    return { ok: false, error: errorMessage(err) };
  }
  const next = String(formData.get("next") ?? "");
  redirect(next.startsWith("/") && !next.startsWith("//") ? next : "/");
}

const registerSchema = z.object({
  name: z.string().trim().min(3, "Informe seu nome completo."),
  email: z.email("Informe um e-mail válido.").trim().toLowerCase(),
  phone: z.string().trim().min(10, "Informe um telefone com DDD."),
  password: z.string().min(6, "A senha deve ter pelo menos 6 caracteres."),
  street: z.string().trim().min(3, "Informe rua, número e complemento."),
  neighborhood: z.string().trim().min(2, "Informe o bairro."),
  city: z.string().trim().min(2, "Informe a cidade."),
  zipCode: z.string().trim().regex(/^\d{5}-?\d{3}$/, "CEP inválido."),
});

export async function registerAction(_: unknown, formData: FormData): Promise<ActionResult> {
  const parsed = registerSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, error: "Verifique os campos.", fieldErrors: fieldErrors(parsed.error) };
  const { name, email, phone, password, street, neighborhood, city, zipCode } = parsed.data;
  try {
    const result = await auth.api.signUpEmail({
      body: { name, email, password, phone },
      headers: await headers(),
    });
    const [cityName, state] = city.split(/\s*[-/]\s*/);
    await prisma.address.create({
      data: {
        userId: result.user.id,
        street,
        neighborhood,
        city: cityName,
        state: state?.toUpperCase().slice(0, 2) || "MG",
        zipCode: zipCode.replace(/^(\d{5})(\d{3})$/, "$1-$2"),
      },
    });
    await prisma.userPreference.create({ data: { userId: result.user.id } });
  } catch (err) {
    return { ok: false, error: errorMessage(err) };
  }
  redirect("/");
}

export async function logoutAction() {
  const user = await getCurrentUser();
  const h = await headers();
  try {
    await auth.api.signOut({ headers: h });
  } finally {
    if (user) {
      await writeAudit({ action: "LOGOUT", entity: "session", userId: user.id, userEmail: user.email });
    }
  }
  redirect("/login");
}

export async function requestResetAction(_: unknown, formData: FormData): Promise<ActionResult> {
  const parsed = z.email("Informe um e-mail válido.").safeParse(String(formData.get("email") ?? "").trim().toLowerCase());
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };
  try {
    await auth.api.requestPasswordReset({
      body: { email: parsed.data, redirectTo: "/redefinir-senha" },
      headers: await headers(),
    });
  } catch (err) {
    return { ok: false, error: errorMessage(err) };
  }
  return {
    ok: true,
    message: "Se o e-mail estiver cadastrado, enviaremos as instruções. Em caso de dúvida, fale com a loja.",
  };
}

export async function resetPasswordAction(_: unknown, formData: FormData): Promise<ActionResult> {
  const token = String(formData.get("token") ?? "");
  const password = String(formData.get("password") ?? "");
  if (password.length < 6) return { ok: false, error: "A senha deve ter pelo menos 6 caracteres." };
  try {
    await auth.api.resetPassword({ body: { token, newPassword: password }, headers: await headers() });
    await writeAudit({ action: "PASSWORD_RESET", entity: "user" });
  } catch (err) {
    return { ok: false, error: errorMessage(err) };
  }
  return { ok: true, message: "Senha redefinida! Faça login com a nova senha." };
}
