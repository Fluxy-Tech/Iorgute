import Image from "next/image";
import { cn } from "@/lib/utils";

// Arquivo já recortado e otimizado (public/brand), por isso dispensa o otimizador do Next
const LOGO = { src: "/brand/iorgute-logo.webp", width: 640, height: 435 };

const HEIGHT = { xs: "h-10", sm: "h-12", md: "h-16", lg: "h-28", xl: "h-36" } as const;

/** Logotipo Iorgutê (pote cremoso). Em fundo vinho, use `badge` para manter o contraste. */
export function Logo({
  className,
  size = "md",
  badge = false,
  priority = false,
}: {
  className?: string;
  size?: keyof typeof HEIGHT;
  badge?: boolean;
  priority?: boolean;
}) {
  const img = (
    <Image
      src={LOGO.src}
      width={LOGO.width}
      height={LOGO.height}
      alt="Iorgutê"
      priority={priority}
      unoptimized
      className={cn("w-auto select-none", HEIGHT[size], !badge && className)}
    />
  );
  if (!badge) return img;
  return (
    <span className={cn("inline-flex rounded-2xl bg-[#FFF6EE] px-3 py-2 shadow-[0_6px_16px_-8px_rgba(0,0,0,0.45)]", className)}>
      {img}
    </span>
  );
}
