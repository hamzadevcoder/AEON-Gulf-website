import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { UPLOAD_DIR } from '@/server/storage';

const types: Record<string, string> = { jpg: 'image/jpeg', png: 'image/png', webp: 'image/webp', avif: 'image/avif', gif: 'image/gif' };

/** Serves images uploaded with the local storage driver. */
export async function GET(_req: Request, { params }: { params: Promise<{ path: string[] }> }) {
  const parts = (await params).path;
  if (!parts.every((p) => /^[\w.-]+$/.test(p) && p !== '..')) return new Response('Not found', { status: 404 });
  const file = path.join(UPLOAD_DIR, ...parts);
  if (!file.startsWith(UPLOAD_DIR + path.sep)) return new Response('Not found', { status: 404 });
  const type = types[path.extname(file).slice(1).toLowerCase()];
  if (!type) return new Response('Not found', { status: 404 });
  try {
    const [buf, info] = await Promise.all([readFile(file), stat(file)]);
    return new Response(new Uint8Array(buf), {
      headers: {
        'Content-Type': type,
        'Content-Length': String(info.size),
        'Cache-Control': 'public, max-age=31536000, immutable',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch {
    return new Response('Not found', { status: 404 });
  }
}
