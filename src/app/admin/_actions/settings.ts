'use server';

import { revalidatePath } from 'next/cache';
import { eq, sql } from 'drizzle-orm';
import { z } from 'zod';
import { requireDb, schema } from '@/server/db';
import { audit, requirePermission } from '@/server/auth';
import { refreshSite, run, str, UserError, type ActionState } from '@/server/admin-action';
import { sendTestEmail } from '@/server/email';

async function putSetting(key: string, value: unknown, userId: string) {
  await requireDb()
    .insert(schema.settings)
    .values({ key, value, updatedBy: userId })
    .onConflictDoUpdate({ target: schema.settings.key, set: { value, updatedBy: userId, updatedAt: new Date() } });
}

export async function saveContactSettings(_prev: ActionState, fd: FormData) {
  return run('settings.manage', async (me) => {
    const v = z
      .object({ email: z.string().trim().email('Enter a valid email address.').max(254), phone: z.string().trim().min(6, 'Enter a phone number.').max(40) })
      .parse({ email: str(fd, 'email'), phone: str(fd, 'phone') });
    await putSetting('contact', v, me.id);
    await audit(me.id, 'settings.contact', 'settings', 'contact', v);
    refreshSite();
    return { ok: true, message: 'Contact details saved. The website has been updated.' };
  });
}

export async function saveEmailSettings(_prev: ActionState, fd: FormData) {
  return run('settings.manage', async (me) => {
    const v = z
      .object({ fromName: z.string().trim().min(2, 'Enter a sender name.').max(80), fromAddress: z.union([z.string().trim().email('Enter a valid email address.'), z.literal('')]) })
      .parse({ fromName: str(fd, 'fromName'), fromAddress: str(fd, 'fromAddress') });
    await putSetting('email', v, me.id);
    await audit(me.id, 'settings.email', 'settings', 'email', v);
    revalidatePath('/admin/settings');
    return { ok: true, message: 'Sender details saved.' };
  });
}

const formTypes = z.array(z.enum(['contact', 'quote', 'newsletter'])).min(1, 'Choose at least one form.');

export async function addRecipient(_prev: ActionState, fd: FormData) {
  return run('settings.manage', async (me) => {
    const v = z
      .object({ email: z.string().trim().toLowerCase().email('Enter a valid email address.').max(254), name: z.string().trim().max(120), formTypes })
      .parse({ email: str(fd, 'email'), name: str(fd, 'name'), formTypes: fd.getAll('formTypes').map(String) });
    const d = requireDb();
    const [exists] = await d.select({ id: schema.notificationRecipients.id }).from(schema.notificationRecipients).where(sql`lower(${schema.notificationRecipients.email}) = ${v.email}`);
    if (exists) throw new UserError('That address is already on the list.');
    await d.insert(schema.notificationRecipients).values({ email: v.email, name: v.name || null, formTypes: v.formTypes });
    await audit(me.id, 'recipient.add', 'notification_recipient', v.email, v);
    revalidatePath('/admin/settings');
    return { ok: true, message: `${v.email} will now receive notifications.` };
  });
}

export async function updateRecipient(_prev: ActionState, fd: FormData) {
  return run('settings.manage', async (me) => {
    const id = z.string().uuid().parse(str(fd, 'id'));
    const v = z.object({ formTypes, active: z.boolean() }).parse({ formTypes: fd.getAll('formTypes').map(String), active: fd.get('active') === 'on' });
    await requireDb().update(schema.notificationRecipients).set({ ...v, updatedAt: new Date() }).where(eq(schema.notificationRecipients.id, id));
    await audit(me.id, 'recipient.update', 'notification_recipient', id, v);
    revalidatePath('/admin/settings');
    return { ok: true, message: 'Recipient updated.' };
  });
}

export async function deleteRecipient(fd: FormData) {
  const me = await requirePermission('settings.manage');
  const id = z.string().uuid().parse(str(fd, 'id'));
  await requireDb().delete(schema.notificationRecipients).where(eq(schema.notificationRecipients.id, id));
  await audit(me.id, 'recipient.delete', 'notification_recipient', id);
  revalidatePath('/admin/settings');
}

export async function testEmail(_prev: ActionState, fd: FormData) {
  return run('settings.manage', async (me) => {
    const to = z.string().trim().email('Enter a valid email address.').parse(str(fd, 'to'));
    const res = await sendTestEmail(to);
    await audit(me.id, 'email.test', 'settings', 'email', { to, ok: res.ok });
    revalidatePath('/admin/settings');
    return res;
  });
}
