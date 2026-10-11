import { Bottle } from "@/components/brand/bottle";
import { cn } from "@/lib/utils";

/**
 * Foto de capa do produto; sem foto, usa a garrafinha ilustrada na cor do sabor.
 * A foto aparece inteira (sem corte) e o fundo branco dela se mistura ao fundo do site.
 */
export function ProductVisual({
  src,
  color,
  alt,
  className,
  bottleClassName,
  label = true,
}: {
  src?: string | null;
  color: string;
  alt: string;
  className?: string;
  bottleClassName?: string;
  label?: boolean;
}) {
  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- foto do bucket S3 (via API ou URL pública)
      <img src={src} alt={alt} loading="lazy" className={cn("object-contain mix-blend-multiply", className)} />
    );
  }
  return (
    <div className={cn("grid place-items-center", className)}>
      <Bottle color={color} className={bottleClassName} label={label} />
    </div>
  );
}
