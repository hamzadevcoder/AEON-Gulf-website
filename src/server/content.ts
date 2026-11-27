import 'server-only';
import { cache } from 'react';
import { unstable_cache } from 'next/cache';
import { asc, eq } from 'drizzle-orm';
import { db, schema } from './db';
import { blockDefs, type Blocks, type BlockKey } from '@/content/blocks';
import { services as staticServices, groupInfo, groupOrder, type Service, type GroupKey } from '@/content/services';
import { countries as staticCountries, contact as staticContact } from '@/content/site';
import { guideSources as staticGuides, type GuideSource } from '@/content/insights';
import { policies as staticPolicies, type Policy } from '@/content/legal';
import { blocksAr, countriesAr, serviceNamesAr, policiesAr, guidesAr } from '@/content/ar';
import { servicesAr } from '@/content/ar-services';
import { defaultMessages, translate, type Messages } from '@/i18n/dict';
import { getLocale } from '@/i18n/request';
import type { Locale } from '@/i18n/config';
import type { PageSection } from './db/schema';
import { resolveNavigation, type Navigation } from '@/content/navigation';

/** Every cached read is tagged; saving anything in the dashboard calls revalidateTag(CONTENT_TAG). */
export const CONTENT_TAG = 'content';
const REVALIDATE = 3600;

/** Cached across requests (tagged), deduplicated per request, with built-in content when the database is unavailable. */
function cached<T>(key: string, read: () => Promise<T>, fallback: () => T) {
  const fromDb = unstable_cache(read, [key], { tags: [CONTENT_TAG], revalidate: REVALIDATE });
  return cache(async (): Promise<T> => {
    if (!db) return fallback();
    try {
      return await fromDb();
    } catch (err) {
      console.error(`[content] ${key}: database read failed, using built-in content`, err);
      return fallback();
    }
  });
}
type Ar = Record<string, unknown> | null | undefined;
const str = (v: unknown) => (typeof v === 'string' && v.trim() ? v : '');
const arr = <X,>(v: unknown): X[] => (Array.isArray(v) ? (v as X[]) : []);

// ------------------------------------------------------------------ Settings, interface text
export const getSettings = cached(
  'settings',
  async () => {
    const rows = await db!.select().from(schema.settings);
    return Object.fromEntries(rows.map((r) => [r.key, r.value])) as Record<string, unknown>;
  },
  () => ({}) as Record<string, unknown>,
);

/** Interface text for a language: built-in messages plus any overrides saved in the dashboard. */
export async function getMessages(locale: Locale = getLocale()): Promise<Messages> {
  const s = await getSettings();
  const overrides = ((s.ui_text as Record<string, Messages>) ?? {})[locale] ?? {};
  const clean = Object.fromEntries(Object.entries(overrides).filter(([, v]) => typeof v === 'string' && v.trim()));
  return { ...defaultMessages[locale], ...clean };
}

const groupLabel = (m: Messages, g: string, country: string) =>
  translate(m, g === 'pro' ? (country === 'saudi-arabia' ? 'group.gro' : 'group.pro') : `group.${g}`);

// ------------------------------------------------------------------ Countries + contact
export type Country = {
  slug: string; name: string; code: string; line: string; intro: string;
  authorities: string; authorityList: string[]; quickFacts: { label: string; value: string }[];
  office: { detail: string; phone: string | null };
};
type CountryRow = Country & { ar: Ar };

const staticCountryRows = (): CountryRow[] =>
  staticCountries.map((c) => {
    const o = staticContact.offices.find((x) => x.country === c.name);
    return { ...c, office: { detail: o?.detail ?? '', phone: o?.phone ?? null }, ar: null };
  });

const readCountries = cached(
  'countries',
  async (): Promise<CountryRow[]> => {
    const rows = await db!.select().from(schema.countries).orderBy(asc(schema.countries.sort));
    if (!rows.length) return staticCountryRows();
    return rows.map((r) => ({
      slug: r.slug, name: r.name, code: r.code, line: r.line, intro: r.intro, authorities: r.authoritiesSummary,
      authorityList: r.authorities, quickFacts: r.quickFacts, office: r.office, ar: r.ar,
    }));
  },
  staticCountryRows,
);

