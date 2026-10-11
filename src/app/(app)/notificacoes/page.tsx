import type { Metadata } from "next";
import Link from "next/link";
import { Bell } from "lucide-react";
import { BackHeader } from "@/components/app/back-header";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { timeAgo } from "@/lib/format";
import { cn } from "@/lib/utils";
import { MarkRead } from "./mark-read";

export const metadata: Metadata = { title: "Notificações" };

export default async function NotificationsPage() {
  const user = await requireUser();
  const notifications = await prisma.notification.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  const unread = notifications.some((n) => !n.read);

  return (
    <div className="flex flex-1 flex-col px-4 pb-6 pt-6 lg:max-w-2xl lg:p-0">
      <BackHeader title="Notificações" href="/conta" />
      {unread && <MarkRead />}
      <div className="mt-4 flex flex-col gap-2">
        {notifications.length === 0 && (
          <div className="surface flex flex-col items-center gap-2 px-4 py-10 text-center text-sm text-muted-foreground">
            <Bell className="size-8 text-wine/50" />
            Nenhuma notificação por aqui.
          </div>
        )}
        {notifications.map((n) => {
          const body = (
            <>
              <span className={cn("mt-1.5 size-2.5 shrink-0 rounded-full", n.read ? "bg-transparent" : "bg-rose")} />
              <div className="flex-1">
                <p className="text-sm font-semibold text-cocoa">{n.title}</p>
                <p className="text-xs text-muted-foreground">{n.message}</p>
                <p className="mt-1 text-[11px] text-muted-foreground/80">{timeAgo(n.createdAt)}</p>
              </div>
            </>
          );
          return n.link ? (
            <Link key={n.id} href={n.link} className="surface flex gap-3 px-4 py-3 transition hover:border-rose/40">
              {body}
            </Link>
          ) : (
            <div key={n.id} className="surface flex gap-3 px-4 py-3">
              {body}
            </div>
          );
        })}
      </div>
    </div>
  );
}
