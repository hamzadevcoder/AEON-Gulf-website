import Link from 'next/link';
import { asc, sql } from 'drizzle-orm';
import { requirePermission } from '@/server/auth';
import { requireDb, schema } from '@/server/db';

export const metadata = { title: 'Countries' };

export default async function CountriesAdmin() {
  await requirePermission('content.edit', 'page');
  const db = requireDb();
  const [rows, counts] = await Promise.all([
    db.select().from(schema.countries).orderBy(asc(schema.countries.sort)),
    db.select({ country: schema.services.country, n: sql<number>`count(*)::int` }).from(schema.services).groupBy(schema.services.country),
  ]);
  return (
    <>
      <div className="adm-head">
        <div>
          <h1>Countries</h1>
          <p>Country page text, quick facts, authorities and office details. Shared country-page text is under Page text.</p>
        </div>
      </div>
      <div className="adm-grid adm-grid--3">
        {rows.map((c) => (
          <Link key={c.slug} href={`/admin/countries/${c.slug}`} className="adm-card adm-stat">
            <div className="adm-stat__n">{c.name}</div>
            <div className="adm-stat__l">{`${counts.find((x) => x.country === c.slug)?.n ?? 0} services · ${c.office.detail || 'No office details'}`}</div>
          </Link>
        ))}
      </div>
    </>
  );
}
