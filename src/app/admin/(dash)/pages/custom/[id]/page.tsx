import Link from 'next/link';
import { notFound } from 'next/navigation';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { requirePermission } from '@/server/auth';
import { requireDb, schema } from '@/server/db';
import { sectionTemplate, sectionTemplates } from '@/content/sections';
import { imageOptions } from '@/server/admin-data';
import { fmtDate } from '@/lib/format';
import { ActionForm, Checkbox, ConfirmForm, TextArea, TextField } from '@/components/admin/Form';
import { FieldsEditor } from '@/components/admin/FieldsEditor';
import { SectionCard } from '@/components/admin/SectionCard';
import { addSection, deletePage, deleteSection, duplicateSection, moveSection, savePageSettings, saveSection, toggleSection } from '../../../../_actions/pages';

export const metadata = { title: 'Edit page' };
export const dynamic = 'force-dynamic';

const teaser = (d: Record<string, unknown>) => {
  for (const k of ['title', 'heading', 'statement', 'text', 'eyebrow']) if (typeof d[k] === 'string' && d[k]) return String(d[k]).slice(0, 90);
  return '';
};

export default async function EditCustomPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ open?: string; created?: string }> }) {
  await requirePermission('content.edit', 'page');
  const { id } = await params;
  if (!z.string().uuid().safeParse(id).success) notFound();
  const [page] = await requireDb().select().from(schema.pages).where(eq(schema.pages.id, id));
  if (!page) notFound();
  const sp = await searchParams;
  const options = await imageOptions();
  const hid = (sectionId: string) => (
    <>
      <input type="hidden" name="id" value={page.id} />
      <input type="hidden" name="sectionId" value={sectionId} />
    </>
  );

  return (
    <>
      <div className="adm-head">
        <div>
          <nav className="adm-crumbs">
            <Link href="/admin/pages">Pages</Link> / <span>{page.title}</span>
          </nav>
          <h1>
            {page.title} <span className={`adm-badge adm-badge--${page.published ? 'on' : 'off'}`}>{page.published ? 'Live' : 'Draft'}</span>
          </h1>
          <p>{`/${page.slug} · last edited ${fmtDate(page.updatedAt)}`}</p>
        </div>
        {page.published ? (
          <a className="adm-btn adm-btn--ghost" href={`/${page.slug}`} target="_blank" rel="noreferrer">
            View page ↗
          </a>
        ) : null}
      </div>
      {sp.created && <p className="adm-notice adm-notice--ok">Page created as a draft. Edit the sections, then tick “Published” in Page settings to put it on the website.</p>}
      {!page.published && !sp.created && <p className="adm-notice adm-notice--info">This page is a draft and is not visible on the website. Tick “Published” in Page settings when you are ready.</p>}

      <div className="adm-split">
        <div>
          <div className="adm-seclist">
            {page.sections.map((sec, i) => {
              const tpl = sectionTemplate(sec.type);
              if (!tpl) return null;
              const last = i === page.sections.length - 1;
              return (
                <SectionCard
                  key={sec.id}
                  id={`s-${sec.id}`}
                  icon={tpl.icon}
                  title={tpl.name}
                  summary={teaser(sec.data)}
                  open={sp.open === sec.id}
                  badge={sec.hidden ? <span className="adm-badge adm-badge--off">Hidden</span> : undefined}
                  tools={
                    <>
                      <form action={moveSection}>
                        {hid(sec.id)}
                        <input type="hidden" name="dir" value="up" />
                        <button className="adm-tool" type="submit" disabled={i === 0} aria-label="Move up" title="Move up">
                          ↑
                        </button>
                      </form>
                      <form action={moveSection}>
                        {hid(sec.id)}
                        <input type="hidden" name="dir" value="down" />
                        <button className="adm-tool" type="submit" disabled={last} aria-label="Move down" title="Move down">
                          ↓
                        </button>
                      </form>
                      <form action={toggleSection}>
                        {hid(sec.id)}
                        <button className="adm-tool adm-tool--text" type="submit" title={sec.hidden ? 'Show this section on the page' : 'Hide this section from the page'}>
                          {sec.hidden ? 'Show' : 'Hide'}
                        </button>
                      </form>
                      <form action={duplicateSection}>
                        {hid(sec.id)}
                        <button className="adm-tool adm-tool--text" type="submit" title="Duplicate this section">
                          Copy
                        </button>
                      </form>
                      <ConfirmForm action={deleteSection} confirm="Delete this section?" hidden={{ id: page.id, sectionId: sec.id }}>
                        <button className="adm-tool adm-tool--danger" type="submit" aria-label="Delete section" title="Delete section">
                          ✕
                        </button>
                      </ConfirmForm>
                    </>
                  }
                >
                  <ActionForm action={saveSection} sticky submitLabel="Save section">
                    {hid(sec.id)}
                    <FieldsEditor fields={tpl.fields} values={sec.data} imageOptions={options} />
                  </ActionForm>
                </SectionCard>
              );
            })}
          </div>

          <details className="adm-add" open={page.sections.length === 0}>
            <summary className="adm-btn adm-btn--primary">+ Add a section</summary>
            <p className="adm-hint">Choose a template. It is added to the bottom of the page with starter text you can change.</p>
            <div className="adm-templates">
              {sectionTemplates.map((t) => (
                <form action={addSection} key={t.type}>
                  <input type="hidden" name="id" value={page.id} />
                  <input type="hidden" name="type" value={t.type} />
                  <button type="submit" className="adm-template">
                    <span className="adm-template__icon" aria-hidden="true">
                      {t.icon}
                    </span>
                    <strong>{t.name}</strong>
                    <small>{t.description}</small>
                  </button>
                </form>
              ))}
            </div>
          </details>
        </div>

        <aside>
          <section className="adm-card">
            <h2>Page settings</h2>
            <ActionForm action={savePageSettings} submitLabel="Save settings">
              <input type="hidden" name="id" value={page.id} />
              <TextField name="title" label="Page title" required defaultValue={page.title} />
              <TextField name="slug" label="Page address" required defaultValue={page.slug} help="yourwebsite.com/this-address" />
              <Checkbox name="published" label="Published (visible on the website)" defaultChecked={page.published} />
              <Checkbox name="showInMenu" label="Show in the main menu and footer" defaultChecked={page.showInMenu} />
              <h3 className="adm-section-title">Search engines</h3>
              <TextField name="metaTitle" label="Meta title" defaultValue={page.metaTitle} max={60} help="The title shown in Google results." />
              <TextArea name="metaDescription" label="Meta description" defaultValue={page.metaDescription} max={160} rows={3} help="The text shown under the title in Google." />
            </ActionForm>
          </section>
          <section className="adm-card">
            <h2>Delete page</h2>
            <p className="adm-card__hint">Removes this page and all its sections permanently.</p>
            <ConfirmForm action={deletePage} confirm={`Delete “${page.title}” permanently?`} hidden={{ id: page.id }}>
              <button className="adm-btn adm-btn--danger" type="submit">
                Delete page
              </button>
            </ConfirmForm>
          </section>
        </aside>
      </div>
    </>
  );
}