function localizeCountry(c: CountryRow, locale: Locale): Country {
  const { ar: stored, ...en } = c;
  if (locale !== 'ar') return en;
  const a = (stored ?? {}) as Record<string, unknown>;
  const d = countriesAr[c.slug];
  const list = arr<string>(a.authorityList);
  const facts = arr<{ label: string; value: string }>(a.quickFacts);
  return {
    ...en,
    name: str(a.name) || d?.name || en.name,
    line: str(a.line) || d?.line || en.line,
    intro: str(a.intro) || d?.intro || en.intro,
    authorities: str(a.authorities) || d?.authorities || en.authorities,
    authorityList: list.length ? list : d?.authorityList ?? en.authorityList,
    quickFacts: facts.length ? facts : d?.quickFacts ?? en.quickFacts,
    office: { detail: str(a.officeDetail) || d?.officeDetail || en.office.detail, phone: en.office.phone },
  };
}

export async function getCountries(locale: Locale = getLocale()): Promise<Country[]> {
  return (await readCountries()).map((c) => localizeCountry(c, locale));
}
/** Raw rows including the stored Arabic, for the dashboard. */
export const getCountryRows = readCountries;

export type SiteContact = { email: string; phone: string; phoneHref: string };
const defaultContact: SiteContact = { email: staticContact.email, phone: staticContact.phone, phoneHref: staticContact.phoneHref };

/** Site contact details plus each country's office, in the current language. */
export async function getContact(locale: Locale = getLocale()) {
  const [settings, list] = await Promise.all([getSettings(), getCountries(locale)]);
  const c = { ...defaultContact, ...((settings.contact as Partial<SiteContact>) ?? {}) };
  c.phoneHref = `tel:${c.phone.replace(/[^\d+]/g, '')}`;
  return { ...c, offices: list.map((x) => ({ country: x.name, slug: x.slug, detail: x.office.detail, phone: x.office.phone })) };
}

/** Header, menu and footer content in the current language (dashboard values over the built-in defaults). */
export async function getNavigation(locale: Locale = getLocale()) {
  const s = await getSettings();
  return resolveNavigation(s.navigation as Partial<Navigation> | undefined, locale);
}

export async function getImageOverrides() {
  const s = await getSettings();
  return (s.image_slots as Record<string, { src: string; alt?: string }>) ?? {};
}

// ------------------------------------------------------------------ Page sections (blocks)
const getBlocks = cached(
  'blocks',
  async () => {
    const rows = await db!.select().from(schema.contentBlocks);
    return Object.fromEntries(rows.map((r) => [r.key, r.value])) as Record<string, Record<string, unknown>>;
  },
  () => ({}) as Record<string, Record<string, unknown>>,
);

/** Stored values merged over the defaults. Arabic is stored under "ar:<key>" and falls back to the built-in Arabic text. */
export async function getBlock<K extends BlockKey>(key: K, locale: Locale = getLocale()): Promise<Blocks[K]> {
  const def = blockDefs.find((b) => b.key === key)!;
  const base: Record<string, unknown> = locale === 'ar' ? { ...def.defaults, ...(blocksAr[key] ?? {}) } : { ...def.defaults };
  const stored = (await getBlocks())[locale === 'ar' ? `ar:${key}` : key] ?? {};
  for (const [k, v] of Object.entries(stored)) if (v !== undefined && v !== null) base[k] = v;
  return base as Blocks[K];
}

// ------------------------------------------------------------------ Services
type ServiceRow = Service & { ar: Ar };

export function rowToService(r: typeof schema.services.$inferSelect, countryName: string): ServiceRow {
  return {
    country: r.country, countryName, group: r.group, groupLabel: r.groupLabel, slug: r.slug, name: r.name,
    metaTitle: r.metaTitle, metaDescription: r.metaDescription, keywords: r.keywords,
    listing: { heading: r.name, body: r.listingBody },
    hero: { heading: r.heroHeading, subtitle: r.heroSubtitle },
    why: { heading: r.whyHeading, description: r.whyDescription },
    benefits: r.benefits, steps: { heading: r.stepsHeading, items: r.steps }, faqs: r.faqs,
    cta: { heading: r.ctaHeading, description: r.ctaDescription, text: r.ctaText }, ar: r.ar,
  };
}

const readServices = cached(
  'services',
  async (): Promise<ServiceRow[]> => {
    const [rows, list] = await Promise.all([
      db!.select().from(schema.services).where(eq(schema.services.published, true)).orderBy(asc(schema.services.country), asc(schema.services.sort)),
      readCountries(),
    ]);
    if (!rows.length) return staticServices.map((s) => ({ ...s, ar: null }));
    const names = Object.fromEntries(list.map((c) => [c.slug, c.name]));
    return rows.map((r) => rowToService(r, names[r.country] ?? r.country));
  },
  () => staticServices.map((s) => ({ ...s, ar: null })),
);

