import { and, desc, eq, ilike, or, type SQL } from 'drizzle-orm';
import { getSessionUser, audit } from '@/server/auth';
import { requireDb, schema } from '@/server/db';
import { can } from '@/lib/permissions';
import { statuses, formKinds, type Status, type FormKind } from '@/lib/submissions';

export const dynamic = 'force-dynamic';

const cols = ['created_at', 'type', 'status', 'name', 'email', 'phone', 'company', 'country', 'service', 'message', 'project_type', 'location', 'budget', 'source_page'] as const;

/** Escape for CSV, and neutralise values a spreadsheet would treat as a formula. */
const cell = (v: unknown) => {
  let s = v == null ? '' : String(v);
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return `"${s.replace(/"/g, '""')}"`;
};

export async function GET(req: Request) {
  const user = await getSessionUser();
  if (!user || !can(user.role, 'submissions.export')) return new Response('Forbidden', { status: 403 });
  const url = new URL(req.url);
  const s = schema.submissions;
  const where: SQL[] = [];
  const status = url.searchParams.get('status') as Status | null;
  const type = url.searchParams.get('type') as FormKind | null;
  const q = (url.searchParams.get('q') ?? '').slice(0, 100);
  if (status && statuses.includes(status)) where.push(eq(s.status, status));
  if (type && formKinds.includes(type)) where.push(eq(s.type, type));
  if (q) {
    const like = `%${q.replace(/[%_]/g, '\\$&')}%`;
    where.push(or(ilike(s.name, like), ilike(s.email, like), ilike(s.company, like), ilike(s.service, like), ilike(s.message, like))!);
  }
  const rows = await requireDb().select().from(s).where(and(...where)).orderBy(desc(s.createdAt)).limit(50_000);
  const lines = [cols.join(',')];
  for (const r of rows) {
    lines.push(
      [r.createdAt.toISOString(), r.type, r.status, r.name, r.email, r.phone, r.company, r.country, r.service, r.message, r.data.projectType, r.data.location, r.data.budget, r.sourcePage]
        .map(cell)
        .join(','),
    );
  }
  await audit(user.id, 'submission.export', 'submission', null, { count: rows.length, status, type, q });
  return new Response('\uFEFF' + lines.join('\r\n'), {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="aeon-inquiries-${new Date().toISOString().slice(0, 10)}.csv"`,
      'Cache-Control': 'no-store',
    },
  });
}
