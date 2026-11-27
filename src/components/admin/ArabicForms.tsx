import { ActionForm, TextArea, TextField } from './Form';
import { ListEditor } from './ListEditor';
import { ArabicArea } from './LangTabs';
import { saveCountryAr, saveGuideAr, saveLegalAr } from '@/app/admin/_actions/i18n';
import { countriesAr, guidesAr, policiesAr } from '@/content/ar';
import { blocksToText } from '@/lib/legal-text';
import type { Policy } from '@/content/legal';
import type { schema } from '@/server/db';

const str = (v: unknown) => (typeof v === 'string' ? v : '');

/** Arabic version of a country (stored Arabic, else the built-in Arabic text). */
export function CountryFormAr({ c }: { c: typeof schema.countries.$inferSelect }) {
  const a = { ...(countriesAr[c.slug] ?? {}), ...((c.ar ?? {}) as Record<string, unknown>) } as Record<string, unknown>;
  const facts = (Array.isArray(a.quickFacts) ? a.quickFacts : c.quickFacts) as { label: string; value: string }[];
  const auth = (Array.isArray(a.authorityList) ? a.authorityList : c.authorities) as string[];
  return (
    <div className="adm-card">
      <ActionForm action={saveCountryAr} sticky submitLabel="Save Arabic">
        <input type="hidden" name="slug" value={c.slug} />
        <ArabicArea>
          <TextField name="name" label="Country name" defaultValue={str(a.name)} placeholder={c.name} />
          <TextArea name="intro" label="Introduction (country page hero)" defaultValue={str(a.intro)} placeholder={c.intro} rows={3} />
          <TextField name="line" label="Homepage card line" defaultValue={str(a.line)} placeholder={c.line} />
          <TextField name="authoritiesSummary" label="Homepage card authorities line" defaultValue={str(a.authorities)} placeholder={c.authoritiesSummary} />
          <ListEditor name="quickFacts" label="Quick facts" itemLabel="Fact" max={6} initial={facts} fields={[{ name: 'label', label: 'Label', type: 'text' }, { name: 'value', label: 'Value', type: 'text' }]} />
          <ListEditor name="authorities" label="Authorities" itemLabel="Authority" max={30} initial={auth.map((name) => ({ name }))} fields={[{ name: 'name', label: 'Name', type: 'text' }]} />
          <TextField name="officeDetail" label="Office / city" defaultValue={str(a.officeDetail)} placeholder={c.office.detail} />
        </ArabicArea>
      </ActionForm>
    </div>
  );
}

export function GuideFormAr({ row }: { row: typeof schema.guides.$inferSelect }) {
  const a = { ...(guidesAr[row.slug] ?? {}), ...((row.ar ?? {}) as Record<string, unknown>) } as Record<string, unknown>;
  return (
    <div className="adm-card">
      <ActionForm action={saveGuideAr} sticky submitLabel="Save Arabic">
        <input type="hidden" name="slug" value={row.slug} />
        <p className="adm-notice adm-notice--info">The questions and steps in a guide come from its related service, so the Arabic guide appears once that service has its Arabic page.</p>
        <ArabicArea>
          <TextField name="title" label="Title (H1)" defaultValue={str(a.title)} placeholder={row.title} />
          <TextArea name="excerpt" label="Excerpt" defaultValue={str(a.excerpt)} placeholder={row.excerpt} rows={2} />
          <TextField name="category" label="Category" defaultValue={str(a.category) || 'دليل'} />
          <TextArea name="intro" label="Introduction" defaultValue={Array.isArray(a.intro) ? (a.intro as string[]).join('\n\n') : ''} placeholder={row.intro.join('\n\n')} rows={6} help="Leave a blank line between paragraphs." />
          <TextField name="metaTitle" label="Meta title" defaultValue={str(a.metaTitle)} placeholder={row.metaTitle} max={60} />
          <TextArea name="metaDescription" label="Meta description" defaultValue={str(a.metaDescription)} placeholder={row.metaDescription} max={160} rows={2} />
        </ArabicArea>
      </ActionForm>
    </div>
  );
}

export function LegalFormAr({ slug, stored }: { slug: string; stored: Policy | null }) {
  const p = stored?.title ? stored : policiesAr[slug];
  return (
    <div className="adm-card">
      <ActionForm action={saveLegalAr} sticky submitLabel="Save Arabic">
        <input type="hidden" name="slug" value={slug} />
        <p className="adm-notice adm-notice--warn">Legal text: have the Arabic reviewed by your legal adviser before launch.</p>
        <ArabicArea>
          <div className="adm-row">
            <TextField name="title" label="Title" defaultValue={p.title} />
            <TextField name="effective" label="Effective date" defaultValue={p.effective} />
          </div>
          <TextArea name="intro" label="Introduction" defaultValue={blocksToText(p.intro)} rows={5} />
          <ListEditor name="sections" label="Sections" itemLabel="Section" min={1} max={40} initial={p.sections.map((s) => ({ title: s.title, body: blocksToText(s.blocks) }))} fields={[{ name: 'title', label: 'Section title', type: 'text' }, { name: 'body', label: 'Section text', type: 'textarea' }]} />
        </ArabicArea>
      </ActionForm>
    </div>
  );
}
