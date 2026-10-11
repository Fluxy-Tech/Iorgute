"use client";

import { useTransition } from "react";
import { CheckCheck } from "lucide-react";
import { markNotificationsReadAction } from "@/actions/customer";

export function MarkRead() {
  const [pending, start] = useTransition();
  return (
    <button
      disabled={pending}
      onClick={() => start(async () => void (await markNotificationsReadAction()))}
      className="mt-3 flex items-center gap-1.5 self-end text-xs font-semibold text-rose disabled:opacity-50"
    >
      <CheckCheck className="size-4" /> Marcar todas como lidas
    </button>
  );
}
