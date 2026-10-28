import "server-only";
import { randomUUID } from "node:crypto";
import { DeleteObjectCommand, GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";

/**
 * Armazenamento das fotos de produto no bucket S3 (SeaweedFS).
 *
 * Entrega: por padrão o bucket é privado, então as fotos passam pela rota
 * /api/produtos/imagens/[id], que lê do S3 com as credenciais. Com UPLOAD_PUBLIC_READ=true
 * (bucket com leitura pública), o navegador busca direto de
 * SEAWEEDFS_S3_ENDPOINT/SEAWEEDFS_S3_BUCKET/<chave>.
 */

function config() {
  const e = process.env;
  const cfg = {
    endpoint: e.SEAWEEDFS_S3_ENDPOINT,
    accessKeyId: e.SEAWEEDFS_S3_ACCESS_KEY,
    secretAccessKey: e.SEAWEEDFS_S3_SECRET_KEY,
    bucket: e.SEAWEEDFS_S3_BUCKET,
    region: e.SEAWEEDFS_S3_REGION || "us-east-1",
    prefix: (e.SEAWEEDFS_S3_PREFIX || "products").replace(/^\/+|\/+$/g, ""),
    publicRead: e.UPLOAD_PUBLIC_READ === "true",
  };
  const missing = (["endpoint", "accessKeyId", "secretAccessKey", "bucket"] as const).filter((k) => !cfg[k]);
  if (missing.length) {
    throw new Error(
      "Armazenamento S3 não configurado. Defina SEAWEEDFS_S3_ENDPOINT, SEAWEEDFS_S3_ACCESS_KEY, SEAWEEDFS_S3_SECRET_KEY e SEAWEEDFS_S3_BUCKET.",
    );
  }
  return cfg as typeof cfg & { endpoint: string; accessKeyId: string; secretAccessKey: string; bucket: string };
}

const globalForS3 = globalThis as unknown as { s3?: S3Client };

function client() {
  if (!globalForS3.s3) {
    const c = config();
    globalForS3.s3 = new S3Client({
      endpoint: c.endpoint,
      region: c.region,
      forcePathStyle: true, // SeaweedFS usa endereçamento por caminho (endpoint/bucket/chave)
      credentials: { accessKeyId: c.accessKeyId, secretAccessKey: c.secretAccessKey },
    });
  }
  return globalForS3.s3;
}

const EXTENSIONS: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/avif": "avif",
  "image/gif": "gif",
};

/** Envia a foto para o bucket e devolve a chave do objeto */
export async function uploadProductImage(productId: string, file: File) {
  const c = config();
  const key = `${c.prefix}/${productId}/${randomUUID()}.${EXTENSIONS[file.type] ?? "bin"}`;
  await client().send(
    new PutObjectCommand({
      Bucket: c.bucket,
      Key: key,
      Body: new Uint8Array(await file.arrayBuffer()),
      ContentType: file.type,
      ContentLength: file.size,
      // a chave é única e o arquivo nunca é sobrescrito
      CacheControl: "public, max-age=31536000, immutable",
    }),
  );
  return key;
}

export async function deleteStoredObject(key: string) {
  const c = config();
  await client().send(new DeleteObjectCommand({ Bucket: c.bucket, Key: key }));
}

/** Lê o objeto do bucket (usado pela rota que entrega as fotos quando o bucket é privado) */
export async function readStoredObject(key: string) {
  const c = config();
  const res = await client().send(new GetObjectCommand({ Bucket: c.bucket, Key: key }));
  if (!res.Body) throw new Error(`Objeto vazio: ${key}`);
  return { body: res.Body.transformToWebStream(), contentType: res.ContentType, contentLength: res.ContentLength };
}

/** URL que o navegador usa para exibir a foto */
export function productImageSrc(image: { id: string; key: string }) {
  const e = process.env;
  if (e.UPLOAD_PUBLIC_READ === "true" && e.SEAWEEDFS_S3_ENDPOINT && e.SEAWEEDFS_S3_BUCKET) {
    const endpoint = e.SEAWEEDFS_S3_ENDPOINT.replace(/\/+$/, "");
    const bucket = e.SEAWEEDFS_S3_BUCKET.replace(/^\/+|\/+$/g, "");
    return `${endpoint}/${bucket}/${image.key}`;
  }
  return `/api/produtos/imagens/${image.id}`;
}
