'use server';

import { revalidatePath } from 'next/cache';
import { and, eq, ne, sql } from 'drizzle-orm';
import { z } from 'zod';
import { requireDb, schema } from '@/server/db';
import { audit, destroyUserSessions, hashPassword, MIN_PASSWORD } from '@/server/auth';
import { run, str, UserError, type ActionState } from '@/server/admin-action';
import { roles } from '@/lib/permissions';

const password = z.string().min(MIN_PASSWORD, `Use at least ${MIN_PASSWORD} characters.`).max(200);

async function adminCount(excludeId?: string) {
  const [{ n }] = await requireDb()
    .select({ n: sql<number>`count(*)::int` })
    .from(schema.users)
    .where(and(eq(schema.users.role, 'admin'), eq(schema.users.active, true), excludeId ? ne(schema.users.id, excludeId) : undefined));
  return n;
}

export async function createUser(_prev: ActionState, fd: FormData) {
  return run('users.manage', async (me) => {
    const v = z
      .object({ name: z.string().trim().min(2, 'Enter a name.').max(120), email: z.string().trim().toLowerCase().email('Enter a valid email address.').max(254), role: z.enum(roles), password })
      .parse({ name: str(fd, 'name'), email: str(fd, 'email'), role: str(fd, 'role'), password: String(fd.get('password') ?? '') });
    const d = requireDb();
    const [exists] = await d.select({ id: schema.users.id }).from(schema.users).where(sql`lower(${schema.users.email}) = ${v.email}`);
    if (exists) throw new UserError('A user with that email already exists.');
    const [row] = await d.insert(schema.users).values({ name: v.name, email: v.email, role: v.role, passwordHash: await hashPassword(v.password) }).returning({ id: schema.users.id });
    await audit(me.id, 'user.create', 'user', row.id, { email: v.email, role: v.role });
    revalidatePath('/admin/users');
    return { ok: true, message: `${v.name} can now sign in. Share the password with them securely.` };
  });
}

export async function updateUser(_prev: ActionState, fd: FormData) {
  return run('users.manage', async (me) => {
    const id = z.string().uuid().parse(str(fd, 'id'));
    const v = z.object({ role: z.enum(roles), active: z.boolean() }).parse({ role: str(fd, 'role'), active: fd.get('active') === 'on' });
    if (id === me.id && (v.role !== 'admin' || !v.active)) throw new UserError('You cannot remove your own administrator access.');
    if ((v.role !== 'admin' || !v.active) && (await adminCount(id)) === 0) throw new UserError('Keep at least one active administrator.');
    await requireDb().update(schema.users).set({ ...v, updatedAt: new Date() }).where(eq(schema.users.id, id));
    if (!v.active) await destroyUserSessions(id);
    await audit(me.id, 'user.update', 'user', id, v);
    revalidatePath('/admin/users');
    return { ok: true, message: 'User updated.' };
  });
}

export async function resetUserPassword(_prev: ActionState, fd: FormData) {
  return run('users.manage', async (me) => {
    const id = z.string().uuid().parse(str(fd, 'id'));
    const pw = password.parse(String(fd.get('password') ?? ''));
    await requireDb().update(schema.users).set({ passwordHash: await hashPassword(pw), updatedAt: new Date() }).where(eq(schema.users.id, id));
    await destroyUserSessions(id);
    await audit(me.id, 'user.password_reset', 'user', id);
    return { ok: true, message: 'Password reset. The user has been signed out everywhere.' };
  });
}

export async function deleteUser(_prev: ActionState, fd: FormData) {
  return run('users.manage', async (me) => {
    const id = z.string().uuid().parse(str(fd, 'id'));
    if (id === me.id) throw new UserError('You cannot delete your own account.');
    const [target] = await requireDb().select({ role: schema.users.role }).from(schema.users).where(eq(schema.users.id, id));
    if (target?.role === 'admin' && (await adminCount(id)) === 0) throw new UserError('Keep at least one active administrator.');
    await requireDb().delete(schema.users).where(eq(schema.users.id, id));
    await audit(me.id, 'user.delete', 'user', id);
    revalidatePath('/admin/users');
    return { ok: true, message: 'User deleted.' };
  });
}
