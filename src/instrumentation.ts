import type { Instrumentation } from "next";

// Registra erros de renderização / route handlers / actions no log de requisições
export const onRequestError: Instrumentation.onRequestError = async (err, request, context) => {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  try {
    const { prisma } = await import("@/lib/prisma");
    const error = err as Error & { digest?: string };
    const url = new URL(request.path, "http://localhost");
    await prisma.requestLog.create({
      data: {
        method: request.method,
        path: url.pathname,
        query: url.search || null,
        kind: context.routeType === "action" ? "action" : context.routeType === "route" ? "api" : "page",
        status: 500,
        error: `${error.message}${error.digest ? ` (digest ${error.digest})` : ""}`.slice(0, 2000),
        userAgent: (request.headers["user-agent"] as string | undefined)?.slice(0, 500) ?? null,
      },
    });
  } catch (e) {
    console.error("[instrumentation] falha ao registrar erro", e);
  }
};
