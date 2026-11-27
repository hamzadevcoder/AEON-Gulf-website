import Link from 'next/link';
import { LangTabs, ArabicArea } from '@/components/admin/LangTabs';
import { notFound } from 'next/navigation';
import { requirePermission } from '@/server/auth';
import { requireDb, schema } from '@/server/db';
import { blockDefs, builtinPage, type BlockKey } from '@/content/blocks';
import { getBlock } from '@/server/content';
import { imageOptions } from '@/server/admin-data';
import { fmtDate } from '@/lib/format';
import { ActionForm, ConfirmForm } from '@/components/admin/Form';
import { FieldsEditor } from '@/components/admin/FieldsEditor';
import { SectionCard } from '@/components/admin/SectionCard';
import { resetBlock, saveBlock } from '../../../_actions/content';

export const metadata = { title: 'Edit page' };
export const dynamic = 'force-dynamic';

const related: Record<string, { href: string; label: string }[]> = {
  home: [{ href: '/admin/countries', label: 'Country cards: Countries' }, { href: '/admin/guides', label: 'Guide cards: Guides' }, { href: '/admin/media', label: 'Photos: Images' }],
  countries: [{ href: '/admin/countries', label: 'Each country’s details: Countries' }, { href: '/admin/services', label: 'Services listed on each country page: Services' }],
  services: [{ href: '/admin/services', label: 'Individual service pages: Services' }],
  contact: [{ href: '/admin/settings', label: 'Email, phone and offices: Settings & emails' }],
  quote: [{ href: '/admin/settings', label: 'Where quote emails go: Settings & emails' }],
};

export default async function EditBuiltinPage({ params, searchParams }: { params: Promise<{ builtin: string }>; searchParams: Promise<{ open?: string; reset?: string; lang?: string }> }) {
  await requirePermission('content.edit', 'page');
  const { builtin } = await params;
  const page = builtinPage(builtin);
  if (!page) notFound();
  const sp = await searchParams;
  const lang = sp.lang === 'ar' ? 'ar' : 'en';
  const k = (key: string) => (lang === 'ar' ? `ar:${key}` : key);
  const blocks = blockDefs.filter((b) => b.page === page.group);
  const [options, rows] = await Promise.all([imageOptions(), requireDb().select().from(schema.contentBlocks)]);
  const editedAt = Object.fromEntries(rows.map((r) => [r.key, r.updatedAt]));
  const values = await Promise.all(blocks.map((b) => getBlock(b.key as BlockKey, lang) as Promise<Record<string, unknown>>));

  return (
    <>
      <div className="adm-head">
        <div>
          <nav className="adm-crumbs">
            <Link href="/admin/pages">Pages</Link> / <span>{page.name}</span>
          </nav>
          <h1>{page.name}</h1>
          <p>{page.description}</p>
        </div>
        <a className="adm-btn adm-btn--ghost" href={lang === 'ar' ? `/ar${page.url === '/' ? '' : page.url}` : page.url} target="_blank" rel="noreferrer">
          View page ↗
        </a>
      </div>
      {sp.reset && <p className="adm-notice adm-notice--ok">Original text restored.</p>}
      <LangTabs href={`/admin/pages/${builtin}`} lang={lang} />
      {lang === 'ar' && <p className="adm-hint">You are editing the Arabic page (yourwebsite.com/ar). Each section starts with the built-in Arabic text.</p>}
      <p className="adm-hint">Click a section to open and edit it. Each section saves on its own and goes live straight away.</p>
      <div className="adm-seclist">
        {blocks.map((b, i) => (
          <SectionCard
            key={b.key}
            id={`s-${b.key}`}
            icon={String(i + 1)}
            title={b.title}
            summary={b.description}
            open={sp.open === b.key || blocks.length === 1}
            badge={editedAt[k(b.key)] ? <span className="adm-badge adm-badge--responded">{`Edited ${fmtDate(editedAt[k(b.key)])}`}</span> : <span className="adm-badge">Original</span>}
          >
            <ActionForm action={saveBlock} sticky submitLabel="Save section">
              <input type="hidden" name="key" value={b.key} />
              <input type="hidden" name="lang" value={lang} />
              {lang === 'ar' ? (
                <ArabicArea>
                  <FieldsEditor fields={b.fields} values={values[i]} imageOptions={options} />
                </ArabicArea>
              ) : (
                <FieldsEditor fields={b.fields} values={values[i]} imageOptions={options} />
              )}
            </ActionForm>
            {editedAt[k(b.key)] && (
              <div style={{ marginTop: 14 }}>
                <ConfirmForm action={resetBlock} confirm="Restore the original text for this section? Your edits will be lost." hidden={{ key: b.key, lang }}>
                  <button className="adm-btn adm-btn--ghost adm-btn--sm" type="submit">
                    Restore original text
                  </button>
                </ConfirmForm>
              </div>
            )}
          </SectionCard>
        ))}
      </div>
      {related[builtin] && (
        <section className="adm-card">
          <h2>Also on this page</h2>
          <ul className="adm-linklist">
            {related[builtin].map((l) => (
              <li key={l.href}>
                <Link className="adm-link" href={l.href}>
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  );
}
