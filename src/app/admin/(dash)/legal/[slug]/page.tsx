import Link from 'next/link';
import { LangTabs } from '@/components/admin/LangTabs';
import { LegalFormAr } from '@/components/admin/ArabicForms';
import { getPolicyRows } from '@/server/content';
import type { Policy } from '@/content/legal';
import { notFound } from 'next/navigation';
import { requirePermission } from '@/server/auth';
import { getPolicies } from '@/server/content';
import { blocksToText } from '@/lib/legal-text';
import { ActionForm, TextArea, TextField } from '@/components/admin/Form';
import { ListEditor } from '@/components/admin/ListEditor';
import { saveLegal } from '../../../_actions/content';

export const metadata = { title: 'Edit legal page' };
export const dynamic = 'force-dynamic';

export default async function EditLegal({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<{ lang?: string }> }) {
  await requirePermission('content.edit', 'page');
  const { slug } = await params;
  const p = (await getPolicies())[slug];
  if (!p) notFound();
  const lang = (await searchParams).lang === 'ar' ? 'ar' : 'en';
  const storedAr = ((await getPolicyRows())[slug]?.ar ?? null) as unknown as Policy | null;
  return (
    <>
      <div className="adm-head">
        <div>
          <nav className="adm-crumbs">
            <Link href="/admin/legal">Legal pages</Link> / <span>{p.title}</span>
          </nav>
          <h1>{p.title}</h1>
          <p>Formatting: a blank line starts a new paragraph, lines starting with “- ” become a bullet list, and “### ” starts a sub-heading.</p>
        </div>
        <a className="adm-btn adm-btn--ghost" href={lang === 'ar' ? `/ar/${p.slug}` : `/${p.slug}`} target="_blank" rel="noreferrer">
          View page ↗
        </a>
      </div>
      <LangTabs href={`/admin/legal/${p.slug}`} lang={lang} />
      {lang === 'ar' ? <LegalFormAr slug={p.slug} stored={storedAr} /> : (
      <div className="adm-card">
        <ActionForm action={saveLegal} sticky>
          <input type="hidden" name="slug" value={p.slug} />
          <div className="adm-row">
            <TextField name="title" label="Title" required defaultValue={p.title} />
            <TextField name="effective" label="Effective date" required defaultValue={p.effective} />
          </div>
          <TextArea name="intro" label="Introduction" defaultValue={blocksToText(p.intro)} rows={5} />
          <ListEditor
            name="sections"
            label="Sections"
            itemLabel="Section"
            min={1}
            max={40}
            initial={p.sections.map((s) => ({ title: s.title, body: blocksToText(s.blocks) }))}
            fields={[{ name: 'title', label: 'Section title', type: 'text' }, { name: 'body', label: 'Section text', type: 'textarea' }]}
          />
        </ActionForm>
      </div>
      )}
    </>
  );
}
