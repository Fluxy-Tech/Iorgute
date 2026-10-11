"use client";

import { useState, type ComponentProps, type ReactNode } from "react";
import { Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = ComponentProps<"input"> & { icon: ReactNode; error?: string };

/** Campo do layout: fundo creme, ícone à esquerda, cantos arredondados */
export function IconInput({ icon, className, error, ...props }: Props) {
  return (
    <div className="space-y-1">
      <label
        className={cn(
          "flex h-12 items-center gap-3 rounded-xl border border-input bg-cream-soft px-4 text-foreground shadow-[inset_0_1px_2px_rgba(116,33,58,0.04)] transition focus-within:border-rose focus-within:ring-3 focus-within:ring-rose/15",
          error && "border-destructive",
          className,
        )}
      >
        <span className="text-[#8A6A66] [&_svg]:size-5">{icon}</span>
        <input
          className="h-full w-full bg-transparent text-[15px] outline-none placeholder:text-[#9C8580]"
          {...props}
        />
      </label>
      {error && <p className="px-1 text-xs text-destructive">{error}</p>}
    </div>
  );
}

export function PasswordInput({ icon, className, error, ...props }: Props) {
  const [show, setShow] = useState(false);
  return (
    <div className="space-y-1">
      <label
        className={cn(
          "flex h-12 items-center gap-3 rounded-xl border border-input bg-cream-soft px-4 transition focus-within:border-rose focus-within:ring-3 focus-within:ring-rose/15",
          error && "border-destructive",
          className,
        )}
      >
        <span className="text-[#8A6A66] [&_svg]:size-5">{icon}</span>
        <input
          type={show ? "text" : "password"}
          className="h-full w-full bg-transparent text-[15px] outline-none placeholder:text-[#9C8580]"
          {...props}
        />
        <button
          type="button"
          onClick={() => setShow((s) => !s)}
          className="text-[#8A6A66] hover:text-wine"
          aria-label={show ? "Ocultar senha" : "Mostrar senha"}
        >
          {show ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
        </button>
      </label>
      {error && <p className="px-1 text-xs text-destructive">{error}</p>}
    </div>
  );
}
