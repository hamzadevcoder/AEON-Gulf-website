'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { eq, inArray } from 'drizzle-orm';
import { z } from 'zod';
import { requireDb, schema } from '@/server/db';
import { audit, requirePermission } from '@/server/auth';
import { run, str, UserError, type ActionState } from '@/server/admin-action';
import { submissionStatusEnum } from '@/server/db/schema';
import { statusLabels } from '@/lib/submissions';


const statusSchema = z.enum(submissionStatusEnum.enumValues);

export async function updateSubmission(_prev: ActionState, fd: FormData) {
  return run('submissions.update', async (me) => {
    const id = z.string().uuid().parse(str(fd, 'id'));
    const status = statusSchema.parse(str(fd, 'status'));
    const assigned = str(fd, 'assignedTo');
    const assignedTo = assigned ? z.string().uuid().parse(assigned) : null;
    const d = requireDb();
    const [before] = await d.select().from(schema.submissions).where(eq(schema.submissions.id, id));
    if (!before) throw new UserError('This inquiry no longer exists.');
    await d.update(schema.submissions).set({ status, assignedTo, updatedAt: new Date() }).where(eq(schema.submissions.id, id));
    const notes: (typeof schema.submissionNotes.$inferInsert)[] = [];
    if (before.status !== status) notes.push({ submissionId: id, authorId: me.id, kind: 'status', body: `Status changed from ${statusLabels[before.status]} to ${statusLabels[status]}` });
    if (before.assignedTo !== assignedTo) {
      let who = 'nobody';
      if (assignedTo) {
        const [u] = await d.select({ name: schema.users.name }).from(schema.users).where(eq(schema.users.id, assignedTo));
        who = u?.name ?? 'a user';
      }
      notes.push({ submissionId: id, authorId: me.id, kind: 'assignment', body: `Assigned to ${who}` });
    }
    if (notes.length) await d.insert(schema.submissionNotes).values(notes);
    await audit(me.id, 'submission.update', 'submission', id, { status, assignedTo });
    revalidatePath('/admin', 'layout');
    return { ok: true, message: 'Inquiry updated.' };
  });
}

export async function addNote(_prev: ActionState, fd: FormData) {
  return run('submissions.update', async (me) => {
    const id = z.string().uuid().parse(str(fd, 'id'));
    const body = z.string().trim().min(1, 'Write a note first.').max(4000).parse(str(fd, 'body'));
    await requireDb().insert(schema.submissionNotes).values({ submissionId: id, authorId: me.id, kind: 'note', body });
    await audit(me.id, 'submission.note', 'submission', id);
    revalidatePath(`/admin/submissions/${id}`);
    return { ok: true, message: 'Note added.' };
  });
}

export async function deleteSubmission(fd: FormData) {
  const me = await requirePermission('submissions.delete');
  const id = z.string().uuid().parse(str(fd, 'id'));
  await requireDb().delete(schema.submissions).where(eq(schema.submissions.id, id));
  await audit(me.id, 'submission.delete', 'submission', id);
  revalidatePath('/admin', 'layout');
  redirect('/admin/submissions?deleted=1');
}

/** Bulk status change from the inquiries list. */
export async function bulkUpdateStatus(fd: FormData) {
  const me = await requirePermission('submissions.update');
  const ids = z.array(z.string().uuid()).max(200).parse(fd.getAll('ids').map(String));
  const status = statusSchema.parse(str(fd, 'status'));
  if (!ids.length) return;
  const d = requireDb();
  await d.update(schema.submissions).set({ status, updatedAt: new Date() }).where(inArray(schema.submissions.id, ids));
  await d.insert(schema.submissionNotes).values(ids.map((id) => ({ submissionId: id, authorId: me.id, kind: 'status' as const, body: `Status changed to ${statusLabels[status]} (bulk update)` })));
  await audit(me.id, 'submission.bulk_status', 'submission', null, { ids, status });
  revalidatePath('/admin', 'layout');
}
