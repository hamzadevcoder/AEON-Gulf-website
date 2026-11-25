import Link from 'next/link';
import { count, desc, eq } from 'drizzle-orm';
import { requirePermission } from '@/server/auth';
import { requireDb, schema } from '@/server/db';
import { fmtDate } from '@/lib/format';

export const metadata = { title: 'Audit log' };
const PAGE = 50;

export default async function AuditPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  await requirePermission('audit.view', 'page');
  const page = Math.max(1, Number((await searchParams).page) || 1);
  const db = requireDb();
  const [rows, [{ total }]] = await Promise.all([
    db
      .select({ id: schema.auditLog.id, action: schema.auditLog.action, entity: schema.auditLog.entity, entityId: schema.auditLog.entityId, createdAt: schema.auditLog.createdAt, who: schema.users.name })
      .from(schema.auditLog)
      .leftJoin(schema.users, eq(schema.users.id, schema.auditLog.userId))
      .orderBy(desc(schema.auditLog.createdAt))
      .limit(PAGE)
      .offset((page - 1) * PAGE),
    db.select({ total: count() }).from(schema.auditLog),
  ]);
  const pages = Math.max(1, Math.ceil(total / PAGE));
  return (
    <>
      <div className="adm-head">
        <div>
          <h1>Audit log</h1>
          <p>Every sign-in and change made in the dashboard.</p>
        </div>
      </div>
      <div className="adm-table-wrap">
        <table className="adm-table adm-table--stack">
          <thead>
            <tr>
              <th>When</th>
              <th>Who</th>
              <th>Action</th>
              <th>Item</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <td className="adm-muted">{fmtDate(r.createdAt)}</td>
                <td data-label="Who">{r.who ?? 'Removed user'}</td>
                <td data-label="Action">{r.action}</td>
                <td data-label="Item" className="adm-muted" style={{ overflowWrap: 'anywhere' }}>
                  {r.entity === 'submission' && r.entityId ? <Link className="adm-link" href={`/admin/submissions/${r.entityId}`}>{`inquiry ${r.entityId.slice(0, 8)}`}</Link> : `${r.entity}${r.entityId ? `: ${r.entityId}` : ''}`}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!rows.length && <p className="adm-empty">Nothing recorded yet.</p>}
      </div>
      <div className="adm-pager">
        <span>{`${total} entries`}</span>
        <div className="adm-actions">
          {page > 1 && <Link className="adm-btn adm-btn--ghost adm-btn--sm" href={`/admin/audit?page=${page - 1}`}>← Newer</Link>}
          <span>{`Page ${page} of ${pages}`}</span>
          {page < pages && <Link className="adm-btn adm-btn--ghost adm-btn--sm" href={`/admin/audit?page=${page + 1}`}>Older →</Link>}
        </div>
      </div>
    </>
  );
}
