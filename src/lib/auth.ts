import "server-only";
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";
import { prisma } from "@/lib/prisma";
import { writeAudit } from "@/lib/audit";

export const auth = betterAuth({
  appName: "Iorgutê",
  baseURL: process.env.BETTER_AUTH_URL,
  // No `next build` (ex.: Docker) o segredo não é necessário e não deve ser embutido na imagem;
  // em execução, sem BETTER_AUTH_SECRET o better-auth recusa iniciar.
  secret:
    process.env.BETTER_AUTH_SECRET ??
    (process.env.NEXT_PHASE === "phase-production-build" ? "build-only-placeholder-not-used-at-runtime" : undefined),
  database: prismaAdapter(prisma, { provider: "postgresql" }),
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 6,
    autoSignIn: true,
    revokeSessionsOnPasswordReset: true,
    // Sem provedor de e-mail configurado: o link é registrado no log do servidor e na auditoria.
    sendResetPassword: async ({ user, url }) => {
      console.info(`[auth] Link de redefinição de senha para ${user.email}: ${url}`);
      await writeAudit({
        action: "PASSWORD_RESET_REQUESTED",
        entity: "user",
        entityId: user.id,
        userId: user.id,
        userEmail: user.email,
        after: { url },
      });
    },
  },
  user: {
    additionalFields: {
      role: { type: "string", required: false, defaultValue: "CUSTOMER", input: false },
      phone: { type: "string", required: false, input: true },
      active: { type: "boolean", required: false, defaultValue: true, input: false },
    },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7,
    updateAge: 60 * 60 * 24,
    cookieCache: { enabled: true, maxAge: 60 * 5 },
  },
  databaseHooks: {
    user: {
      create: {
        // O primeiro usuário cadastrado no sistema vira administrador
        before: async (user) => {
          const count = await prisma.user.count();
          if (count === 0) return { data: { ...user, role: "ADMIN" } };
          return { data: { ...user, role: "CUSTOMER" } };
        },
        after: async (user) => {
          await writeAudit({
            action: "USER_SIGNUP",
            entity: "user",
            entityId: user.id,
            userId: user.id,
            userEmail: user.email,
            after: { name: user.name, email: user.email, role: user.role },
          });
        },
      },
    },
    session: {
      create: {
        before: async (session) => {
          const user = await prisma.user.findUnique({
            where: { id: session.userId },
            select: { active: true },
          });
          if (user && !user.active) return false;
        },
        after: async (session) => {
          const user = await prisma.user.findUnique({
            where: { id: session.userId },
            select: { email: true },
          });
          await writeAudit({
            action: "LOGIN",
            entity: "session",
            entityId: session.id,
            userId: session.userId,
            userEmail: user?.email ?? null,
            ip: session.ipAddress ?? null,
            userAgent: session.userAgent ?? null,
          });
        },
      },
    },
  },
  plugins: [nextCookies()],
});

export type AuthSession = typeof auth.$Infer.Session;
