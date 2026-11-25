import 'server-only';
import { randomUUID } from 'node:crypto';
import { mkdir, writeFile, unlink } from 'node:fs/promises';
import path from 'node:path';

/**
 * Image storage. Two drivers:
 *  - local (default): files under UPLOAD_DIR (./storage/uploads), served by the /uploads/[...path] route.
 *    Use on a single server or with a persistent volume.
 *  - s3: any S3-compatible bucket (AWS S3, Cloudflare R2, DigitalOcean Spaces). Set S3_BUCKET, S3_REGION,
 *    S3_ACCESS_KEY_ID, S3_SECRET_ACCESS_KEY, S3_PUBLIC_URL and optionally S3_ENDPOINT. Use for several servers or serverless.
 */
export const UPLOAD_DIR = path.resolve(process.env.UPLOAD_DIR ?? 'storage/uploads');
const driver = process.env.S3_BUCKET ? 's3' : 'local';

export const ALLOWED_TYPES: Record<string, string> = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/avif': 'avif', 'image/gif': 'gif' };
export const MAX_BYTES = 8 * 1024 * 1024;

/** Check the file's first bytes really are the image type it claims (SVG is not accepted, as it can carry scripts). */
export function sniffImage(buf: Buffer): string | null {
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return 'image/jpeg';
  if (buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return 'image/png';
  if (buf.subarray(0, 4).toString() === 'RIFF' && buf.subarray(8, 12).toString() === 'WEBP') return 'image/webp';
  if (buf.subarray(4, 12).toString() === 'ftypavif' || buf.subarray(4, 12).toString() === 'ftypavis') return 'image/avif';
  if (buf.subarray(0, 6).toString() === 'GIF87a' || buf.subarray(0, 6).toString() === 'GIF89a') return 'image/gif';
  return null;
}

async function s3() {
  const { S3Client, PutObjectCommand, DeleteObjectCommand } = await import('@aws-sdk/client-s3');
  const client = new S3Client({
    region: process.env.S3_REGION ?? 'auto',
    endpoint: process.env.S3_ENDPOINT || undefined,
    forcePathStyle: Boolean(process.env.S3_ENDPOINT),
    credentials: { accessKeyId: process.env.S3_ACCESS_KEY_ID ?? '', secretAccessKey: process.env.S3_SECRET_ACCESS_KEY ?? '' },
  });
  return { client, PutObjectCommand, DeleteObjectCommand };
}

export async function storeImage(buf: Buffer, mime: string) {
  const now = new Date();
  const key = `${now.getUTCFullYear()}/${String(now.getUTCMonth() + 1).padStart(2, '0')}/${randomUUID()}.${ALLOWED_TYPES[mime]}`;
  if (driver === 's3') {
    const { client, PutObjectCommand } = await s3();
    await client.send(new PutObjectCommand({ Bucket: process.env.S3_BUCKET, Key: key, Body: buf, ContentType: mime, CacheControl: 'public, max-age=31536000, immutable' }));
    return { key, url: `${(process.env.S3_PUBLIC_URL ?? '').replace(/\/$/, '')}/${key}` };
  }
  const file = path.join(UPLOAD_DIR, key);
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(file, buf);
  return { key, url: `/uploads/${key}` };
}

export async function deleteImage(key: string) {
  try {
    if (driver === 's3') {
      const { client, DeleteObjectCommand } = await s3();
      await client.send(new DeleteObjectCommand({ Bucket: process.env.S3_BUCKET, Key: key }));
    } else {
      const file = path.join(UPLOAD_DIR, key);
      if (file.startsWith(UPLOAD_DIR + path.sep)) await unlink(file);
    }
  } catch (e) {
    console.error('[storage] delete failed', e);
  }
}
