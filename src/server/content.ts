import 'server-only';
import { cache } from 'react';
import { unstable_cache } from 'next/cache';
import { asc, eq } from 'drizzle-orm';
import { db, schema } from './db';
import { blockDefs, type Blocks, type BlockKey } from '@/content/blocks';
import { services as staticServices, type Service } from '@/content/services';
import { countries as staticCountries, contact as staticContact } from '@/content/site';
import { guideSources as staticGuides, type GuideSource } from '@/content/insights';
import { policies as staticPolicies, type Policy } from '@/content/legal';
import type { PageSection } from './db/schema';

/** Every cached read is tagged; saving anything in the dashboard calls revalidateTag(CONTENT_TAG). */
export const CONTENT_TAG = 'content';
const REVALIDATE = 3600; // safety net: refresh at least hourly even without an edit

/**
 * Wrap a database read: cached across requests (tagged), deduplicated within a request, and falling
 * back to the built-in content when there is no database or it cannot be reached.
 */
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

// ------------------------------------------------------------------ Countries + contact
export type Country = {
  slug: string;
  name: string;
  code: string;
  line: string;
  intro: string;
  authorities: string; // one-line summary for cards
  authorityList: string[];
  quickFacts: { label: string; value: string }[];
  office: { detail: string; phone: string | null };
};

const staticCountryList = (): Country[] =>
  staticCountries.map((c) => {
    const o = staticContact.offices.find((x) => x.country === c.name);
    return { ...c, office: { detail: o?.detail ?? '', phone: o?.phone ?? null } };
  });

export const getCountries = cached(
  'countries',
  async (): Promise<Country[]> => {
    const rows = await db!.select().from(schema.countries).orderBy(asc(schema.countries.sort));
    if (!rows.length) return staticCountryList();
    return rows.map((r) => ({
      slug: r.slug, name: r.name, code: r.code, line: r.line, intro: r.intro, authorities: r.authoritiesSummary,
      authorityList: r.authorities, quickFacts: r.quickFacts, office: r.office,
    }));
  },
  staticCountryList,
);

export type SiteContact = { email: string; phone: string; phoneHref: string };
const defaultContact: SiteContact = { email: staticContact.email, phone: staticContact.phone, phoneHref: staticContact.phoneHref };

export const getSettings = cached(
  'settings',
  async () => {
    const rows = await db!.select().from(schema.settings);
    return Object.fromEntries(rows.map((r) => [r.key, r.value])) as Record<string, unknown>;
  },
  () => ({}) as Record<string, unknown>,
);

/** Site contact details plus each country's office, in the shape the components already use. */
export async function getContact() {
  const [settings, list] = await Promise.all([getSettings(), getCountries()]);
  const c = { ...defaultContact, ...((settings.contact as Partial<SiteContact>) ?? {}) };
  c.phoneHref = `tel:${c.phone.replace(/[^\d+]/g, '')}`;
  return { ...c, offices: list.map((x) => ({ country: x.name, slug: x.slug, detail: x.office.detail, phone: x.office.phone })) };
}

/** Admin-chosen replacements for image slots: { slotKey: { src, alt } }. */
export async function getImageOverrides() {
  const s = await getSettings();
  return (s.image_slots as Record<string, { src: string; alt?: string }>) ?? {};
}

// ------------------------------------------------------------------ Blocks
export const getBlocks = cached(
  'blocks',
  async () => {
    const rows = await db!.select().from(schema.contentBlocks);
    return Object.fromEntries(rows.map((r) => [r.key, r.value])) as Record<string, Record<string, unknown>>;
  },
  () => ({}) as Record<string, Record<string, unknown>>,
);

/** A block with stored values merged over its defaults (new fields fall back to the default). */
export async function getBlock<K extends BlockKey>(key: K): Promise<Blocks[K]> {
  const def = blockDefs.find((b) => b.key === key)!;
  const stored = (await getBlocks())[key] ?? {};
  const merged: Record<string, unknown> = { ...def.defaults };
  for (const [k, v] of Object.entries(stored)) if (v !== undefined && v !== null) merged[k] = v;
  return merged as Blocks[K];
}

