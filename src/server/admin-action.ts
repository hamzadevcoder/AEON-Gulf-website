import 'server-only';
import { revalidatePath, revalidateTag } from 'next/cache';
import { z } from 'zod';
import { ForbiddenError, requirePermission, type SessionUser } from './auth';
import { CONTENT_TAG } from './content';
import type { Permission } from '@/lib/permissions';
import { fieldErrors } from '@/lib/forms-schema';

export type ActionState = { ok: boolean; message: string; errors?: Record<string, string>; at?: number };
export const initialState: ActionState = { ok: false, message: '' };

/**
 * Every admin mutation runs through here: permission check, then the handler, with validation
 * and permission errors turned into a message for the form instead of a crash.
 */
export async function run(permission: Permission, fn: (user: SessionUser) => Promise<ActionState | void>): Promise<ActionState> {
  try {
    const user = await requirePermission(permission);
    const res = await fn(user);
    return { ok: true, message: 'Saved.', ...(res ?? {}), at: Date.now() };
  } catch (e) {
    if (e instanceof ForbiddenError) return { ok: false, message: e.message, at: Date.now() };
    if (e instanceof z.ZodError) return { ok: false, message: 'Please check the highlighted fields.', errors: fieldErrors(e), at: Date.now() };
    if (e instanceof UserError) return { ok: false, message: e.message, at: Date.now() };
    // let Next.js redirects/notFound through
    if (e && typeof e === 'object' && 'digest' in e && String((e as { digest: unknown }).digest).startsWith('NEXT_')) throw e;
    console.error('[admin action]', e);
    return { ok: false, message: 'Something went wrong. Please try again.', at: Date.now() };
  }
}

/** An error whose message is safe to show to the admin. */
export class UserError extends Error {}

/** Refresh every public page after a content change. */
export function refreshSite() {
  revalidateTag(CONTENT_TAG);
  revalidatePath('/', 'layout');
}

/** Read a FormData field as a trimmed string. */
export const str = (fd: FormData, name: string) => String(fd.get(name) ?? '').trim();
/** Read a FormData field holding JSON (written by the list editors). */
export function json<T = unknown>(fd: FormData, name: string): T {
  try {
    return JSON.parse(String(fd.get(name) ?? 'null')) as T;
  } catch {
    throw new UserError(`Could not read the "${name}" field.`);
  }
}
