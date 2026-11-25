import Link from 'next/link';
import { notFound } from 'next/navigation';
import { eq } from 'drizzle-orm';
import { requirePermission } from '@/server/auth';
import { requireDb, schema } from '@/server/db';
import { ActionForm, TextArea, TextField } from '@/components/admin/Form';
import { ListEditor } from '@/components/admin/ListEditor';
import { saveCountry } from '../../../_actions/content';

export const metadata = { title: 'Edit country' };

export default async function EditCountry({ params }: { params: Promise<{ slug: string }> }) {
  await requirePermission('content.edit', 'page');
  const { slug } = await params;
  const [c] = await requireDb().select().from(schema.countries).where(eq(schema.countries.slug, slug));
  if (!c) notFound();
  return (
    <>
      <div className="adm-head">
        <div>
          <nav className="adm-crumbs">
            <Link href="/admin/countries">Countries</Link> / <span>{c.name}</span>
          </nav>
          <h1>{c.name}</h1>
        </div>
        <a className="adm-btn adm-btn--ghost" href={`/${c.slug}`} target="_blank" rel="noreferrer">
          View page ↗
        </a>
      </div>
      <div className="adm-card">
        <ActionForm action={saveCountry} sticky>
          <input type="hidden" name="slug" value={c.slug} />
          <div className="adm-row">
            <TextField name="name" label="Country name" required defaultValue={c.name} />
            <TextField name="code" label="Two-letter code" required defaultValue={c.code} help="Shown on the homepage card badge." />
          </div>
          <TextArea name="intro" label="Introduction (country page hero)" defaultValue={c.intro} rows={3} />
          <TextField name="line" label="Homepage card line" defaultValue={c.line} />
          <TextField name="authoritiesSummary" label="Homepage card authorities line" defaultValue={c.authoritiesSummary} />
          <ListEditor
            name="quickFacts"
            label="Quick facts (hero panel)"
            itemLabel="Fact"
            max={6}
            initial={c.quickFacts}
            fields={[{ name: 'label', label: 'Label', type: 'text' }, { name: 'value', label: 'Value', type: 'text' }]}
          />
          <ListEditor
            name="authorities"
            label="Authorities (scrolling list)"
            itemLabel="Authority"
            max={30}
            initial={c.authorities.map((name) => ({ name }))}
            fields={[{ name: 'name', label: 'Name', type: 'text' }]}
          />
          <h3 className="adm-section-title">Office</h3>
          <div className="adm-row">
            <TextField name="officeDetail" label="Office / city" defaultValue={c.office.detail} />
            <TextField name="officePhone" label="Office phone" defaultValue={c.office.phone ?? ''} help="Leave empty to show “To be confirmed”." />
          </div>
        </ActionForm>
      </div>
    </>
  );
}
