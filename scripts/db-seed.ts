/**
 * Imports today's website content into the database. Safe to run again: existing rows are left
 * untouched unless you pass --force (which overwrites services, countries, guides and legal pages).
 *   npm run db:seed            first-time import
 *   npm run db:seed -- --force re-import from the content files
 */
import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import { sql } from 'drizzle-orm';
import * as schema from '../src/server/db/schema';
import data from '../src/content/services.json';
import { countries, contact } from '../src/content/site';
import { guideSources } from '../src/content/insights';
import { policies } from '../src/content/legal';

const force = process.argv.includes('--force');
const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: process.env.DATABASE_SSL_REJECT_UNAUTHORIZED !== 'false' } : undefined });
const db = drizzle(pool, { schema });

async function main() {
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is not set.');

  // Countries
  for (const [i, c] of countries.entries()) {
    const office = contact.offices.find((o) => o.country === c.name);
    const values = {
      slug: c.slug, name: c.name, code: c.code, line: c.line, intro: c.intro, authoritiesSummary: c.authorities,
      quickFacts: c.quickFacts, authorities: c.authorityList, office: { detail: office?.detail ?? '', phone: office?.phone ?? null }, sort: i,
    };
    const q = db.insert(schema.countries).values(values);
    await (force ? q.onConflictDoUpdate({ target: schema.countries.slug, set: values }) : q.onConflictDoNothing());
  }

  // Services (order within each country follows the spreadsheet)
  const order: Record<string, number> = {};
  let n = 0;
  for (const s of data) {
    const sort = (order[s.country] = (order[s.country] ?? 0) + 10);
    const values = {
      country: s.country, slug: s.slug, group: s.group, groupLabel: s.groupLabel, name: s.name, metaTitle: s.metaTitle, metaDescription: s.metaDescription,
      keywords: s.keywords, listingBody: s.listing.body, heroHeading: s.hero.heading, heroSubtitle: s.hero.subtitle, whyHeading: s.why.heading,
      whyDescription: s.why.description, benefits: s.benefits, stepsHeading: s.steps.heading, steps: s.steps.items, faqs: s.faqs,
      ctaHeading: s.cta.heading, ctaDescription: s.cta.description, ctaText: s.cta.text, published: true, sort,
    };
    const q = db.insert(schema.services).values(values);
    const res = await (force
      ? q.onConflictDoUpdate({ target: [schema.services.country, schema.services.slug], set: { ...values, updatedAt: new Date() } })
      : q.onConflictDoNothing()
    ).returning({ id: schema.services.id });
    n += res.length;
  }

  // Guides
  for (const [i, g] of guideSources.entries()) {
    const values = {
      slug: g.slug, title: g.title, excerpt: g.excerpt, metaTitle: g.metaTitle, metaDescription: g.metaDescription, country: g.country,
      category: g.category, image: String(g.image), service: g.service, intro: g.intro, published: true, sort: (i + 1) * 10,
    };
    const q = db.insert(schema.guides).values(values);
    await (force ? q.onConflictDoUpdate({ target: schema.guides.slug, set: values }) : q.onConflictDoNothing());
  }

  // Legal pages
  for (const p of Object.values(policies)) {
    const values = { slug: p.slug, title: p.title, effective: p.effective, intro: p.intro, sections: p.sections };
    const q = db.insert(schema.legalPages).values(values);
    await (force ? q.onConflictDoUpdate({ target: schema.legalPages.slug, set: values }) : q.onConflictDoNothing());
  }

  // Settings
  await db.insert(schema.settings).values({ key: 'contact', value: { email: contact.email, phone: contact.phone } }).onConflictDoNothing();
  await db.insert(schema.settings).values({ key: 'email', value: { fromName: 'AEON Gulf website', fromAddress: '' } }).onConflictDoNothing();

  // First notification recipient (change it in Settings & emails)
  const notify = process.env.SEED_NOTIFY_EMAIL ?? contact.email;
  const [{ c }] = await db.select({ c: sql<number>`count(*)::int` }).from(schema.notificationRecipients);
  if (!c) await db.insert(schema.notificationRecipients).values({ email: notify, name: 'AEON Gulf team', formTypes: ['contact', 'quote', 'newsletter'] });

  console.log(`Seed complete: ${countries.length} countries, ${n} services ${force ? 'written' : 'added'}, ${guideSources.length} guides, ${Object.keys(policies).length} legal pages.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
