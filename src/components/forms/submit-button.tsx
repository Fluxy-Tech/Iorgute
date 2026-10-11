"use client";

import { Loader2 } from "lucide-react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { ComponentProps } from "react";

export function SubmitButton({
  children,
  className,
  pending: pendingProp,
  ...props
}: ComponentProps<typeof Button> & { pending?: boolean }) {
  const { pending } = useFormStatus();
  const busy = pendingProp ?? pending;
  return (
    <Button type="submit" disabled={busy} className={cn(className)} {...props}>
      {busy && <Loader2 className="animate-spin" />}
      {children}
    </Button>
  );
}

/** Botão principal do layout (vinho, alto, arredondado) */
export const primaryCta =
  "h-12 w-full rounded-xl bg-wine text-base font-bold text-primary-foreground shadow-[0_6px_14px_-6px_rgba(116,33,58,0.6)] hover:bg-wine-dark";

/** Botão contornado do layout (rosa) */
export const outlineCta =
  "h-12 w-full rounded-full border-2 border-rose/70 bg-transparent text-base font-bold text-rose hover:bg-rose/5 hover:text-rose";
