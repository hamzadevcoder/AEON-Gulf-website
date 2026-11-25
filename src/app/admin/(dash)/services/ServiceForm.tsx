import { ActionForm, Checkbox, SelectField, TextArea, TextField } from '@/components/admin/Form';
import { ListEditor } from '@/components/admin/ListEditor';
import { groupInfo, groupOrder } from '@/content/services';
import { saveService } from '../../_actions/content';
import type { schema } from '@/server/db';

type Row = typeof schema.services.$inferSelect;

/** Create / edit form for one service page. Every field of the page is editable. */
export function ServiceForm({ row, countries, defaultCountry }: { row?: Row; countries: { slug: string; name: string }[]; defaultCountry?: string }) {
  return (
    <ActionForm action={saveService} sticky submitLabel={row ? 'Save service' : 'Create service'}>
      {row && <input type="hidden" name="id" value={row.id} />}
      <div className="adm-row adm-row--3">
        <SelectField name="country" label="Country" required defaultValue={row?.country ?? defaultCountry} options={countries.map((c) => ({ value: c.slug, label: c.name }))} />
        <SelectField name="group" label="Service group" required defaultValue={row?.group ?? 'corporate'} options={groupOrder.map((g) => ({ value: g, label: groupInfo[g].label }))} />
        <TextField name="sort" label="Order in list" type="number" defaultValue={row?.sort ?? 100} help="Lower numbers appear first." />
      </div>
      <div className="adm-row">
        <TextField name="name" label="Service name" required defaultValue={row?.name} max={160} />
        <TextField name="slug" label="URL slug" required defaultValue={row?.slug} help="Lowercase words joined with hyphens, e.g. company-formation." />
      </div>
      <Checkbox name="published" label="Published on the website" defaultChecked={row?.published ?? true} />

      <h3 className="adm-section-title">Search engines</h3>
      <TextField name="metaTitle" label="Meta title" required defaultValue={row?.metaTitle} max={60} help="Shown as the Google result title. Keep to 60 characters." />
      <TextArea name="metaDescription" label="Meta description" required defaultValue={row?.metaDescription} max={160} rows={2} help="Shown under the title in Google. 120–160 characters." />
      <TextField name="keywords" label="Keywords" defaultValue={row?.keywords.join(', ')} help="Comma-separated." />

      <h3 className="adm-section-title">Listing and hero</h3>
      <TextArea name="listingBody" label="Short description (lists and cards)" required defaultValue={row?.listingBody} rows={3} />
      <TextField name="heroHeading" label="Page heading (H1)" required defaultValue={row?.heroHeading} help={'Ending with "in <Country>" shows that part in grey.'} />
      <TextArea name="heroSubtitle" label="Hero subtitle" required defaultValue={row?.heroSubtitle} rows={2} />

      <h3 className="adm-section-title">Overview</h3>
      <TextField name="whyHeading" label="Overview heading" required defaultValue={row?.whyHeading} />
      <TextArea name="whyDescription" label="Overview text" required defaultValue={row?.whyDescription} rows={5} />
      <ListEditor
        name="benefits"
        label="Benefits"
        itemLabel="Benefit"
        min={1}
        max={6}
        initial={row?.benefits ?? [{ title: '', text: '' }, { title: '', text: '' }, { title: '', text: '' }]}
        fields={[{ name: 'title', label: 'Title', type: 'text' }, { name: 'text', label: 'Text', type: 'textarea' }]}
      />

      <h3 className="adm-section-title">Process</h3>
      <TextField name="stepsHeading" label="Process heading" required defaultValue={row?.stepsHeading} />
      <ListEditor
        name="steps"
        label="Steps"
        itemLabel="Step"
        min={1}
        max={8}
        initial={row?.steps ?? [{ title: '', text: '' }, { title: '', text: '' }, { title: '', text: '' }, { title: '', text: '' }]}
        fields={[{ name: 'title', label: 'Title', type: 'text' }, { name: 'text', label: 'Text', type: 'textarea' }]}
      />

      <h3 className="adm-section-title">FAQs</h3>
      <ListEditor
        name="faqs"
        label="Questions and answers"
        itemLabel="FAQ"
        max={12}
        help="Also published as FAQ structured data for Google."
        initial={row?.faqs ?? [{ q: '', a: '' }]}
        fields={[{ name: 'q', label: 'Question', type: 'text' }, { name: 'a', label: 'Answer', type: 'textarea' }]}
      />

      <h3 className="adm-section-title">Closing call to action</h3>
      <TextField name="ctaHeading" label="Heading" required defaultValue={row?.ctaHeading} />
      <TextArea name="ctaDescription" label="Text" required defaultValue={row?.ctaDescription} rows={2} />
      <TextField name="ctaText" label="Button label" required defaultValue={row?.ctaText} max={45} />
    </ActionForm>
  );
}
