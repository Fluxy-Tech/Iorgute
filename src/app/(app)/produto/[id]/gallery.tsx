"use client";

import { useEffect, useState } from "react";
import { Bottle } from "@/components/brand/bottle";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious, type CarouselApi } from "@/components/ui/carousel";
import { cn } from "@/lib/utils";

export function ProductGallery({ images, color, name }: { images: { id: string; src: string }[]; color: string; name: string }) {
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);
  const multiple = images.length > 1;

  useEffect(() => {
    if (!api) return;
    const onSelect = () => setCurrent(api.selectedScrollSnap());
    onSelect();
    api.on("select", onSelect);
    api.on("reInit", onSelect);
    return () => {
      api.off("select", onSelect);
      api.off("reInit", onSelect);
    };
  }, [api]);

  // Sem fotos cadastradas: a garrafinha ilustrada na cor do sabor
  if (images.length === 0) {
    return (
      <div className="surface relative grid aspect-square w-full place-items-center overflow-hidden bg-gradient-to-b from-peach/60 to-card">
        <svg className="absolute -right-10 -top-10 size-48 opacity-50" viewBox="0 0 100 100" aria-hidden>
          <circle cx="50" cy="50" r="50" fill="var(--peach-strong)" />
        </svg>
        <Bottle color={color} className="relative h-[70%] w-auto" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <Carousel setApi={setApi} opts={{ loop: multiple }} className="surface overflow-hidden">
        <CarouselContent className="ml-0">
          {images.map(({ id, src }, i) => (
            <CarouselItem key={id} className="pl-0">
              <div className="aspect-square w-full bg-gradient-to-b from-peach/40 to-cream-soft p-6 lg:p-10">
                {/* eslint-disable-next-line @next/next/no-img-element -- imagem servida pela própria API */}
                <img
                  src={src}
                  alt={`${name} — foto ${i + 1} de ${images.length}`}
                  className="size-full object-contain mix-blend-multiply"
                  loading={i === 0 ? "eager" : "lazy"}
                />
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
        {multiple && (
          <>
            <CarouselPrevious className="left-3 size-10 border-0 bg-card/90 text-wine shadow-md hover:bg-card" />
            <CarouselNext className="right-3 size-10 border-0 bg-card/90 text-wine shadow-md hover:bg-card" />
            <div className="absolute inset-x-0 bottom-3 flex justify-center gap-1.5">
              {images.map(({ id }, i) => (
                <button
                  key={id}
                  onClick={() => api?.scrollTo(i)}
                  aria-label={`Ir para a foto ${i + 1}`}
                  className={cn("h-2 rounded-full bg-white/80 shadow transition-all", i === current ? "w-6 bg-wine" : "w-2")}
                />
              ))}
            </div>
          </>
        )}
      </Carousel>

      {multiple && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {images.map(({ id, src }, i) => (
            <button
              key={id}
              onClick={() => api?.scrollTo(i)}
              aria-label={`Ver foto ${i + 1}`}
              className={cn(
                "size-16 shrink-0 overflow-hidden rounded-xl border-2 bg-cream-soft p-1 transition lg:size-20",
                i === current ? "border-wine" : "border-transparent opacity-70 hover:opacity-100",
              )}
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- miniatura da mesma imagem */}
              <img src={src} alt="" className="size-full object-contain mix-blend-multiply" loading="lazy" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
