import Link from 'next/link';
import { notFound } from 'next/navigation';
import { eq } from 'drizzle-orm';
import { requirePermission } from '@/server/auth';
import { requireDb, schema } from '@/server/db';
import { ConfirmForm } from '@/components/admin/Form';
import { GuideForm } from '../GuideForm';
import { guideFormData } from '../data';
import { deleteGuide } from '../../../_actions/content';

export const metadata = { title: 'Edit guide' };

export default async function EditGuide({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<{ saved?: string }> }) {
  await requirePermission('content.edit', 'page');
  const { slug } = await params;
  const [row] = await requireDb().select().from(schema.guides).where(eq(schema.guides.slug, slug));
  if (!row) notFound();
  const data = await guideFormData();
  return (
    <>
      <div className="adm-head">
        <div>
          <nav className="adm-crumbs">
            <Link href="/admin/guides">Guides</Link> / <span>Edit</span>
          </nav>
          <h1>{row.title}</h1>
        </div>
        <div className="adm-actions">
          {row.published && (
            <a className="adm-btn adm-btn--ghost" href={`/insights/${row.slug}`} target="_blank" rel="noreferrer">
              View ↗
            </a>
          )}
          <ConfirmForm action={deleteGuide} confirm="Delete this guide permanently?" hidden={{ slug: row.slug }}>
            <button className="adm-btn adm-btn--danger" type="submit">
              Delete
            </button>
          </ConfirmForm>
        </div>
      </div>
      {(await searchParams).saved && <p className="adm-notice adm-notice--ok">Guide saved.</p>}
      <div className="adm-card">
        <GuideForm row={row} {...data} />
      </div>
    </>
  );
}
