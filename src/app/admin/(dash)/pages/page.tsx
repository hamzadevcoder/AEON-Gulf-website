import Link from 'next/link';
import { desc, sql } from 'drizzle-orm';
import { requirePermission } from '@/server/auth';
import { requireDb, schema } from '@/server/db';
import { blockDefs, builtinPages } from '@/content/blocks';
import { fmtDate } from '@/lib/format';

export const metadata = { title: 'Pages' };
export const dynamic = 'force-dynamic';

export default async function PagesHub({ searchParams }: { searchParams: Promise<{ deleted?: string }> }) {
  await requirePermission('content.edit', 'page');
  const db = requireDb();
  const [edited, custom] = await Promise.all([
    db.select({ key: schema.contentBlocks.key }).from(schema.contentBlocks),
    db
      .select({ id: schema.pages.id, slug: schema.pages.slug, title: schema.pages.title, published: schema.pages.published, count: sql<number>`jsonb_array_length(${schema.pages.sections})`, updatedAt: schema.pages.updatedAt })
      .from(schema.pages)
      .orderBy(desc(schema.pages.updatedAt)),
  ]);
  const editedKeys = new Set(edited.map((e) => e.key));
  return (
    <>
      <div className="adm-head">
        <div>
          <h1>Pages</h1>
          <p>Click a page to edit what is on it. Create new pages from ready-made sections. Every page has an English and an Arabic version: use the language tabs inside each editor.</p>
        </div>
        <Link className="adm-btn adm-btn--primary" href="/admin/pages/new">
          + New page
        </Link>
      </div>
      {(await searchParams).deleted && <p className="adm-notice adm-notice--ok">Page deleted.</p>}

      <h2 className="adm-group-title">Your pages</h2>
      {custom.length ? (
        <div className="adm-pagegrid">
          {custom.map((p) => (
            <Link key={p.id} href={`/admin/pages/custom/${p.id}`} className="adm-pagecard">
              <span className="adm-pagecard__top">
                <strong>{p.title}</strong>
                <span className={`adm-badge adm-badge--${p.published ? 'on' : 'off'}`}>{p.published ? 'Live' : 'Draft'}</span>
              </span>
              <span className="adm-pagecard__url">{`/${p.slug}`}</span>
              <span className="adm-muted">{`${p.count} section${p.count === 1 ? '' : 's'} · edited ${fmtDate(p.updatedAt)}`}</span>
            </Link>
          ))}
        </div>
      ) : (
        <div className="adm-card adm-empty">
          <p style={{ margin: '0 0 12px' }}>You have not created any pages yet.</p>
          <Link className="adm-btn adm-btn--primary" href="/admin/pages/new">
            Create your first page
          </Link>
        </div>
      )}

      <h2 className="adm-group-title">Main pages</h2>
      <div className="adm-pagegrid">
        {builtinPages.map((p) => {
          const blocks = blockDefs.filter((b) => b.page === p.group);
          const changed = blocks.filter((b) => editedKeys.has(b.key)).length;
          return (
            <Link key={p.slug} href={`/admin/pages/${p.slug}`} className="adm-pagecard">
              <span className="adm-pagecard__top">
                <strong>{p.name}</strong>
              </span>
              <span className="adm-pagecard__url">{p.url}</span>
              <span className="adm-pagecard__desc">{p.description}</span>
              <span className="adm-muted">{`${blocks.length} section${blocks.length === 1 ? '' : 's'}${changed ? ` · ${changed} edited` : ''}`}</span>
            </Link>
          );
        })}
      </div>

      <h2 className="adm-group-title">More content</h2>
      <div className="adm-pagegrid">
        {[
          { href: '/admin/site', name: 'Header & Footer', desc: 'The top bar, the open menu and the footer, in English and Arabic.' },
          { href: '/admin/services', name: 'Service pages', desc: 'All 96 service pages: text, FAQs, steps and SEO.' },
          { href: '/admin/countries', name: 'Countries', desc: 'Kuwait, Qatar and Saudi Arabia: introductions, facts, authorities and offices.' },
          { href: '/admin/guides', name: 'Guides', desc: 'The Insights articles.' },
          { href: '/admin/legal', name: 'Legal pages', desc: 'Privacy policy, terms and conditions, cookies policy.' },
        ].map((c) => (
          <Link key={c.href} href={c.href} className="adm-pagecard">
            <span className="adm-pagecard__top">
              <strong>{c.name}</strong>
            </span>
            <span className="adm-pagecard__desc">{c.desc}</span>
          </Link>
        ))}
      </div>
    </>
  );
}
