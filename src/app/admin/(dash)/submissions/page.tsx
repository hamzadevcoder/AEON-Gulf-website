import Link from 'next/link';
import { and, count, desc, eq, gte, ilike, or, type SQL } from 'drizzle-orm';
import { requirePermission } from '@/server/auth';
import { requireDb, schema } from '@/server/db';
import { can } from '@/lib/permissions';
import { statusLabels, statuses, typeLabels, formKinds, type Status, type FormKind } from '@/lib/submissions';
import { fmtDate } from '@/lib/format';
import { BulkBar } from './BulkBar';

export const metadata = { title: 'Inquiries' };
const PAGE = 25;

type Search = { status?: string; type?: string; q?: string; page?: string; deleted?: string };

export default async function Submissions({ searchParams }: { searchParams: Promise<Search> }) {
  const user = await requirePermission('submissions.view', 'page');
  const sp = await searchParams;
  const status = statuses.includes(sp.status as Status) ? (sp.status as Status) : undefined;
  const type = formKinds.includes(sp.type as FormKind) ? (sp.type as FormKind) : undefined;
  const q = (sp.q ?? '').trim().slice(0, 100);
  const page = Math.max(1, Number(sp.page) || 1);
  const db = requireDb();
  const s = schema.submissions;

  const where: SQL[] = [];
  if (status) where.push(eq(s.status, status));
  else where.push(or(eq(s.status, 'new'), eq(s.status, 'in_progress'), eq(s.status, 'responded'), eq(s.status, 'closed'))!); // hide spam unless asked
  if (type) where.push(eq(s.type, type));
  if (q) {
    const like = `%${q.replace(/[%_]/g, '\\$&')}%`;
    where.push(or(ilike(s.name, like), ilike(s.email, like), ilike(s.company, like), ilike(s.service, like), ilike(s.message, like))!);
  }
  const cond = and(...where);
  const [rows, [{ total }]] = await Promise.all([
    db
      .select({ id: s.id, type: s.type, status: s.status, name: s.name, email: s.email, company: s.company, country: s.country, service: s.service, createdAt: s.createdAt, assignee: schema.users.name })
      .from(s)
      .leftJoin(schema.users, eq(schema.users.id, s.assignedTo))
      .where(cond)
      .orderBy(desc(s.createdAt))
      .limit(PAGE)
      .offset((page - 1) * PAGE),
    db.select({ total: count() }).from(s).where(cond),
  ]);
  const [{ spamCount }] = await db.select({ spamCount: count() }).from(s).where(and(eq(s.status, 'spam'), gte(s.createdAt, new Date(Date.now() - 30 * 86_400_000))));
  const pages = Math.max(1, Math.ceil(total / PAGE));
  const link = (patch: Partial<Search>) => {
    const p = new URLSearchParams();
    const merged = { status, type, q, ...patch };
    for (const [k, v] of Object.entries(merged)) if (v) p.set(k, String(v));
    const qs = p.toString();
    return `/admin/submissions${qs ? `?${qs}` : ''}`;
  };
  const exportHref = `/admin/submissions/export?${new URLSearchParams(Object.entries({ status: status ?? '', type: type ?? '', q }).filter(([, v]) => v)).toString()}`;

  return (
    <>
      <div className="adm-head">
        <div>
          <h1>Inquiries</h1>
          <p>Every message, quote request and newsletter sign-up from the website.</p>
        </div>
        {can(user.role, 'submissions.export') && (
          <a className="adm-btn adm-btn--ghost" href={exportHref}>
            Export CSV
          </a>
        )}
      </div>
      {sp.deleted && <p className="adm-notice adm-notice--ok">Inquiry deleted.</p>}
      {spamCount > 0 && status !== 'spam' && (
        <p className="adm-notice adm-notice--info" style={{ marginBottom: 12 }}>
          {`${spamCount} inquir${spamCount === 1 ? 'y was' : 'ies were'} caught by the spam filter in the last 30 days (no email was sent for them). `}
          <Link className="adm-link" href="/admin/submissions?status=spam">
            Review them
          </Link>
          {' '}in case a real enquiry was caught: open it and change its status.
        </p>
      )}
      <nav className="adm-tabs" aria-label="Filter by type">
        <Link href={link({ type: undefined, page: undefined })} aria-current={!type ? 'true' : undefined}>
          All types
        </Link>
        {formKinds.map((k) => (
          <Link key={k} href={link({ type: k, page: undefined })} aria-current={type === k ? 'true' : undefined}>
            {typeLabels[k]}
          </Link>
        ))}
      </nav>
      <form className="adm-filters" action="/admin/submissions">
        {type && <input type="hidden" name="type" value={type} />}
        <label className="adm-field adm-field--grow">
          <span>Search</span>
          <input type="search" name="q" defaultValue={q} placeholder="Name, email, company, service or message" />
        </label>
        <label className="adm-field">
          <span>Status</span>
          <select name="status" defaultValue={status ?? ''}>
            <option value="">All open and closed</option>
            {statuses.map((st) => (
              <option key={st} value={st}>
                {statusLabels[st]}
              </option>
            ))}
          </select>
        </label>
        <button className="adm-btn" type="submit">
          Filter
        </button>
        {(q || status) && (
          <Link className="adm-btn adm-btn--ghost" href={link({ q: undefined, status: undefined, page: undefined })}>
            Clear
          </Link>
        )}
      </form>

      {rows.length ? (
        <BulkBar canUpdate={can(user.role, 'submissions.update')}>
          <div className="adm-table-wrap">
            <table className="adm-table adm-table--stack">
              <thead>
                <tr>
                  {can(user.role, 'submissions.update') && <th aria-label="Select" />}
                  <th>From</th>
                  <th>Type</th>
                  <th>Service / country</th>
                  <th>Status</th>
                  <th>Assigned</th>
                  <th>Received</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} className={r.status === 'new' ? 'is-new' : ''}>
                    {can(user.role, 'submissions.update') && (
                      <td>
                        <input type="checkbox" name="ids" value={r.id} aria-label={`Select inquiry from ${r.name || r.email}`} />
                      </td>
                    )}
                    <td>
                      <Link className="adm-rowlink" href={`/admin/submissions/${r.id}`}>
                        {r.name || r.email}
                      </Link>
                      <span className="adm-muted" style={{ display: 'block' }}>
                        {r.company ? `${r.company} · ` : ''}
                        {r.email}
                      </span>
                    </td>
                    <td data-label="Type">{typeLabels[r.type]}</td>
                    <td data-label="Service">
                      {r.service || '—'}
                      {r.country && <span className="adm-muted" style={{ display: 'block' }}>{r.country}</span>}
                    </td>
                    <td data-label="Status">
                      <span className={`adm-badge adm-badge--${r.status}`}>{statusLabels[r.status]}</span>
                    </td>
                    <td data-label="Assigned" className="adm-muted">
                      {r.assignee ?? '—'}
                    </td>
                    <td data-label="Received" className="adm-muted">
                      {fmtDate(r.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </BulkBar>
      ) : (
        <div className="adm-card adm-empty">{q || status || type ? 'No inquiries match these filters.' : 'No inquiries yet.'}</div>
      )}
      <div className="adm-pager">
        <span>{`${total} inquir${total === 1 ? 'y' : 'ies'}`}</span>
        <div className="adm-actions">
          {page > 1 && (
            <Link className="adm-btn adm-btn--ghost adm-btn--sm" href={link({ page: String(page - 1) })}>
              ← Previous
            </Link>
          )}
          <span>{`Page ${page} of ${pages}`}</span>
          {page < pages && (
            <Link className="adm-btn adm-btn--ghost adm-btn--sm" href={link({ page: String(page + 1) })}>
              Next →
            </Link>
          )}
        </div>
      </div>
    </>
  );
}
