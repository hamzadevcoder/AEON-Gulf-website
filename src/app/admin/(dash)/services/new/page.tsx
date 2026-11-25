import Link from 'next/link';
import { asc } from 'drizzle-orm';
import { requirePermission } from '@/server/auth';
import { requireDb, schema } from '@/server/db';
import { ServiceForm } from '../ServiceForm';

export const metadata = { title: 'New service' };

export default async function NewService({ searchParams }: { searchParams: Promise<{ country?: string }> }) {
  await requirePermission('content.edit', 'page');
  const countries = await requireDb().select({ slug: schema.countries.slug, name: schema.countries.name }).from(schema.countries).orderBy(asc(schema.countries.sort));
  return (
    <>
      <div className="adm-head">
        <div>
          <nav className="adm-crumbs">
            <Link href="/admin/services">Services</Link> / <span>New</span>
          </nav>
          <h1>New service</h1>
          <p>Fill in every section. The page goes live when you create it, unless you untick Published.</p>
        </div>
      </div>
      <div className="adm-card">
        <ServiceForm countries={countries} defaultCountry={(await searchParams).country} />
      </div>
    </>
  );
}
