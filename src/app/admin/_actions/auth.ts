'use server';

import { redirect } from 'next/navigation';
import { eq, sql } from 'drizzle-orm';
import { z } from 'zod';
import { db, requireDb, schema } from '@/server/db';
import {
  audit, createSession, destroySession, destroyUserSessions, hashPassword, isLockedOut, recordLoginAttempt, requirePermission,
  verifyPassword, MIN_PASSWORD, LOCK_MINUTES, getSessionUser,
} from '@/server/auth';
import { clientIp } from '@/server/request';
import { run, str, UserError, type ActionState } from '@/server/admin-action';

const loginSchema = z.object({ email: z.string().trim().toLowerCase().email('Enter your email address.'), password: z.string().min(1, 'Enter your password.').max(200) });

// A real bcrypt hash of a random string, so unknown emails take as long to check as real ones.
const DUMMY_HASH = '$2b$12$XEgX1gSmt8FSToOPE7h6TeiJXaFH8VUihrY2/j0qcWa2oVS0eTGT2';

export async function login(_prev: ActionState, fd: FormData): Promise<ActionState> {
  if (!db) return { ok: false, message: 'The database is not configured on this server.' };
  const parsed = loginSchema.safeParse({ email: str(fd, 'email'), password: String(fd.get('password') ?? '') });
  if (!parsed.success) return { ok: false, message: 'Enter your email address and password.' };
  const { email, password } = parsed.data;
  const ip = await clientIp();
  if (await isLockedOut(email, ip)) return { ok: false, message: `Too many failed attempts. Please wait ${LOCK_MINUTES} minutes and try again.` };

  const [user] = await db.select().from(schema.users).where(sql`lower(${schema.users.email}) = ${email}`).limit(1);
  const valid = await verifyPassword(password, user?.passwordHash ?? DUMMY_HASH);
  if (!user || !valid || !user.active) {
    await recordLoginAttempt(email, ip, false);
    return { ok: false, message: 'That email and password do not match an active account.' };
  }
  await recordLoginAttempt(email, ip, true);
  await createSession(user.id);
  await db.update(schema.users).set({ lastLoginAt: new Date() }).where(eq(schema.users.id, user.id));
  await audit(user.id, 'login', 'user', user.id);
  const next = str(fd, 'next');
  redirect(next.startsWith('/admin') && !next.startsWith('//') ? next : '/admin');
}

export async function logout() {
  const user = await getSessionUser();
  if (user) await audit(user.id, 'logout', 'user', user.id);
  await destroySession();
  redirect('/admin/login');
}

const passwordSchema = z
  .object({
    current: z.string().min(1, 'Enter your current password.'),
    password: z.string().min(MIN_PASSWORD, `Use at least ${MIN_PASSWORD} characters.`).max(200),
    confirm: z.string(),
  })
  .refine((v) => v.password === v.confirm, { message: 'The two new passwords do not match.', path: ['confirm'] });

export async function changeOwnPassword(_prev: ActionState, fd: FormData) {
  return run('dashboard.view', async (me) => {
    const v = passwordSchema.parse({ current: String(fd.get('current') ?? ''), password: String(fd.get('password') ?? ''), confirm: String(fd.get('confirm') ?? '') });
    const d = requireDb();
    const [u] = await d.select().from(schema.users).where(eq(schema.users.id, me.id));
    if (!u || !(await verifyPassword(v.current, u.passwordHash))) throw new UserError('Your current password is not correct.');
    await d.update(schema.users).set({ passwordHash: await hashPassword(v.password), updatedAt: new Date() }).where(eq(schema.users.id, me.id));
    await destroyUserSessions(me.id, true);
    await audit(me.id, 'password.change', 'user', me.id);
    return { ok: true, message: 'Password changed. Your other sessions have been signed out.' };
  });
}

export async function updateOwnProfile(_prev: ActionState, fd: FormData) {
  return run('dashboard.view', async (me) => {
    const name = z.string().trim().min(2, 'Enter your name.').max(120).parse(str(fd, 'name'));
    await requireDb().update(schema.users).set({ name, updatedAt: new Date() }).where(eq(schema.users.id, me.id));
    await audit(me.id, 'profile.update', 'user', me.id);
    return { ok: true, message: 'Profile updated.' };
  });
}

export async function signOutOtherSessions() {
  const me = await requirePermission('dashboard.view');
  await destroyUserSessions(me.id, true);
  await audit(me.id, 'sessions.revoke', 'user', me.id);
}