const hasArabicPage = (ar: Ar) => Boolean(ar && str(ar.heroHeading) && str(ar.whyDescription));

/** The Arabic for a service: what was saved in the dashboard, else the built-in Arabic (if the service has one). */
export function effectiveServiceAr(country: string, slug: string, stored: Ar): Record<string, unknown> | null {
  if (hasArabicPage(stored)) return stored!;
  const builtIn = servicesAr[`${country}/${slug}`];
  return builtIn ? (builtIn as unknown as Record<string, unknown>) : (stored ?? null);
}

/** An Arabic service counts as translated once its page heading and overview have been written. */
export const isServiceTranslated = (ar: Ar, country = '', slug = '') => hasArabicPage(effectiveServiceAr(country, slug, ar));

function localizeService(s: ServiceRow, locale: Locale, m: Messages, countryNames: Record<string, string>): Service {
  const { ar: stored, ...en } = s;
  if (locale !== 'ar') return { ...en, translated: true };
  const eff = effectiveServiceAr(s.country, s.slug, stored);
  const a = (eff ?? {}) as Record<string, unknown>;
  const countryName = countryNames[s.country] ?? en.countryName;
  const name = str(a.name) || serviceNamesAr[s.slug] || en.name;
  const translated = hasArabicPage(eff);
  const title = translate(m, 'svc.titleIn', { service: name, country: countryName });
  return {
    ...en,
    translated,
    name,
    countryName,
    groupLabel: groupLabel(m, s.group, s.country),
    metaTitle: str(a.metaTitle) || title,
    metaDescription: str(a.metaDescription) || `${title}. ${translate(m, 'svc.arPendingText')}`,
    keywords: arr<string>(a.keywords),
    listing: { heading: name, body: str(a.listingBody) },
    hero: { heading: str(a.heroHeading) || title, subtitle: str(a.heroSubtitle) },
    why: { heading: str(a.whyHeading), description: str(a.whyDescription) },
    benefits: arr(a.benefits),
    steps: { heading: str(a.stepsHeading), items: arr(a.steps) },
    faqs: arr(a.faqs),
    cta: { heading: str(a.ctaHeading), description: str(a.ctaDescription), text: str(a.ctaText) || translate(m, 'common.getQuote') },
  };
}

export async function getServices(locale: Locale = getLocale()): Promise<Service[]> {
  const [rows, m, countries] = await Promise.all([readServices(), getMessages(locale), getCountries(locale)]);
  const names = Object.fromEntries(countries.map((c) => [c.slug, c.name]));
  return rows.map((s) => localizeService(s, locale, m, names));
}

// ------------------------------------------------------------------ Guides
export type Guide = GuideSource & { related: Service; readMinutes: number };
type GuideRow = GuideSource & { ar: Ar };

const readGuides = cached(
  'guides',
  async (): Promise<GuideRow[]> => {
    const rows = await db!.select().from(schema.guides).where(eq(schema.guides.published, true)).orderBy(asc(schema.guides.sort));
    if (!rows.length) return staticGuides.map((g) => ({ ...g, ar: null }));
    return rows.map((r) => ({
      slug: r.slug, title: r.title, excerpt: r.excerpt, metaTitle: r.metaTitle, metaDescription: r.metaDescription,
      country: r.country as GuideSource['country'], countryName: r.country, category: r.category,
      image: r.image as GuideSource['image'], service: r.service, intro: r.intro, ar: r.ar,
    }));
  },
  () => staticGuides.map((g) => ({ ...g, ar: null })),
);

/**
 * Guides with their related service resolved. On the Arabic site a guide appears only when both the guide
 * and its related service have Arabic text, so a page is never half English.
 */
