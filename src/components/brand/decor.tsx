import { cn } from "@/lib/utils";

/** Manchas orgânicas de fundo (pêssego / vinho) presentes em todas as telas do layout */
export function Blobs({ variant = "default" }: { variant?: "default" | "auth" | "bottom" }) {
  return (
    <div className="pointer-events-none absolute inset-0 -z-0 overflow-hidden lg:hidden" aria-hidden>
      {variant === "auth" && (
        <svg className="absolute -left-10 -top-10 h-40 w-40" viewBox="0 0 100 100">
          <path d="M0 0 H70 C60 30 35 55 0 70 Z" fill="var(--wine)" />
        </svg>
      )}
      <svg className="absolute -right-16 top-24 h-72 w-48 opacity-70" viewBox="0 0 100 160">
        <path d="M60 0 C100 20 100 70 80 100 C60 130 70 160 100 160 V0 Z" fill="var(--peach)" />
      </svg>
      <svg className="absolute -bottom-6 -left-10 h-32 w-72 opacity-80" viewBox="0 0 200 80">
        <path d="M0 40 C40 10 80 60 130 40 C170 25 190 50 200 80 H0 Z" fill="var(--peach)" />
      </svg>
      {variant !== "default" && (
        <svg className="absolute -bottom-4 -right-6 h-24 w-40" viewBox="0 0 120 70">
          <path d="M20 70 C40 40 80 30 120 10 V70 Z" fill="var(--wine)" opacity="0.9" />
          <path d="M0 70 C30 55 70 50 120 40 V70 Z" fill="var(--rose)" opacity="0.55" />
        </svg>
      )}
    </div>
  );
}

export function Leaf({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 80 90" className={cn("h-24 w-20", className)} fill="none" aria-hidden>
      <g stroke="var(--rose)" strokeWidth="2" strokeLinecap="round" opacity="0.8">
        <path d="M10 85 C30 60 45 40 60 10" />
        <path d="M30 60 C20 50 18 38 22 28 C30 36 33 48 30 60Z" />
        <path d="M42 42 C34 32 34 20 40 10 C46 20 46 32 42 42Z" />
        <path d="M36 54 C46 50 56 50 66 56 C56 62 46 60 36 54Z" />
        <path d="M48 34 C56 28 66 26 76 30 C68 38 58 38 48 34Z" />
      </g>
    </svg>
  );
}
