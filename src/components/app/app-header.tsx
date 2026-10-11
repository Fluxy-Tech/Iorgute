import Link from "next/link";
import { Bell } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { AppMenu } from "./app-menu";

export function AppHeader({ unread, isStaff }: { unread: number; isStaff: boolean }) {
  return (
    <header className="relative z-10 flex items-center justify-between px-5 pt-6">
      <Link href="/inicio" aria-label="Início">
        <Logo size="sm" priority />
      </Link>
      <div className="flex items-center gap-1">
        <Link
          href="/notificacoes"
          aria-label="Notificações"
          className="relative grid size-10 place-items-center rounded-full text-wine transition hover:bg-peach/50"
        >
          <Bell className="size-6" />
          {unread > 0 && (
            <span className="absolute right-2 top-2 size-2.5 rounded-full bg-rose ring-2 ring-background" />
          )}
        </Link>
        <AppMenu isStaff={isStaff} />
      </div>
    </header>
  );
}
