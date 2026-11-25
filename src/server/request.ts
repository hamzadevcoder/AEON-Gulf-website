import 'server-only';
import { createHash } from 'node:crypto';
import { headers } from 'next/headers';

/** Client IP from the proxy headers (first entry of x-forwarded-for). */
export async function clientIp() {
  const h = await headers();
  return (h.get('x-forwarded-for')?.split(',')[0] ?? h.get('x-real-ip') ?? '').trim() || 'unknown';
}

export async function userAgent() {
  return ((await headers()).get('user-agent') ?? '').slice(0, 300);
}

/** IPs are stored hashed (with the app secret) so they can be rate-limited without keeping the raw address. */
export function hashIp(ip: string) {
  return createHash('sha256').update(`${process.env.AUTH_SECRET ?? 'aeon'}:${ip}`).digest('hex').slice(0, 32);
}
