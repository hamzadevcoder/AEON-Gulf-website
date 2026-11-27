import Link from 'next/link';
import { asc } from 'drizzle-orm';
import { requirePermission } from '@/server/auth';
import { isServiceTranslated } from '@/server/content';
import { requireDb, schema } from '@/server/db';
import { groupInfo, groupOrder, servicePath } from '@/content/services';
import { ConfirmForm } from '@/components/admin/Form';
import { togglePublished } from '../../_actions/content';

export const metadata = { title: 'Services' };

export default async function ServicesAdmin({ searchParams }: { searchParams: Promise<{ country?: string; q?: string; deleted?: string }> }) {
  await requirePermission('content.edit', 'page');
  const sp = await searchParams;
  const db = requireDb();
  const [rows, countries] = await Promise.all([
    db
      .select({ id: schema.services.id, country: schema.services.country, slug: schema.services.slug, name: schema.services.name, group: schema.services.group, published: schema.services.published, ar: schema.services.ar, updatedAt: schema.services.updatedAt })
      .from(schema.services)
      .orderBy(asc(schema.services.country), asc(schema.services.sort), asc(schema.services.name)),
    db.select().from(schema.countries).orderBy(asc(schema.countries.sort)),
  ]);
  const country = countries.some((c) => c.slug === sp.country) ? sp.country! : countries[0]?.slug;
  const q = (sp.q ?? '').toLowerCase();
  const list = rows.filter((r) => r.country === country && (!q || r.name.toLowerCase().includes(q)));

  return (
    <>
      <div className="adm-head">
        <div>
          <h1>Services</h1>
          <p>{`${rows.length} service pages across ${countries.length} countries · ${rows.filter((r) => isServiceTranslated(r.ar, r.country, r.slug)).length} have a full Arabic page. Changes go live as soon as you save.`}</p>
        </div>
        <Link className="adm-btn adm-btn--primary" href={`/admin/services/new?country=${country}`}>
          New service
        </Link>
      </div>
      {sp.deleted && <p className="adm-notice adm-notice--ok">Service deleted.</p>}
      <nav className="adm-tabs" aria-label="Country">
        {countries.map((c) => (
          <Link key={c.slug} href={`/admin/services?country=${c.slug}`} aria-current={c.slug === country ? 'true' : undefined}>
            {`${c.name} (${rows.filter((r) => r.country === c.slug).length})`}
          </Link>
        ))}
      </nav>
      <form className="adm-filters" action="/admin/services">
        <input type="hidden" name="country" value={country} />
        <label className="adm-field adm-field--grow">
          <span>Search</span>
          <input type="search" name="q" defaultValue={sp.q ?? ''} placeholder="Service name" />
        </label>
        <button className="adm-btn" type="submit">
          Search
        </button>
      </form>
      {groupOrder.map((g) => {
        const items = list.filter((r) => r.group === g);
        if (!items.length) return null;
        return (
          <section key={g} style={{ marginBottom: 20 }}>
            <h2 style={{ fontSize: 16, margin: '0 0 8px' }}>{groupInfo[g].label}</h2>
            <div className="adm-table-wrap">
              <table className="adm-table adm-table--stack">
                <tbody>
                  {items.map((r) => (
                    <tr key={r.id}>
                      <td style={{ width: '55%' }}>
                        <Link className="adm-rowlink" href={`/admin/services/${r.id}`}>
                          {r.name}
                        </Link>
                        <span className="adm-muted" style={{ display: 'block' }}>
                          {servicePath(r)}
                        </span>
                      </td>
                      <td data-label="Status">
                        <span className={`adm-badge adm-badge--${r.published ? 'on' : 'off'}`}>{r.published ? 'Published' : 'Hidden'}</span>{' '}
                        {isServiceTranslated(r.ar, r.country, r.slug) ? <span className="adm-badge adm-badge--ar">Arabic ✓</span> : <span className="adm-badge">No Arabic yet</span>}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div className="adm-actions" style={{ justifyContent: 'flex-end' }}>
                          <Link className="adm-btn adm-btn--ghost adm-btn--sm" href={`/admin/services/${r.id}`}>
                            Edit
                          </Link>
                          {r.published && (
                            <a className="adm-btn adm-btn--ghost adm-btn--sm" href={servicePath(r)} target="_blank" rel="noreferrer">
                              View ↗
                            </a>
                          )}
                          <ConfirmForm
                            action={togglePublished}
                            confirm={r.published ? 'Hide this service from the website?' : 'Publish this service on the website?'}
                            hidden={{ id: r.id, published: String(!r.published) }}
                          >
                            <button className="adm-btn adm-btn--ghost adm-btn--sm" type="submit">
                              {r.published ? 'Hide' : 'Publish'}
                            </button>
                          </ConfirmForm>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        );
      })}
      {!list.length && <div className="adm-card adm-empty">No services match.</div>}
    </>
  );
}
