import { BottomNav } from "@/components/app/bottom-nav";
import { CartProvider } from "@/components/app/cart-provider";
import { DesktopHeader } from "@/components/app/desktop-header";
import { prisma } from "@/lib/prisma";
import { isStaff, requireUser } from "@/lib/session";

/**
 * Área do cliente.
 * Mobile: tela cheia com barra de navegação inferior (como no layout).
 * Desktop: cabeçalho com navegação e conteúdo em largura ampla.
 */
export default async function CustomerLayout({ children }: LayoutProps<"/">) {
  const user = await requireUser();
  const unread = await prisma.notification.count({ where: { userId: user.id, read: false } });

  return (
    <CartProvider userId={user.id}>
      <div className="relative isolate flex min-h-svh flex-col bg-background">
        <DesktopDecor />
        <DesktopHeader name={user.name} email={user.email} unread={unread} isStaff={isStaff(user)} />
        <div className="relative mx-auto flex w-full max-w-2xl flex-1 flex-col overflow-x-clip lg:max-w-7xl lg:px-8 lg:py-8">
          <main className="relative flex flex-1 flex-col">{children}</main>
        </div>
        <div className="lg:hidden">
          <BottomNav />
        </div>
      </div>
    </CartProvider>
  );
}

/** Manchas orgânicas do layout, adaptadas para tela larga */
function DesktopDecor() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 hidden overflow-hidden lg:block" aria-hidden>
      <svg className="absolute -right-24 top-32 h-[520px] w-80 opacity-60" viewBox="0 0 100 160">
        <path d="M60 0 C100 20 100 70 80 100 C60 130 70 160 100 160 V0 Z" fill="var(--peach)" />
      </svg>
      <svg className="absolute -bottom-10 -left-20 h-56 w-[640px] opacity-70" viewBox="0 0 200 80">
        <path d="M0 40 C40 10 80 60 130 40 C170 25 190 50 200 80 H0 Z" fill="var(--peach)" />
      </svg>
      <svg className="absolute -bottom-6 -right-6 h-40 w-72" viewBox="0 0 120 70">
        <path d="M20 70 C40 40 80 30 120 10 V70 Z" fill="var(--wine)" opacity="0.85" />
        <path d="M0 70 C30 55 70 50 120 40 V70 Z" fill="var(--rose)" opacity="0.45" />
      </svg>
    </div>
  );
}
