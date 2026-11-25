import { ActionForm, Checkbox, SelectField, TextArea, TextField } from '@/components/admin/Form';
import { saveGuide } from '../../_actions/content';
import { sources } from '@/content/images';
import type { schema } from '@/server/db';

type Row = typeof schema.guides.$inferSelect;

export function GuideForm({ row, countries, services, media }: { row?: Row; countries: { slug: string; name: string }[]; services: { country: string; slug: string; name: string }[]; media: { url: string; filename: string }[] }) {
  const imageOptions = [
    ...Object.entries(sources).map(([k, v]) => ({ value: k, label: `Site image: ${v.alt}` })),
    ...media.map((m) => ({ value: m.url, label: `Uploaded: ${m.filename}` })),
  ];
  return (
    <ActionForm action={saveGuide} sticky submitLabel={row ? 'Save guide' : 'Create guide'}>
      <input type="hidden" name="originalSlug" value={row?.slug ?? ''} />
      <div className="adm-row">
        <TextField name="title" label="Title (H1)" required defaultValue={row?.title} max={160} />
        <TextField name="slug" label="URL slug" required defaultValue={row?.slug} help="/insights/your-slug" />
      </div>
      <TextArea name="excerpt" label="Excerpt (cards)" required defaultValue={row?.excerpt} rows={2} max={300} />
      <div className="adm-row adm-row--3">
        <SelectField name="country" label="Country" required defaultValue={row?.country ?? 'kuwait'} options={countries.map((c) => ({ value: c.slug, label: c.name }))} />
        <TextField name="category" label="Category" defaultValue={row?.category ?? 'Guide'} />
        <TextField name="sort" label="Order" type="number" defaultValue={row?.sort ?? 100} />
      </div>
      <SelectField
        name="service"
        label="Related service"
        required
        defaultValue={row?.service}
        help="The guide shows this service's FAQs and process. It must exist in the chosen country."
        options={[...new Map(services.map((s) => [s.slug, { value: s.slug, label: s.name }])).values()].sort((a, b) => a.label.localeCompare(b.label))}
      />
      <SelectField name="image" label="Image" required defaultValue={row?.image ?? 'corporate'} options={imageOptions} help="Upload new images under Images." />
      <TextArea name="intro" label="Introduction" defaultValue={row?.intro.join('\n\n')} rows={6} help="Leave a blank line between paragraphs." />
      <h3 className="adm-section-title">Search engines</h3>
      <TextField name="metaTitle" label="Meta title" required defaultValue={row?.metaTitle} max={60} />
      <TextArea name="metaDescription" label="Meta description" required defaultValue={row?.metaDescription} rows={2} max={160} />
      <Checkbox name="published" label="Published on the website" defaultChecked={row?.published ?? true} />
    </ActionForm>
  );
}
