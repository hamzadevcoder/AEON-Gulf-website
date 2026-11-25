import Link from 'next/link';
import { notFound } from 'next/navigation';
import { asc, desc, eq } from 'drizzle-orm';
import { z } from 'zod';
import { requirePermission } from '@/server/auth';
import { requireDb, schema } from '@/server/db';
import { can } from '@/lib/permissions';
import { statusLabels, statuses, typeLabels } from '@/lib/submissions';
import { fmtDate } from '@/lib/format';
import { ActionForm, ConfirmForm, SelectField, TextArea } from '@/components/admin/Form';
import { addNote, deleteSubmission, updateSubmission } from '../../../_actions/submissions';

export const metadata = { title: 'Inquiry' };

const labels: Record<string, string> = {
  name: 'Name', email: 'Email', phone: 'Phone', company: 'Company', country: 'Country', countries: 'Countries', service: 'Service', services: 'Services',
  projectType: 'Project type', location: 'Location', budget: 'Budget', details: 'Details', message: 'Message', sourcePage: 'Sent from page',
};

export default async function SubmissionPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requirePermission('submissions.view', 'page');
  const { id } = await params;
  if (!z.string().uuid().safeParse(id).success) notFound();
  const db = requireDb();
  const [sub] = await db.select().from(schema.submissions).where(eq(schema.submissions.id, id));
  if (!sub) notFound();
  const [notes, emails, team] = await Promise.all([
    db
      .select({ id: schema.submissionNotes.id, kind: schema.submissionNotes.kind, body: schema.submissionNotes.body, createdAt: schema.submissionNotes.createdAt, author: schema.users.name })
      .from(schema.submissionNotes)
      .leftJoin(schema.users, eq(schema.users.id, schema.submissionNotes.authorId))
      .where(eq(schema.submissionNotes.submissionId, id))
      .orderBy(desc(schema.submissionNotes.createdAt)),
    db.select().from(schema.emailLog).where(eq(schema.emailLog.submissionId, id)).orderBy(asc(schema.emailLog.createdAt)),
    db.select({ id: schema.users.id, name: schema.users.name }).from(schema.users).where(eq(schema.users.active, true)).orderBy(asc(schema.users.name)),
  ]);
  const editable = can(user.role, 'submissions.update');
  const fields = Object.entries(sub.data).filter(([k, v]) => v && k !== 'website');
  const replySubject = encodeURIComponent(`Re: your ${typeLabels[sub.type].toLowerCase()} enquiry${sub.service ? ` (${sub.service})` : ''}`);

  return (
    <>
      <div className="adm-head">
        <div>
          <nav className="adm-crumbs">
            <Link href="/admin/submissions">Inquiries</Link> / <span>{typeLabels[sub.type]}</span>
          </nav>
          <h1>{sub.name || sub.email}</h1>
          <p>
            {`${typeLabels[sub.type]} received ${fmtDate(sub.createdAt)} `}
            <span className={`adm-badge adm-badge--${sub.status}`}>{statusLabels[sub.status]}</span>
          </p>
        </div>
        <div className="adm-actions">
          <a className="adm-btn adm-btn--primary" href={`mailto:${sub.email}?subject=${replySubject}`}>
            Reply by email
          </a>
          {sub.phone && (
            <a className="adm-btn adm-btn--ghost" href={`tel:${sub.phone.replace(/[^\d+]/g, '')}`}>
              Call
            </a>
          )}
        </div>
      </div>
      <div className="adm-split">
        <div>
          <section className="adm-card">
            <h2>Details</h2>
            <dl className="adm-dl" style={{ marginTop: 14 }}>
              {fields.map(([k, v]) => (
                <div key={k} style={{ display: 'contents' }}>
                  <dt>{labels[k] ?? k}</dt>
                  <dd>{k === 'email' ? <a className="adm-link" href={`mailto:${v}`}>{v}</a> : v}</dd>
                </div>
              ))}
            </dl>
          </section>
          <section className="adm-card">
            <h2>Activity</h2>
            {editable && (
              <ActionForm action={addNote} submitLabel="Add note" resetOnSuccess>
                <input type="hidden" name="id" value={sub.id} />
                <TextArea name="body" label="Internal note" rows={3} help="Only visible to your team." />
              </ActionForm>
            )}
            <ul className="adm-timeline" style={{ marginTop: 18 }}>
              {notes.map((n) => (
                <li key={n.id} className={n.kind === 'note' ? 'is-note' : ''}>
                  <span style={{ whiteSpace: 'pre-wrap' }}>{n.body}</span>
                  <span className="adm-muted">{`${n.author ?? 'Removed user'} · ${fmtDate(n.createdAt)}`}</span>
                </li>
              ))}
              <li>
                {`Received from the website${sub.sourcePage ? ` (${sub.sourcePage})` : ''}`}
                <span className="adm-muted">{fmtDate(sub.createdAt)}</span>
              </li>
            </ul>
          </section>
        </div>
        <aside>
          <section className="adm-card">
            <h2>Manage</h2>
            {editable ? (
              <ActionForm action={updateSubmission} submitLabel="Update">
                <input type="hidden" name="id" value={sub.id} />
                <SelectField name="status" label="Status" defaultValue={sub.status} options={statuses.map((s) => ({ value: s, label: statusLabels[s] }))} />
                <SelectField
                  name="assignedTo"
                  label="Assigned to"
                  defaultValue={sub.assignedTo ?? ''}
                  options={[{ value: '', label: 'Nobody' }, ...team.map((t) => ({ value: t.id, label: t.name }))]}
                />
              </ActionForm>
            ) : (
              <p className="adm-card__hint">Your role can view inquiries but not change them.</p>
            )}
          </section>
          <section className="adm-card">
            <h2>Notification emails</h2>
            {emails.length ? (
              <ul className="adm-timeline" style={{ marginTop: 12 }}>
                {emails.map((e) => (
                  <li key={e.id}>
                    {e.to} <span className={`adm-badge adm-badge--${e.status}`}>{e.status}</span>
                    {e.error && <span className="adm-muted">{e.error}</span>}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="adm-card__hint">No notification was sent for this inquiry (no recipients were set for this form at the time).</p>
            )}
          </section>
          {can(user.role, 'submissions.delete') && (
            <section className="adm-card">
              <h2>Delete</h2>
              <p className="adm-card__hint">Permanently removes this inquiry and its notes.</p>
              <ConfirmForm action={deleteSubmission} confirm="Delete this inquiry permanently?" hidden={{ id: sub.id }}>
                <button className="adm-btn adm-btn--danger" type="submit">
                  Delete inquiry
                </button>
              </ConfirmForm>
            </section>
          )}
        </aside>
      </div>
    </>
  );
}
