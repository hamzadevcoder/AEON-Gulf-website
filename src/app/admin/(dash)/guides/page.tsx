import Link from 'next/link';
import { asc } from 'drizzle-orm';
import { requirePermission } from '@/server/auth';
import { requireDb, schema } from '@/server/db';
import { guidePath } from '@/content/insights';
import { fmtDate } from '@/lib/format';

export const metadata = { title: 'Guides' };

export default async function GuidesAdmin({ searchParams }: { searchParams: Promise<{ deleted?: string }> }) {
  await requirePermission('content.edit', 'page');
  const rows = await requireDb().select().from(schema.guides).orderBy(asc(schema.guides.sort), asc(schema.guides.title));
  return (
    <>
      <div className="adm-head">
        <div>
          <h1>Guides</h1>
          <p>Insight articles. Each guide pulls its questions and process steps from a related service.</p>
        </div>
        <Link className="adm-btn adm-btn--primary" href="/admin/guides/new">
          New guide
        </Link>
      </div>
      {(await searchParams).deleted && <p className="adm-notice adm-notice--ok">Guide deleted.</p>}
      <div className="adm-table-wrap">
        <table className="adm-table adm-table--stack">
          <tbody>
            {rows.map((g) => (
              <tr key={g.slug}>
                <td>
                  <Link className="adm-rowlink" href={`/admin/guides/${g.slug}`}>
                    {g.title}
                  </Link>
                  <span className="adm-muted" style={{ display: 'block' }}>
                    {guidePath(g)}
                  </span>
                </td>
                <td data-label="Status">
                  <span className={`adm-badge adm-badge--${g.published ? 'on' : 'off'}`}>{g.published ? 'Published' : 'Hidden'}</span>
                </td>
                <td className="adm-muted" data-label="Updated">
                  {fmtDate(g.updatedAt)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!rows.length && <p className="adm-empty">No guides yet.</p>}
      </div>
    </>
  );
}