// ------------------------------------------------------------------ Services
export function rowToService(r: typeof schema.services.$inferSelect, countryName: string): Service {
  return {
    country: r.country, countryName, group: r.group, groupLabel: r.groupLabel, slug: r.slug, name: r.name,
    metaTitle: r.metaTitle, metaDescription: r.metaDescription, keywords: r.keywords,
    listing: { heading: r.name, body: r.listingBody },
    hero: { heading: r.heroHeading, subtitle: r.heroSubtitle },
    why: { heading: r.whyHeading, description: r.whyDescription },
    benefits: r.benefits, steps: { heading: r.stepsHeading, items: r.steps }, faqs: r.faqs,
    cta: { heading: r.ctaHeading, description: r.ctaDescription, text: r.ctaText },
  };
}

export const getServices = cached(
  'services',
  async (): Promise<Service[]> => {
    const [rows, list] = await Promise.all([
      db!.select().from(schema.services).where(eq(schema.services.published, true)).orderBy(asc(schema.services.country), asc(schema.services.sort)),
      getCountries(),
    ]);
    if (!rows.length) return staticServices;
    const names = Object.fromEntries(list.map((c) => [c.slug, c.name]));
    return rows.map((r) => rowToService(r, names[r.country] ?? r.country));
  },
  () => staticServices,
);

// ------------------------------------------------------------------ Guides
export type Guide = GuideSource & { related: Service; readMinutes: number };

export const getGuideSources = cached(
  'guides',
  async (): Promise<GuideSource[]> => {
    const [rows, list] = await Promise.all([
      db!.select().from(schema.guides).where(eq(schema.guides.published, true)).orderBy(asc(schema.guides.sort)),
      getCountries(),
    ]);
    if (!rows.length) return staticGuides;
    const names = Object.fromEntries(list.map((c) => [c.slug, c.name]));
    return rows.map((r) => ({
      slug: r.slug, title: r.title, excerpt: r.excerpt, metaTitle: r.metaTitle, metaDescription: r.metaDescription,
      country: r.country as GuideSource['country'], countryName: names[r.country] ?? r.country, category: r.category,
      image: r.image as GuideSource['image'], service: r.service, intro: r.intro,
    }));
  },
  () => staticGuides,
);

/** Guides with their related service resolved (guides whose service is missing or unpublished are skipped). */
export async function getGuides(): Promise<Guide[]> {
  const [sources, list] = await Promise.all([getGuideSources(), getServices()]);
  return sources.flatMap((g) => {
    const related = list.find((s) => s.country === g.country && s.slug === g.service);
    if (!related) return [];
    const words = [...g.intro, related.why.description, ...related.faqs.map((f) => f.q + ' ' + f.a), ...related.steps.items.map((s) => s.text)]
      .join(' ')
      .split(/\s+/).length;
    return [{ ...g, related, readMinutes: Math.max(2, Math.round(words / 220)) }];
  });
}

// ------------------------------------------------------------------ Legal
export const getPolicies = cached(
  'legal',
  async (): Promise<Record<string, Policy>> => {
    const rows = await db!.select().from(schema.legalPages);
    if (!rows.length) return staticPolicies;
    return { ...staticPolicies, ...Object.fromEntries(rows.map((r) => [r.slug, { slug: r.slug, title: r.title, effective: r.effective, intro: r.intro, sections: r.sections } as Policy])) };
  },
  () => staticPolicies,
);

/** Country and service choices for the quote form. */
export async function getQuoteOptions() {
  const { groupOrder, groupInfo } = await import('@/content/services');
  const [list, countryList] = await Promise.all([getServices(), getCountries()]);
  return {
    countries: countryList.map(({ slug, name }) => ({ slug, name })),
    groups: groupOrder.map((g) => ({ label: groupInfo[g].label, services: list.filter((s) => s.group === g).map((s) => ({ name: s.name, country: s.country })) })),
  };
}

// ------------------------------------------------------------------ Pages built in the dashboard
export type CustomPage = { id: string; slug: string; title: string; metaTitle: string; metaDescription: string; showInMenu: boolean; sections: PageSection[] };

export const getPages = cached(
  'pages',
  async (): Promise<CustomPage[]> => {
    const rows = await db!.select().from(schema.pages).where(eq(schema.pages.published, true)).orderBy(asc(schema.pages.createdAt));
    return rows.map((r) => ({ id: r.id, slug: r.slug, title: r.title, metaTitle: r.metaTitle, metaDescription: r.metaDescription, showInMenu: r.showInMenu, sections: r.sections }));
  },
  () => [] as CustomPage[],
);

export async function getPage(slug: string) {
  return (await getPages()).find((p) => p.slug === slug) ?? null;
}
