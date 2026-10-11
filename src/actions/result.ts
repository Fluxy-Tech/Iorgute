import "server-only";
import { isAPIError } from "better-auth/api";
import { ZodError } from "zod";
import { ForbiddenError } from "@/lib/session";

export type ActionResult<T = undefined> =
  | { ok: true; message?: string; data?: T }
  | { ok: false; error: string; fieldErrors?: Record<string, string> };

const AUTH_MESSAGES: Record<string, string> = {
  INVALID_EMAIL_OR_PASSWORD: "E-mail ou senha inválidos.",
  USER_ALREADY_EXISTS: "Já existe uma conta com este e-mail.",
  USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL: "Já existe uma conta com este e-mail.",
  PASSWORD_TOO_SHORT: "A senha deve ter pelo menos 6 caracteres.",
  INVALID_PASSWORD: "Senha atual incorreta.",
  INVALID_TOKEN: "Link inválido ou expirado.",
  FAILED_TO_CREATE_SESSION: "Sua conta está desativada. Fale com a loja.",
};

export function errorMessage(err: unknown): string {
  if (isAPIError(err)) {
    const code = (err.body as { code?: string } | undefined)?.code;
    return (code && AUTH_MESSAGES[code]) || err.message || "Não foi possível concluir.";
  }
  if (err instanceof ZodError) return err.issues[0]?.message ?? "Dados inválidos.";
  if (err instanceof ForbiddenError) return err.message;
  if (err instanceof Error && err.name === "BusinessError") return err.message;
  console.error(err);
  return "Ocorreu um erro inesperado. Tente novamente.";
}

/** Erro de regra de negócio cuja mensagem pode ser exibida ao usuário */
export class BusinessError extends Error {
  name = "BusinessError";
}

export function fieldErrors(err: ZodError) {
  const out: Record<string, string> = {};
  for (const issue of err.issues) {
    const key = issue.path.join(".");
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}
