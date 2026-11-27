import Link from 'next/link';
import { eq } from 'drizzle-orm';
import { requirePermission } from '@/server/auth';
import { requireDb, schema } from '@/server/db';
import { getBlock, getContact } from '@/server/content';
import { defaultNavigation, type Navigation } from '@/content/navigation';
import { ActionForm, Checkbox, ConfirmForm, TextArea, TextField } from '@/components/admin/Form';
import { ListEditor } from '@/components/admin/ListEditor';
import { ArabicArea } from '@/components/admin/LangTabs';
import { SectionCard } from '@/components/admin/SectionCard';
import { fmtDate } from '@/lib/format';
import { saveSiteSection, resetSiteSection } from '../../_actions/site';
import { saveContactSettings } from '../../_actions/settings';

export const metadata = { title: 'Header & Footer' };
export const dynamic = 'force-dynamic';

const linkFields = [
  { name: 'label', label: 'Name (English)', type: 'text' as const },
  { name: 'labelAr', label: 'Name (Arabic)', type: 'text' as const, rtl: true },
  { name: 'href', label: 'Link', type: 'text' as const },
];

function Reset({ section }: { section: string }) {
  return (
    <div style={{ marginTop: 14 }}>
      <ConfirmForm action={resetSiteSection} confirm="Go back to the original text and links for this section? Your changes will be lost." hidden={{ section }}>
        <button className="adm-btn adm-btn--ghost adm-btn--sm" type="submit">
          Restore original
        </button>
      </ConfirmForm>
    </div>
  );
}

