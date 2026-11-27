import { ActionForm, TextArea, TextField } from '@/components/admin/Form';
import { ListEditor } from '@/components/admin/ListEditor';
import { ArabicArea } from '@/components/admin/LangTabs';
import { saveServiceAr } from '../../_actions/i18n';
import { serviceNamesAr } from '@/content/ar';
import { effectiveServiceAr } from '@/server/content';
import type { schema } from '@/server/db';

type Row = typeof schema.services.$inferSelect;
type Item = Record<string, string>;

/**
 * Arabic version of a service page. Empty boxes show the English text faintly as a guide.
 * Lists start with the English items: replace them with Arabic.
 */
export function ServiceFormAr({ row }: { row: Row }) {
  const a = (effectiveServiceAr(row.country, row.slug, row.ar as Record<string, unknown> | null) ?? {}) as Record<string, unknown>;
  const s = (k: string) => (typeof a[k] === 'string' ? (a[k] as string) : '');
  const list = (k: string, fallback: Item[]) => (Array.isArray(a[k]) && (a[k] as Item[]).length ? (a[k] as Item[]) : fallback);
  return (
    <ActionForm action={saveServiceAr} sticky submitLabel="Save Arabic">
      <input type="hidden" name="id" value={row.id} />
      <p className="adm-notice adm-notice--info">
        Write the Arabic for each field. The full Arabic page goes live as soon as the page heading and overview are filled in; until then the
        Arabic site shows a short Arabic summary with a quote form. Have translations checked by a native speaker.
      </p>
      <ArabicArea>
        <TextField name="name" label="Service name" defaultValue={s('name') || serviceNamesAr[row.slug] || ''} placeholder={row.name} />
        <h3 className="adm-section-title">Search engines</h3>
        <TextField name="metaTitle" label="Meta title" defaultValue={s('metaTitle')} placeholder={row.metaTitle} max={60} />
        <TextArea name="metaDescription" label="Meta description" defaultValue={s('metaDescription')} placeholder={row.metaDescription} max={160} rows={2} />
        <TextField name="keywords" label="Keywords (comma-separated)" defaultValue={Array.isArray(a.keywords) ? (a.keywords as string[]).join('، ') : ''} />
        <h3 className="adm-section-title">Listing and hero</h3>
        <TextArea name="listingBody" label="Short description" defaultValue={s('listingBody')} placeholder={row.listingBody} rows={3} />
        <TextField name="heroHeading" label="Page heading (H1)" defaultValue={s('heroHeading')} placeholder={row.heroHeading} help="End with “في <الدولة>” to show that part in grey, e.g. … في الكويت" />
        <TextArea name="heroSubtitle" label="Hero subtitle" defaultValue={s('heroSubtitle')} placeholder={row.heroSubtitle} rows={2} />
        <h3 className="adm-section-title">Overview</h3>
        <TextField name="whyHeading" label="Overview heading" defaultValue={s('whyHeading')} placeholder={row.whyHeading} />
        <TextArea name="whyDescription" label="Overview text" defaultValue={s('whyDescription')} placeholder={row.whyDescription} rows={5} />
        <ListEditor name="benefits" label="Benefits" itemLabel="Benefit" max={6} initial={list('benefits', row.benefits)} fields={[{ name: 'title', label: 'Title', type: 'text' }, { name: 'text', label: 'Text', type: 'textarea' }]} />
        <h3 className="adm-section-title">Process</h3>
        <TextField name="stepsHeading" label="Process heading" defaultValue={s('stepsHeading')} placeholder={row.stepsHeading} />
        <ListEditor name="steps" label="Steps" itemLabel="Step" max={8} initial={list('steps', row.steps)} fields={[{ name: 'title', label: 'Title', type: 'text' }, { name: 'text', label: 'Text', type: 'textarea' }]} />
        <h3 className="adm-section-title">FAQs</h3>
        <ListEditor name="faqs" label="Questions and answers" itemLabel="FAQ" max={12} initial={list('faqs', row.faqs)} fields={[{ name: 'q', label: 'Question', type: 'text' }, { name: 'a', label: 'Answer', type: 'textarea' }]} />
        <h3 className="adm-section-title">Closing call to action</h3>
        <TextField name="ctaHeading" label="Heading" defaultValue={s('ctaHeading')} placeholder={row.ctaHeading} />
        <TextArea name="ctaDescription" label="Text" defaultValue={s('ctaDescription')} placeholder={row.ctaDescription} rows={2} />
        <TextField name="ctaText" label="Button label" defaultValue={s('ctaText')} placeholder={row.ctaText} max={45} />
      </ArabicArea>
    </ActionForm>
  );
}
