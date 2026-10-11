import { prisma } from "@/lib/prisma";
import { readStoredObject } from "@/lib/storage";

// Entrega as fotos do bucket S3 privado. Cada foto tem chave única e nunca é sobrescrita,
// então o navegador pode guardar em cache para sempre.
export async function GET(_request: Request, ctx: RouteContext<"/api/produtos/imagens/[id]">) {
  const { id } = await ctx.params;
  const image = await prisma.productImage.findUnique({ where: { id }, select: { key: true, mimeType: true, size: true } });
  if (!image) return new Response("Imagem não encontrada", { status: 404 });

  try {
    const object = await readStoredObject(image.key);
    return new Response(object.body, {
      headers: {
        "Content-Type": object.contentType ?? image.mimeType,
        "Content-Length": String(object.contentLength ?? image.size),
        "Cache-Control": "public, max-age=31536000, immutable",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (err) {
    console.error(`[imagens] falha ao ler ${image.key} do S3`, err);
    return new Response("Imagem indisponível", { status: 502 });
  }
}
