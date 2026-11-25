import 'server-only';
import { createHash, randomBytes } from 'node:crypto';
import { cache } from 'react';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import bcrypt from 'bcryptjs';
import { and, eq, gt, gte, lt, sql } from 'drizzle-orm';
import { db, requireDb, schema } from './db';
import { can, type Permission, type Role } from '@/lib/permissions';
import { clientIp, userAgent } from './request';

export const SESSION_COOKIE = process.env.NODE_ENV === 'production' ? '__Host-aeon_session' : 'aeon_session';
const SESSION_DAYS = 7;
const RENEW_AFTER_MS = 24 * 60 * 60 * 1000; // extend sliding sessions at most once a day
export const MAX_FAILED = 5;
export const LOCK_MINUTES = 15;
export const MIN_PASSWORD = 12;

const sha256 = (v: string) => createHash('sha256').update(v).digest('hex');

export const hashPassword = (password: string) => bcrypt.hash(password, 12);
export const verifyPassword = (password: string, hash: string) => bcrypt.compare(password, hash);

export type SessionUser = { id: string; email: string; name: string; role: Role };

/** Create a session row (storing only the token's hash) and set the cookie. */
export async function createSession(userId: string) {
  const token = randomBytes(32).toString('base64url');
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 86_400_000);
  await requireDb().insert(schema.sessions).values({ id: sha256(token), userId, expiresAt, ip: await clientIp(), userAgent: await userAgent() });
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    expires: expiresAt,
  });
}

/** The signed-in user for this request, or null. Cached per request. */
export const getSessionUser = cache(async (): Promise<SessionUser | null> => {
  if (!db) return null;
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const id = sha256(token);
  const [row] = await db
    .select({ id: schema.users.id, email: schema.users.email, name: schema.users.name, role: schema.users.role, active: schema.users.active, expiresAt: schema.sessions.expiresAt, createdAt: schema.sessions.createdAt })
    .from(schema.sessions)
    .innerJoin(schema.users, eq(schema.users.id, schema.sessions.userId))
    .where(and(eq(schema.sessions.id, id), gt(schema.sessions.expiresAt, new Date())))
    .limit(1);
  if (!row || !row.active) return null;
  // Sliding expiry: push the expiry forward if the session is older than a day.
  if (row.expiresAt.getTime() - Date.now() < SESSION_DAYS * 86_400_000 - RENEW_AFTER_MS) {
    await db.update(schema.sessions).set({ expiresAt: new Date(Date.now() + SESSION_DAYS * 86_400_000) }).where(eq(schema.sessions.id, id));
  }
  return { id: row.id, email: row.email, name: row.name, role: row.role };
});

/** For pages: redirect to the login page if not signed in. */
export async function requireUser() {
  const user = await getSessionUser();
  if (!user) redirect('/admin/login');
  return user;
}

export class ForbiddenError extends Error {
  constructor() {
    super('You do not have permission to do that.');
  }
}

/** For pages and server actions: signed-in user with the given permission, otherwise error/redirect. */
export async function requirePermission(permission: Permission, mode: 'page' | 'action' = 'action') {
  const user = await getSessionUser();
  if (!user) {
    if (mode === 'page') redirect('/admin/login');
    throw new ForbiddenError();
  }
  if (!can(user.role, permission)) {
    if (mode === 'page') redirect('/admin?denied=1');
    throw new ForbiddenError();
  }
  return user;
}

export async function destroySession() {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (token && db) await db.delete(schema.sessions).where(eq(schema.sessions.id, sha256(token)));
  jar.delete(SESSION_COOKIE);
}

/** Ends every session for a user except (optionally) the current one. */
export async function destroyUserSessions(userId: string, keepCurrent = false) {
  const d = requireDb();
  const token = keepCurrent ? (await cookies()).get(SESSION_COOKIE)?.value : undefined;
  if (token) await d.delete(schema.sessions).where(and(eq(schema.sessions.userId, userId), sql`${schema.sessions.id} <> ${sha256(token)}`));
  else await d.delete(schema.sessions).where(eq(schema.sessions.userId, userId));
}

/** True if this email + IP has too many recent failed logins. */
export async function isLockedOut(email: string, ip: string) {
  const since = new Date(Date.now() - LOCK_MINUTES * 60_000);
  const [{ n }] = await requireDb()
    .select({ n: sql<number>`count(*)::int` })
    .from(schema.loginAttempts)
    .where(and(eq(schema.loginAttempts.email, email), eq(schema.loginAttempts.ip, ip), eq(schema.loginAttempts.success, false), gte(schema.loginAttempts.createdAt, since)));
  return n >= MAX_FAILED;
}

export async function recordLoginAttempt(email: string, ip: string, success: boolean) {
  const d = requireDb();
  await d.insert(schema.loginAttempts).values({ email, ip, success });
  if (success) {
    // a successful login clears earlier failures for this email + IP
    await d.delete(schema.loginAttempts).where(and(eq(schema.loginAttempts.email, email), eq(schema.loginAttempts.ip, ip), eq(schema.loginAttempts.success, false)));
  }
}

/** Housekeeping, run occasionally: expired sessions and old login attempts. */
export async function pruneAuthTables() {
  const d = requireDb();
  await d.delete(schema.sessions).where(lt(schema.sessions.expiresAt, new Date()));
  await d.delete(schema.loginAttempts).where(lt(schema.loginAttempts.createdAt, new Date(Date.now() - 30 * 86_400_000)));
}

export async function audit(userId: string | null, action: string, entity: string, entityId?: string | null, details?: unknown) {
  if (!db) return;
  try {
    await db.insert(schema.auditLog).values({ userId, action, entity, entityId: entityId ?? null, details: details ?? null });
  } catch (e) {
    console.error('[audit]', e);
  }
}
