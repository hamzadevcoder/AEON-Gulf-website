import Link from 'next/link';
import { LangTabs, ArabicArea } from '@/components/admin/LangTabs';
import { ServiceFormAr } from '../ServiceFormAr';
import { clearServiceAr } from '../../../_actions/i18n';
import { isServiceTranslated } from '@/server/content';
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

export default async function EditService({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ created?: string; lang?: string }> }) {
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
  const lang = (await searchParams).lang === 'ar' ? 'ar' : 'en';
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
            <a className="adm-btn adm-btn--ghost" href={lang === 'ar' ? `/ar${servicePath(row)}` : servicePath(row)} target="_blank" rel="noreferrer">
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
      <LangTabs href={`/admin/services/${row.id}`} lang={lang} arStatus={isServiceTranslated(row.ar, row.country, row.slug) ? 'translated' : 'not translated'} />
      <div className="adm-card">
        {lang === 'ar' ? <ServiceFormAr row={row} /> : <ServiceForm row={row} countries={countries} />}
      </div>
      {lang === 'ar' && row.ar && (
        <ConfirmForm action={clearServiceAr} confirm="Remove the Arabic version of this service? The Arabic site will show the short summary page again." hidden={{ id: row.id }}>
          <button className="adm-btn adm-btn--danger adm-btn--sm" type="submit" style={{ marginTop: 12 }}>
            Remove Arabic version
          </button>
        </ConfirmForm>
      )}
    </>
  );
}