export default async function SitePage({ searchParams }: { searchParams: Promise<{ open?: string }> }) {
  await requirePermission('content.edit', 'page');
  const open = (await searchParams).open;
  const d = requireDb();
  const [[row], contact, footerEn, footerAr] = await Promise.all([
    d.select().from(schema.settings).where(eq(schema.settings.key, 'navigation')),
    getContact(),
    getBlock('footer', 'en'),
    getBlock('footer', 'ar'),
  ]);
  const stored = (row?.value ?? {}) as Partial<Navigation>;
  const nav: Navigation = {
    header: { ...defaultNavigation.header, ...(stored.header ?? {}) },
    menu: stored.menu ?? defaultNavigation.menu,
    popular: stored.popular ?? defaultNavigation.popular,
    footer: { ...defaultNavigation.footer, ...(stored.footer ?? {}) },
  };
  const edited = (k: keyof Navigation) => Boolean(stored[k]);
  const badge = (on: boolean) => (on ? <span className="adm-badge adm-badge--responded">Edited</span> : <span className="adm-badge">Original</span>);

  return (
    <>
      <div className="adm-head">
        <div>
          <h1>Header & Footer</h1>
          <p>
            Everything visitors see at the top of every page, in the open menu and at the bottom, in English and Arabic. Changes go live as soon as you
            save. {row ? `Last changed ${fmtDate(row.updatedAt)}.` : ''}
          </p>
        </div>
        <a className="adm-btn adm-btn--ghost" href="/" target="_blank" rel="noreferrer">
          View website ↗
        </a>
      </div>
      <p className="adm-hint">Click a section to open and edit it. Pages you create with “Show in the main menu” are added to the menu and footer automatically.</p>

      <div className="adm-seclist">
        <SectionCard id="s-header" icon="▭" title="Header" summary="The buttons at the top of every page" badge={badge(edited('header'))} open={open === 'header'}>
          <ActionForm action={saveSiteSection} sticky submitLabel="Save header">
            <input type="hidden" name="section" value="header" />
            <Checkbox name="showCta" label="Show the call-to-action button" defaultChecked={nav.header.showCta} />
            <div className="adm-row adm-row--3">
              <TextField name="ctaLabel" label="Button text (English)" defaultValue={nav.header.ctaLabel} />
              <ArabicArea>
                <TextField name="ctaLabelAr" label="Button text (Arabic)" defaultValue={nav.header.ctaLabelAr} />
              </ArabicArea>
              <TextField name="ctaHref" label="Button link" defaultValue={nav.header.ctaHref} help="For example /quote. On a country page the quote link picks that country automatically." />
            </div>
            <div className="adm-checks">
              <Checkbox name="showCountries" label="Show the country dropdown" defaultChecked={nav.header.showCountries} />
              <Checkbox name="showLanguage" label="Show the language dropdown" defaultChecked={nav.header.showLanguage} />
            </div>
          </ActionForm>
          {edited('header') && <Reset section="header" />}
        </SectionCard>

        <SectionCard id="s-menu" icon="≡" title="Open menu" summary="The main links and the “Popular services” list in the menu panel" badge={badge(edited('menu') || edited('popular'))} open={open === 'menu'}>
          <ActionForm action={saveSiteSection} sticky submitLabel="Save menu">
            <input type="hidden" name="section" value="menu" />
            <ListEditor name="menu" label="Main links" itemLabel="Link" max={10} initial={nav.menu} fields={linkFields} help="Shown in this order. Use the arrows to reorder." />
            <ListEditor
              name="popular"
              label="Popular services (bottom of the menu)"
              itemLabel="Link"
              max={8}
              initial={nav.popular}
              fields={linkFields}
              help="Use {country} in a link, for example /{country}/services/annual-compliance, to open the service for the country the visitor is on."
            />
          </ActionForm>
          {(edited('menu') || edited('popular')) && <Reset section="menu" />}
        </SectionCard>

        <SectionCard id="s-footer" icon="▬" title="Footer" summary="Description, links, legal links, social links and copyright" badge={badge(edited('footer'))} open={open === 'footer'}>
          <ActionForm action={saveSiteSection} sticky submitLabel="Save footer">
            <input type="hidden" name="section" value="footer" />
            <div className="adm-row">
              <TextArea name="blurb" label="Company description (English)" defaultValue={footerEn.blurb} rows={3} />
              <ArabicArea>
                <TextArea name="blurbAr" label="Company description (Arabic)" defaultValue={footerAr.blurb} rows={3} />
              </ArabicArea>
            </div>
            <div className="adm-row">
              <TextField name="tagline" label="Tagline (English)" defaultValue={footerEn.tagline} />
              <ArabicArea>
                <TextField name="taglineAr" label="Tagline (Arabic)" defaultValue={footerAr.tagline} />
              </ArabicArea>
            </div>
            <div className="adm-row">
              <TextField name="newsletterLabel" label="Newsletter text (English)" defaultValue={footerEn.newsletterLabel} />
              <ArabicArea>
                <TextField name="newsletterLabelAr" label="Newsletter text (Arabic)" defaultValue={footerAr.newsletterLabel} />
              </ArabicArea>
            </div>
            <div className="adm-row">
              <TextField name="copyright" label="Copyright line (English)" defaultValue={nav.footer.copyright} help="{year} becomes the current year." />
              <ArabicArea>
                <TextField name="copyrightAr" label="Copyright line (Arabic)" defaultValue={nav.footer.copyrightAr} />
              </ArabicArea>
            </div>
            <div className="adm-checks">
              <Checkbox name="showMarkets" label="Show the countries list (Markets)" defaultChecked={nav.footer.showMarkets} />
              <Checkbox name="showNewsletter" label="Show the newsletter sign-up" defaultChecked={nav.footer.showNewsletter} />
            </div>
            <ListEditor name="links" label="Footer links" itemLabel="Link" max={10} initial={nav.footer.links} fields={linkFields} />
            <ListEditor name="legal" label="Legal links (bottom row)" itemLabel="Link" max={6} initial={nav.footer.legal} fields={linkFields} />
            <ListEditor name="social" label="Social media links (optional)" itemLabel="Account" max={8} initial={nav.footer.social} fields={linkFields} help="Use the full address, for example https://www.linkedin.com/company/aeon-gulf" />
          </ActionForm>
          {(edited('footer')) && <Reset section="footer" />}
        </SectionCard>

        <SectionCard id="s-contact" icon="✉" title="Contact details" summary={`${contact.email} · ${contact.phone}`} open={open === 'contact'}>
          <ActionForm action={saveContactSettings} sticky submitLabel="Save contact details">
            <p className="adm-hint">Shown in the open menu, footer, contact page and quote page. Each country’s office is edited under <Link className="adm-link" href="/admin/countries">Countries</Link>.</p>
            <div className="adm-row">
              <TextField name="email" label="Email" type="email" defaultValue={contact.email} required />
              <TextField name="phone" label="Phone" defaultValue={contact.phone} required />
            </div>
          </ActionForm>
        </SectionCard>
      </div>

      <section className="adm-card">
        <h2>Other site text</h2>
        <ul className="adm-linklist">
          <li>
            <Link className="adm-link" href="/admin/translations">
              Buttons, labels and form messages: Interface text
            </Link>
          </li>
          <li>
            <Link className="adm-link" href="/admin/settings">
              Who receives inquiry emails: Settings & emails
            </Link>
          </li>
        </ul>
      </section>
    </>
  );
}
