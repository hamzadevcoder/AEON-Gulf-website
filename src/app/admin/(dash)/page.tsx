import Link from 'next/link';
import { and, desc, eq, gte, sql } from 'drizzle-orm';
import { requireUser } from '@/server/auth';
import { requireDb, schema } from '@/server/db';
import { can } from '@/lib/permissions';
import { emailConfigured } from '@/server/email';
import { statusLabels, typeLabels } from '@/lib/submissions';
import { fmtDate } from '@/lib/format';

export const metadata = { title: 'Overview' };

export default async function Overview({ searchParams }: { searchParams: Promise<{ denied?: string }> }) {
  const user = await requireUser();
  const { denied } = await searchParams;
  const db = requireDb();
  const canInquiries = can(user.role, 'submissions.view');
  const since = new Date(Date.now() - 30 * 86_400_000);

  const [counts, recent, [{ services }], [{ recipients }], [failed]] = await Promise.all([
    canInquiries
      ? db
          .select({ type: schema.submissions.type, status: schema.submissions.status, n: sql<number>`count(*)::int` })
          .from(schema.submissions)
          .where(gte(schema.submissions.createdAt, since))
          .groupBy(schema.submissions.type, schema.submissions.status)
      : Promise.resolve([]),
    canInquiries ? db.select().from(schema.submissions).orderBy(desc(schema.submissions.createdAt)).limit(8) : Promise.resolve([]),
    db.select({ services: sql<number>`count(*)::int` }).from(schema.services).where(eq(schema.services.published, true)),
    db.select({ recipients: sql<number>`count(*)::int` }).from(schema.notificationRecipients).where(eq(schema.notificationRecipients.active, true)),
    db.select({ n: sql<number>`count(*)::int` }).from(schema.emailLog).where(and(eq(schema.emailLog.status, 'failed'), gte(schema.emailLog.createdAt, new Date(Date.now() - 7 * 86_400_000)))),
  ]);
  const sum = (f: (c: (typeof counts)[number]) => boolean) => counts.filter(f).reduce((a, c) => a + c.n, 0);
  const [{ newAll }] = canInquiries
    ? await db.select({ newAll: sql<number>`count(*)::int` }).from(schema.submissions).where(eq(schema.submissions.status, 'new'))
    : [{ newAll: 0 }];

  return (
    <>
      <div className="adm-head">
        <div>
          <h1>{`Welcome, ${user.name.split(' ')[0]}`}</h1>
          <p>Here is what is happening on the website.</p>
        </div>
      </div>
      {denied && <p className="adm-notice adm-notice--warn">Your role does not have access to that page.</p>}
      {can(user.role, 'settings.manage') && (!emailConfigured() || !recipients || failed.n > 0) && (
        <div className="adm-notice adm-notice--warn" style={{ marginBottom: 16 }}>
          {!emailConfigured() && 'Email sending is not configured on the server (SMTP), so new inquiries are saved here but not emailed. '}
          {!recipients && 'No one is set to receive inquiry emails. '}
          {failed.n > 0 && `${failed.n} notification email(s) failed in the last 7 days. `}
          <Link className="adm-link" href="/admin/settings">
            Open settings
          </Link>
        </div>
      )}
      {canInquiries && (
        <div className="adm-grid adm-grid--4" style={{ marginBottom: 16 }}>
          <Link className="adm-card adm-stat" href="/admin/submissions?status=new">
            <div className="adm-stat__n">{newAll}</div>
            <div className="adm-stat__l">New inquiries waiting</div>
          </Link>
          <Link className="adm-card adm-stat" href="/admin/submissions?type=quote">
            <div className="adm-stat__n">{sum((c) => c.type === 'quote')}</div>
            <div className="adm-stat__l">Quote requests, last 30 days</div>
          </Link>
          <Link className="adm-card adm-stat" href="/admin/submissions?type=contact">
            <div className="adm-stat__n">{sum((c) => c.type === 'contact')}</div>
            <div className="adm-stat__l">Contact messages, last 30 days</div>
          </Link>
          <Link className="adm-card adm-stat" href="/admin/submissions?type=newsletter">
            <div className="adm-stat__n">{sum((c) => c.type === 'newsletter')}</div>
            <div className="adm-stat__l">Newsletter sign-ups, last 30 days</div>
          </Link>
        </div>
      )}
      <div className="adm-split">
        {canInquiries ? (
          <section className="adm-card">
            <div className="adm-head" style={{ marginBottom: 12 }}>
              <h2>Latest inquiries</h2>
              <Link className="adm-link" href="/admin/submissions">
                View all
              </Link>
            </div>
            {recent.length ? (
              <div className="adm-table-wrap">
                <table className="adm-table adm-table--stack">
                  <tbody>
                    {recent.map((s) => (
                      <tr key={s.id} className={s.status === 'new' ? 'is-new' : ''}>
                        <td>
                          <Link className="adm-rowlink" href={`/admin/submissions/${s.id}`}>
                            {s.name || s.email}
                          </Link>
                          <span className="adm-muted" style={{ display: 'block' }}>
                            {s.service || s.email}
                          </span>
                        </td>
                        <td data-label="Type">{typeLabels[s.type]}</td>
                        <td data-label="Status">
                          <span className={`adm-badge adm-badge--${s.status}`}>{statusLabels[s.status]}</span>
                        </td>
                        <td className="adm-muted" data-label="Received">
                          {fmtDate(s.createdAt)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="adm-empty">No inquiries yet. Submissions from the website forms appear here.</p>
            )}
          </section>
        ) : (
          <section className="adm-card">
            <h2>Website content</h2>
            <p className="adm-card__hint">Use Pages to edit what is on each page, or create new ones. Changes go live as soon as you save.</p>
          </section>
        )}
        <aside className="adm-card">
          <h2>At a glance</h2>
          <dl className="adm-dl" style={{ gridTemplateColumns: '1fr auto', marginTop: 12 }}>
            <dt>Published services</dt>
            <dd>{services}</dd>
            <dt>Email recipients</dt>
            <dd>{recipients}</dd>
            <dt>Email sending</dt>
            <dd>{emailConfigured() ? <span className="adm-badge adm-badge--on">Configured</span> : <span className="adm-badge adm-badge--skipped">Not configured</span>}</dd>
          </dl>
          {can(user.role, 'content.edit') && (
            <div className="adm-actions" style={{ marginTop: 16 }}>
              <Link className="adm-btn adm-btn--ghost adm-btn--sm" href="/admin/services/new">
                New service
              </Link>
              <Link className="adm-btn adm-btn--ghost adm-btn--sm" href="/admin/pages">
                Edit pages
              </Link>
            </div>
          )}
        </aside>
      </div>
    </>
  );
}
