import { cn } from "@/lib/utils";

/** Garrafinha de iogurte desenhada em SVG, colorida pelo sabor do produto */
export function Bottle({
  color = "#E8A0A8",
  className,
  label = true,
}: {
  color?: string;
  className?: string;
  label?: boolean;
}) {
  return (
    <svg viewBox="0 0 60 120" className={cn("h-20 w-10 drop-shadow-sm", className)} aria-hidden>
      <rect x="20" y="4" width="20" height="12" rx="3" fill="#F4F0EC" stroke="#D8CFC8" />
      <path
        d="M22 16 h16 v8 c0 4 12 10 12 22 v58 c0 6 -4 10 -10 10 h-20 c-6 0 -10 -4 -10 -10 v-58 c0 -12 12 -18 12 -22z"
        fill={color}
        stroke="rgba(0,0,0,0.08)"
      />
      <path
        d="M22 16 h16 v8 c0 4 12 10 12 22 v6 h-40 v-6 c0 -12 12 -18 12 -22z"
        fill="#FFFFFF"
        opacity="0.45"
      />
      {label && (
        <g>
          <rect x="14" y="58" width="32" height="34" rx="4" fill="#FFF8F0" opacity="0.92" />
          {/* rótulo com o logotipo (640x435 → 28x19) */}
          <image href="/brand/iorgute-logo.webp" x="16" y="63" width="28" height="19" preserveAspectRatio="xMidYMid meet" />
          <rect x="20" y="85" width="20" height="2" rx="1" fill={color} opacity="0.8" />
        </g>
      )}
      <rect x="15" y="30" width="4" height="70" rx="2" fill="#FFFFFF" opacity="0.35" />
    </svg>
  );
}
