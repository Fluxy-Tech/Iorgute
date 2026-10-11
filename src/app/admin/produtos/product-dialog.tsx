"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Pencil, Plus } from "lucide-react";
import { toast } from "sonner";
import { saveProductAction } from "@/actions/admin";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { MAX_IMAGES, PendingImagesPicker, ProductImagesManager, uploadAll } from "./product-images";

type Product = {
  id: string;
  name: string;
  flavor: string;
  size: string;
  description: string;
  price: number;
  stock: number;
  returnable: boolean;
  active: boolean;
  images: { id: string; src: string }[];
};

export function ProductDialog({ product }: { product?: Product }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [files, setFiles] = useState<File[]>([]); // fotos de um produto novo, enviadas após salvar
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function reset() {
    setFiles([]);
    setFieldErrors({});
    setStatus(null);
  }

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    if (!product && files.length === 0) {
      toast.error("Adicione pelo menos uma foto do produto.");
      return;
    }
    start(async () => {
      setStatus("Salvando…");
      const res = await saveProductAction(null, formData);
      if (!res.ok) {
        setStatus(null);
        setFieldErrors(res.fieldErrors ?? {});
        if (!res.fieldErrors) toast.error(res.error);
        return;
      }
      if (!product && res.data) {
        setStatus(`Enviando fotos 0/${files.length}…`);
        const sent = await uploadAll(res.data.id, files, (done) => setStatus(`Enviando fotos ${done}/${files.length}…`));
        if (sent < files.length) toast.warning(`Produto criado, mas ${files.length - sent} foto(s) falharam. Tente de novo editando o produto.`);
      }
      toast.success(res.message);
      setOpen(false);
      reset();
      router.refresh();
    });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (pending) return; // não fecha no meio do envio
        setOpen(next);
        if (!next) reset();
      }}
    >
      <DialogTrigger asChild>
        {product ? (
          <Button variant="ghost" size="icon-sm" aria-label="Editar">
            <Pencil />
          </Button>
        ) : (
          <Button className="h-10 rounded-xl bg-wine px-4 hover:bg-wine-dark">
            <Plus /> Novo produto
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-h-[92svh] overflow-y-auto bg-background sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle className="text-wine">{product ? "Editar produto" : "Novo produto"}</DialogTitle>
          <DialogDescription>As fotos aparecem no catálogo, na página do produto, no carrinho e nos pedidos.</DialogDescription>
        </DialogHeader>

        <form onSubmit={submit} className="grid gap-6 md:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
          <section className="space-y-2">
            <div className="flex items-baseline justify-between">
              <Label>Fotos do produto</Label>
              <span className="text-xs text-muted-foreground">
                {product ? product.images.length : files.length}/{MAX_IMAGES}
              </span>
            </div>
            {product ? (
              <ProductImagesManager productId={product.id} images={product.images} />
            ) : (
              <PendingImagesPicker files={files} onChange={setFiles} />
            )}
            <p className="text-xs text-muted-foreground">
              A primeira é a capa (use a ★ para trocar). JPG, PNG, WEBP, AVIF ou GIF de até 3 MB.
              {product ? " Alterações nas fotos são salvas na hora." : " Obrigatória pelo menos uma foto."}
            </p>
          </section>

          <section className="grid grid-cols-2 content-start gap-3">
            {product && <input type="hidden" name="id" value={product.id} />}
            <Field label="Nome" name="name" defaultValue={product?.name} error={fieldErrors.name} className="col-span-2" />
            <Field label="Sabor" name="flavor" defaultValue={product?.flavor} error={fieldErrors.flavor} />
            <Field label="Tamanho" name="size" defaultValue={product?.size} placeholder="500ml" error={fieldErrors.size} />
            <Field label="Preço (R$)" name="price" type="number" step="0.01" min="0" defaultValue={product?.price} error={fieldErrors.price} />
            <Field label="Estoque" name="stock" type="number" min="0" defaultValue={product?.stock ?? 0} error={fieldErrors.stock} />
            <div className="col-span-2 space-y-1.5">
              <Label htmlFor="description">Descrição</Label>
              <Textarea id="description" name="description" defaultValue={product?.description} rows={4} className="bg-cream-soft" />
            </div>
            <div className="col-span-2 flex flex-wrap gap-x-6 gap-y-2 text-sm">
              <label className="flex items-center gap-2">
                <Checkbox name="returnable" defaultChecked={product?.returnable ?? true} /> Garrafa retornável
              </label>
              <label className="flex items-center gap-2">
                <Checkbox name="active" defaultChecked={product?.active ?? true} /> Ativo na loja
              </label>
            </div>
            <Button type="submit" disabled={pending} className="col-span-2 mt-2 h-10 rounded-xl bg-wine hover:bg-wine-dark">
              {pending && <Loader2 className="animate-spin" />}
              {status ?? (product ? "Salvar alterações" : "Criar produto")}
            </Button>
          </section>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function Field({
  label,
  error,
  className,
  ...props
}: React.ComponentProps<typeof Input> & { label: string; error?: string }) {
  return (
    <div className={`space-y-1.5 ${className ?? ""}`}>
      <Label htmlFor={props.name}>{label}</Label>
      <Input id={props.name} className="bg-cream-soft" aria-invalid={!!error} {...props} />
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
