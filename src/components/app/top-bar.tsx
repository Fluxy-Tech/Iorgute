import { prisma } from "@/lib/prisma";
import { isStaff, requireUser } from "@/lib/session";
import { AppHeader } from "./app-header";

/** Cabeçalho com logo, sino (com indicador de não lidas) e menu */
export async function TopBar() {
  const user = await requireUser();
  const unread = await prisma.notification.count({ where: { userId: user.id, read: false } });
  return (
    <div className="lg:hidden">
      <AppHeader unread={unread} isStaff={isStaff(user)} />
    </div>
  );
}

export function Waves() {
  return (
    <svg className="pointer-events-none absolute inset-x-0 top-16 -z-0 h-28 w-full lg:hidden" viewBox="0 0 400 100" preserveAspectRatio="none" aria-hidden>
      <path d="M0 80 C60 40 110 70 170 50 C230 30 260 0 320 20 C360 34 380 20 400 10 V100 H0Z" fill="var(--peach)" opacity="0.7" />
      <path d="M180 100 C240 60 300 70 400 40 V100Z" fill="var(--peach-strong)" opacity="0.5" />
    </svg>
  );
}
