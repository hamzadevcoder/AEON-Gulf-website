import Link from 'next/link';
import { notFound } from 'next/navigation';
import { asc, eq } from 'drizzle-orm';
import { z } from 'zod';
import { requirePermission } from '@/server/auth';
import { requireDb, schema } from '@/server/db';
import { servicePath } from '@/content/services';
import { fmtDate } from '@/lib/format';
import { ConfirmForm } from '@/components/admin/Form';
import { ServiceForm } from '../ServiceForm';
import { deleteService } from '../../../_actions/content';

export const metadata = { title: 'Edit service' };

export default async function EditService({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ created?: string }> }) {
  await requirePermission('content.edit', 'page');
  const { id } = await params;
  if (!z.string().uuid().safeParse(id).success) notFound();
  const db = requireDb();
  const [[row], countries] = await Promise.all([
    db.select().from(schema.services).where(eq(schema.services.id, id)),
    db.select({ slug: schema.countries.slug, name: schema.countries.name }).from(schema.countries).orderBy(asc(schema.countries.sort)),
  ]);
  if (!row) notFound();
  const country = countries.find((c) => c.slug === row.country);
  return (
    <>
      <div className="adm-head">
        <div>
          <nav className="adm-crumbs">
            <Link href={`/admin/services?country=${row.country}`}>Services</Link> / <span>{country?.name}</span>
          </nav>
          <h1>{row.name}</h1>
          <p>{`Last updated ${fmtDate(row.updatedAt)}`}</p>
        </div>
        <div className="adm-actions">
          {row.published && (
            <a className="adm-btn adm-btn--ghost" href={servicePath(row)} target="_blank" rel="noreferrer">
              View on website ↗
            </a>
          )}
          <ConfirmForm action={deleteService} confirm={`Delete "${row.name}" permanently? Its page will stop working.`} hidden={{ id: row.id }}>
            <button className="adm-btn adm-btn--danger" type="submit">
              Delete
            </button>
          </ConfirmForm>
        </div>
      </div>
      {(await searchParams).created && <p className="adm-notice adm-notice--ok">Service created.</p>}
      <div className="adm-card">
        <ServiceForm row={row} countries={countries} />
      </div>
    </>
  );
}
