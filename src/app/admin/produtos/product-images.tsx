"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ImagePlus, Loader2, Star, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { deleteProductImageAction, setProductCoverAction, uploadProductImageAction } from "@/actions/admin";
import { cn } from "@/lib/utils";

export const MAX_IMAGES = 8;
const MAX_BYTES = 3 * 1024 * 1024;
const ACCEPT = "image/jpeg,image/png,image/webp,image/avif,image/gif";

/** Valida no navegador antes de enviar (o servidor valida de novo) */
function acceptFiles(files: FileList | null, slots: number) {
  const ok: File[] = [];
  for (const file of Array.from(files ?? [])) {
    if (!ACCEPT.split(",").includes(file.type)) toast.error(`${file.name}: use JPG, PNG, WEBP, AVIF ou GIF.`);
    else if (file.size > MAX_BYTES) toast.error(`${file.name} passa de 3 MB.`);
    else ok.push(file);
  }
  if (ok.length > slots) toast.error(`Máximo de ${MAX_IMAGES} fotos por produto.`);
  return ok.slice(0, Math.max(0, slots));
}

/** Envia as fotos uma a uma (cada requisição fica abaixo do limite de upload) */
export async function uploadAll(productId: string, files: File[], onProgress?: (done: number) => void) {
  let ok = 0;
  for (const [i, file] of files.entries()) {
    const fd = new FormData();
    fd.set("productId", productId);
    fd.set("file", file);
    const res = await uploadProductImageAction(fd);
    if (res.ok) ok++;
    else toast.error(`${file.name}: ${res.error}`);
    onProgress?.(i + 1);
  }
  return ok;
}

function Tile({ src, cover, children }: { src: string; cover: boolean; children?: React.ReactNode }) {
  return (
    <div className="group relative aspect-square overflow-hidden rounded-xl border bg-cream-soft p-2">
      {/* eslint-disable-next-line @next/next/no-img-element -- pré-visualização / foto do bucket */}
      <img src={src} alt="" className="size-full object-contain mix-blend-multiply" />
      {cover && <span className="absolute left-2 top-2 rounded-full bg-gold px-2 py-0.5 text-[10px] font-bold text-cocoa">Capa</span>}
      <div className="absolute inset-x-0 bottom-0 flex justify-end gap-1 bg-gradient-to-t from-black/60 to-transparent p-2 opacity-0 transition group-hover:opacity-100 group-focus-within:opacity-100">
        {children}
      </div>
    </div>
  );
}

function TileButton({ label, danger, ...props }: React.ComponentProps<"button"> & { label: string; danger?: boolean }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={cn("grid size-7 place-items-center rounded-full bg-white/90 disabled:opacity-50", danger ? "text-destructive" : "text-wine")}
      {...props}
    />
  );
}

function AddTile({ onPick, busy, progress }: { onPick: (files: FileList | null) => void; busy?: boolean; progress?: string }) {
  const inputRef = useRef<HTMLInputElement>(null);
  return (
    <>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={busy}
        className="flex aspect-square flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed border-wine/30 text-xs font-semibold text-wine transition hover:border-wine/60 hover:bg-peach/30 disabled:opacity-70"
      >
        {busy ? <Loader2 className="size-6 animate-spin" /> : <ImagePlus className="size-6" />}
        {busy ? progress : "Adicionar fotos"}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT}
        multiple
        hidden
        onChange={(e) => {
          onPick(e.target.files);
          e.target.value = "";
        }}
      />
    </>
  );
}

/** Produto existente: cada ação vai direto para o bucket/banco */
export function ProductImagesManager({ productId, images }: { productId: string; images: { id: string; src: string }[] }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [progress, setProgress] = useState<string | null>(null);

  async function add(files: FileList | null) {
    const list = acceptFiles(files, MAX_IMAGES - images.length);
    if (!list.length) return;
    setProgress(`0/${list.length}`);
    const ok = await uploadAll(productId, list, (done) => setProgress(`${done}/${list.length}`));
    setProgress(null);
    if (ok) toast.success(ok === 1 ? "Foto adicionada." : `${ok} fotos adicionadas.`);
    router.refresh();
  }

  function run(action: () => Promise<{ ok: boolean; message?: string; error?: string }>) {
    start(async () => {
      const res = await action();
      if (res.ok) {
        if (res.message) toast.success(res.message);
        router.refresh();
      } else toast.error(res.error);
    });
  }

  return (
    <div className="grid grid-cols-3 gap-2">
      {images.map(({ id, src }, index) => (
        <Tile key={id} src={src} cover={index === 0}>
          {index > 0 && <TileButton label="Definir como capa" disabled={pending} onClick={() => run(() => setProductCoverAction(id))}><Star className="size-4" /></TileButton>}
          <TileButton label="Remover foto" danger disabled={pending} onClick={() => confirm("Remover esta foto?") && run(() => deleteProductImageAction(id))}>
            <Trash2 className="size-4" />
          </TileButton>
        </Tile>
      ))}
      {images.length < MAX_IMAGES && <AddTile onPick={add} busy={!!progress} progress={progress ?? undefined} />}
    </div>
  );
}

/** Produto novo: as fotos ficam selecionadas aqui e são enviadas depois de salvar */
export function PendingImagesPicker({ files, onChange }: { files: File[]; onChange: (files: File[]) => void }) {
  const [previews, setPreviews] = useState<string[]>([]);

  useEffect(() => {
    const urls = files.map((f) => URL.createObjectURL(f));
    // eslint-disable-next-line react-hooks/set-state-in-effect -- URLs de pré-visualização derivadas dos arquivos
    setPreviews(urls);
    return () => urls.forEach((u) => URL.revokeObjectURL(u));
  }, [files]);

  return (
    <div className="grid grid-cols-3 gap-2">
      {previews.map((src, index) => (
        <Tile key={src} src={src} cover={index === 0}>
          {index > 0 && (
            <TileButton label="Definir como capa" onClick={() => onChange([files[index], ...files.filter((_, i) => i !== index)])}>
              <Star className="size-4" />
            </TileButton>
          )}
          <TileButton label="Remover foto" danger onClick={() => onChange(files.filter((_, i) => i !== index))}>
            <Trash2 className="size-4" />
          </TileButton>
        </Tile>
      ))}
      {files.length < MAX_IMAGES && <AddTile onPick={(list) => onChange([...files, ...acceptFiles(list, MAX_IMAGES - files.length)])} />}
    </div>
  );
}
