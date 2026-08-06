import "server-only";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import sharp from "sharp";
import { env } from "@/config/env";

const MAX_SOURCE_BYTES = 15 * 1024 * 1024;

function storageConfig() {
  const values = {
    accountId: env.CLOUDFLARE_ACCOUNT_ID,
    accessKeyId: env.CLOUDFLARE_R2_ACCESS_KEY_ID,
    secretAccessKey: env.CLOUDFLARE_R2_SECRET_ACCESS_KEY,
    bucket: env.CLOUDFLARE_R2_BUCKET_NAME,
    publicDomain: env.CLOUDFLARE_R2_PUBLIC_DOMAIN,
  };
  if (!values.accountId || !values.accessKeyId || !values.secretAccessKey || !values.publicDomain) {
    throw new Error("Social image storage is not configured.");
  }
  return values as typeof values & {
    accountId: string;
    accessKeyId: string;
    secretAccessKey: string;
    publicDomain: string;
  };
}

function assertPexelsImageUrl(value: string) {
  const url = new URL(value);
  if (url.protocol !== "https:" || url.hostname !== "images.pexels.com") {
    throw new Error("Only images returned by Pexels can be imported.");
  }
  return url;
}

function publicUrl(domain: string, key: string) {
  const base = domain.startsWith("http://") || domain.startsWith("https://") ? domain : `https://${domain}`;
  return `${base.replace(/\/$/, "")}/${key}`;
}

export async function importJobSocialImage(jobId: string, photoId: number, sourceUrl: string) {
  const source = assertPexelsImageUrl(sourceUrl);
  const config = storageConfig();
  const response = await fetch(source, { signal: AbortSignal.timeout(15_000), cache: "no-store" });
  if (!response.ok) throw new Error("Pexels did not return the selected image.");
  if (!response.headers.get("content-type")?.startsWith("image/")) {
    throw new Error("The selected Pexels file is not an image.");
  }
  const declaredSize = Number(response.headers.get("content-length") ?? 0);
  if (declaredSize > MAX_SOURCE_BYTES) throw new Error("The selected image is too large to import.");

  const sourceBuffer = Buffer.from(await response.arrayBuffer());
  if (sourceBuffer.byteLength > MAX_SOURCE_BYTES) throw new Error("The selected image is too large to import.");

  const optimized = await sharp(sourceBuffer)
    .rotate()
    .resize(1200, 630, { fit: "cover", position: "attention" })
    .jpeg({ quality: 82, mozjpeg: true })
    .toBuffer();

  const key = `jobs/${jobId}/social-${photoId}.jpg`;
  const client = new S3Client({
    region: "auto",
    endpoint: `https://${config.accountId}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId: config.accessKeyId, secretAccessKey: config.secretAccessKey },
  });
  await client.send(new PutObjectCommand({
    Bucket: config.bucket,
    Key: key,
    Body: optimized,
    ContentType: "image/jpeg",
    CacheControl: "public, max-age=31536000, immutable",
  }));

  return publicUrl(config.publicDomain, key);
}
