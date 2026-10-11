import "server-only";
import { cache } from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { RoleName } from "@/lib/constants";

export type CurrentUser = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: RoleName;
  active: boolean;
};

/** Usuário logado (lido do banco para refletir a role atual). Memoizado por requisição. */
export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return null;
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, name: true, email: true, phone: true, role: true, active: true },
  });
  if (!user || !user.active) return null;
  return user;
});

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

export function hasRole(user: Pick<CurrentUser, "role"> | null, roles: RoleName[]) {
  return !!user && roles.includes(user.role);
}

export const isStaff = (user: Pick<CurrentUser, "role"> | null) =>
  hasRole(user, ["ADMIN", "STAFF"]);

/** Para páginas: redireciona quem não tem permissão. */
export async function requireRole(roles: RoleName[]) {
  const user = await requireUser();
  if (!roles.includes(user.role)) redirect(isStaff(user) ? "/admin" : "/inicio");
  return user;
}

export class ForbiddenError extends Error {
  constructor(message = "Você não tem permissão para esta ação.") {
    super(message);
  }
}

/** Para server actions: lança erro em vez de redirecionar. */
export async function assertRole(roles: RoleName[]) {
  const user = await getCurrentUser();
  if (!user) throw new ForbiddenError("Sessão expirada. Faça login novamente.");
  if (!roles.includes(user.role)) throw new ForbiddenError();
  return user;
}
