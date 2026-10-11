import "server-only";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/generated/prisma/client";

export type AuditInput = {
  action: string;
  entity: string;
  entityId?: string | number | null;
  userId?: string | null;
  userEmail?: string | null;
  before?: unknown;
  after?: unknown;
  ip?: string | null;
  userAgent?: string | null;
  success?: boolean;
  error?: string | null;
};

function toJson(value: unknown): Prisma.InputJsonValue | undefined {
  if (value === undefined || value === null) return undefined;
  return JSON.parse(
    JSON.stringify(value, (_k, v) => (typeof v === "bigint" ? v.toString() : v)),
  ) as Prisma.InputJsonValue;
}

export async function requestMeta() {
  try {
    const h = await headers();
    const ip =
      h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || null;
    return { ip, userAgent: h.get("user-agent") };
  } catch {
    return { ip: null, userAgent: null };
  }
}

/** Grava um registro de auditoria. Nunca lança erro para não quebrar o fluxo principal. */
export async function writeAudit(input: AuditInput) {
  try {
    const meta =
      input.ip !== undefined || input.userAgent !== undefined
        ? { ip: input.ip ?? null, userAgent: input.userAgent ?? null }
        : await requestMeta();
    await prisma.auditLog.create({
      data: {
        action: input.action,
        entity: input.entity,
        entityId: input.entityId != null ? String(input.entityId) : null,
        userId: input.userId ?? null,
        userEmail: input.userEmail ?? null,
        before: toJson(input.before),
        after: toJson(input.after),
        ip: meta.ip,
        userAgent: meta.userAgent,
        success: input.success ?? true,
        error: input.error ?? null,
      },
    });
  } catch (err) {
    console.error("[audit] falha ao gravar auditoria", err);
  }
}
