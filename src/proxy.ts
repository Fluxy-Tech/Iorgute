import { NextResponse, type NextFetchEvent, type NextRequest } from "next/server";
import { getSessionCookie } from "better-auth/cookies";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const PROTECTED_PREFIXES = ["/inicio", "/produto", "/sobre", "/pedidos", "/conta", "/carrinho", "/notificacoes", "/admin"];

function requestKind(request: NextRequest) {
  if (request.headers.get("next-action")) return "action";
  if (request.nextUrl.pathname.startsWith("/api")) return "api";
  // O Next remove os headers RSC/prefetch antes do proxy; o navegador informa se é carga de documento
  const dest = request.headers.get("sec-fetch-dest");
  return !dest || dest === "document" ? "page" : "rsc";
}

async function logRequest(request: NextRequest, status: number | null) {
  try {
    let userId: string | null = null;
    if (getSessionCookie(request)) {
      const session = await auth.api.getSession({ headers: request.headers });
      userId = session?.user.id ?? null;
    }
    const { pathname, search } = request.nextUrl;
    await prisma.requestLog.create({
      data: {
        method: request.method,
        path: pathname,
        query: search ? search.slice(0, 1000) : null,
        kind: requestKind(request),
        actionId: request.headers.get("next-action"),
        status,
        userId,
        ip:
          request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
          request.headers.get("x-real-ip") ||
          null,
        userAgent: request.headers.get("user-agent")?.slice(0, 500) ?? null,
        referer: request.headers.get("referer")?.slice(0, 500) ?? null,
      },
    });
  } catch (err) {
    console.error("[request-log] falha ao gravar log", err);
  }
}

export async function proxy(request: NextRequest, event: NextFetchEvent) {
  const { pathname } = request.nextUrl;
  const hasSession = !!getSessionCookie(request);

  // Proteção otimista (a checagem de role real acontece nos layouts e nas actions)
  const isProtected = PROTECTED_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));
  if (isProtected && !hasSession) {
    event.waitUntil(logRequest(request, 307));
    const url = new URL("/login", request.url);
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  event.waitUntil(logRequest(request, null));
  return NextResponse.next();
}

export const config = {
  // Assets estáticos e fotos de produto ficam fora do log (são arquivos, não chamadas da aplicação)
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api/produtos/imagens|.*\\.(?:png|jpg|jpeg|svg|gif|webp|ico|txt|xml|woff2?)$).*)"],
};