export async function getGuides(locale: Locale = getLocale()): Promise<Guide[]> {
  const [rows, list, countries] = await Promise.all([readGuides(), getServices(locale), getCountries(locale)]);
  const names = Object.fromEntries(countries.map((c) => [c.slug, c.name]));
  return rows.flatMap((row) => {
    const { ar: stored, ...g } = row;
    const related = list.find((s) => s.country === g.country && s.slug === g.service);
    if (!related) return [];
    let view: GuideSource = { ...g, countryName: names[g.country] ?? g.countryName };
    if (locale === 'ar') {
      const a = (stored ?? guidesAr[g.slug] ?? null) as Record<string, unknown> | null;
      if (!a || !related.translated) return [];
      view = {
        ...view,
        title: str(a.title) || g.title, excerpt: str(a.excerpt) || g.excerpt, metaTitle: str(a.metaTitle) || str(a.title) || g.metaTitle,
        metaDescription: str(a.metaDescription) || str(a.excerpt) || g.metaDescription, category: str(a.category) || 'دليل',
        intro: arr<string>(a.intro).length ? arr<string>(a.intro) : g.intro,
      };
    }
    const words = [...view.intro, related.why.description, ...related.faqs.map((f) => f.q + ' ' + f.a), ...related.steps.items.map((s) => s.text)]
      .join(' ')
      .split(/\s+/).length;
    return [{ ...view, related, readMinutes: Math.max(2, Math.round(words / 220)) }];
  });
}
export const getGuideRows = readGuides;

// ------------------------------------------------------------------ Legal
const readPolicies = cached(
  'legal',
  async (): Promise<Record<string, Policy & { ar: Ar }>> => {
    const rows = await db!.select().from(schema.legalPages);
    const base = Object.fromEntries(Object.entries(staticPolicies).map(([k, v]) => [k, { ...v, ar: null as Ar }]));
    for (const r of rows) base[r.slug] = { slug: r.slug, title: r.title, effective: r.effective, intro: r.intro, sections: r.sections, ar: r.ar } as Policy & { ar: Ar };
    return base;
  },
  () => Object.fromEntries(Object.entries(staticPolicies).map(([k, v]) => [k, { ...v, ar: null as Ar }])),
);

export async function getPolicies(locale: Locale = getLocale()): Promise<Record<string, Policy>> {
  const rows = await readPolicies();
  return Object.fromEntries(
    Object.entries(rows).map(([k, { ar: stored, ...en }]) => {
      if (locale !== 'ar') return [k, en];
      const a = stored as unknown as Policy | null;
      return [k, a?.title ? { ...a, slug: k } : policiesAr[k] ?? en];
    }),
  );
}
export const getPolicyRows = readPolicies;

/** Country and service choices for the quote form, in the current language. */
export async function getQuoteOptions(locale: Locale = getLocale()) {
  const [list, countryList, m] = await Promise.all([getServices(locale), getCountries(locale), getMessages(locale)]);
  return {
    countries: countryList.map(({ slug, name }) => ({ slug, name })),
    groups: groupOrder.map((g: GroupKey) => ({
      label: locale === 'ar' ? translate(m, g === 'pro' ? 'group.proGro' : `group.${g}`) : groupInfo[g].label,
      services: list.filter((s) => s.group === g).map((s) => ({ name: s.name, country: s.country })),
    })),
  };
}

// ------------------------------------------------------------------ Pages built in the dashboard
export type CustomPage = { id: string; slug: string; title: string; metaTitle: string; metaDescription: string; showInMenu: boolean; sections: PageSection[]; translated: boolean };
type PageRow = Omit<CustomPage, 'translated'> & { ar: Ar };

const readPages = cached(
  'pages',
  async (): Promise<PageRow[]> => {
    const rows = await db!.select().from(schema.pages).where(eq(schema.pages.published, true)).orderBy(asc(schema.pages.createdAt));
    return rows.map((r) => ({ id: r.id, slug: r.slug, title: r.title, metaTitle: r.metaTitle, metaDescription: r.metaDescription, showInMenu: r.showInMenu, sections: r.sections, ar: r.ar }));
  },
  () => [] as PageRow[],
);

export async function getPages(locale: Locale = getLocale()): Promise<CustomPage[]> {
  return (await readPages()).map(({ ar: stored, ...p }) => {
    if (locale !== 'ar') return { ...p, translated: true };
    const a = (stored ?? {}) as Record<string, unknown>;
    return {
      ...p,
      title: str(a.title) || p.title,
      metaTitle: str(a.metaTitle) || str(a.title) || p.metaTitle,
      metaDescription: str(a.metaDescription) || p.metaDescription,
      sections: p.sections.map((s) => ({ ...s, data: s.dataAr ?? s.data })),
      translated: Boolean(str(a.title)),
    };
  });
}

export async function getPage(slug: string, locale: Locale = getLocale()) {
  return (await getPages(locale)).find((p) => p.slug === slug) ?? null;
}
