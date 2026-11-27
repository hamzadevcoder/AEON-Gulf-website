'use server';

import { redirect } from 'next/navigation';
import { and, eq, ne } from 'drizzle-orm';
import { z } from 'zod';
import { requireDb, schema } from '@/server/db';
import { audit, requirePermission } from '@/server/auth';
import { json, refreshSite, run, str, UserError, type ActionState } from '@/server/admin-action';
import { blockDef, builtinSlugForGroup, type Field } from '@/content/blocks';
import { fieldsSchema, readFields } from '@/server/fields';
import { groupInfo, type GroupKey } from '@/content/services';
import { textToBlocks } from '@/lib/legal-text';

const slugSchema = z.string().trim().toLowerCase().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, 'Use lowercase letters, numbers and hyphens only.').max(120);
const line = (max = 300) => z.string().trim().max(max);
const required = (label: string, max = 300) => z.string().trim().min(1, `${label} is required.`).max(max);
const titled = (max: number) => z.array(z.object({ title: z.string().trim().min(1, 'Every item needs a title.').max(300), text: z.string().trim().max(4000) })).max(max);
const faqList = z.array(z.object({ q: z.string().trim().min(1, 'Every FAQ needs a question.').max(400), a: z.string().trim().min(1, 'Every FAQ needs an answer.').max(4000) })).max(12);

// ------------------------------------------------------------------ Page text blocks
export async function saveBlock(_prev: ActionState, fd: FormData) {
  return run('content.edit', async (me) => {
    const def = blockDef(str(fd, 'key'));
    if (!def) throw new UserError('Unknown section.');
    const value = fieldsSchema(def.fields).parse(readFields(fd, def.fields));
    const key = str(fd, 'lang') === 'ar' ? `ar:${def.key}` : def.key;
    const d = requireDb();
    await d
      .insert(schema.contentBlocks)
      .values({ key, value, updatedBy: me.id })
      .onConflictDoUpdate({ target: schema.contentBlocks.key, set: { value, updatedBy: me.id, updatedAt: new Date() } });
    await audit(me.id, 'block.save', 'content_block', key);
    refreshSite();
    return { ok: true, message: 'Saved. The website has been updated.' };
  });
}

export async function resetBlock(fd: FormData) {
  const me = await requirePermission('content.edit');
  const key = str(fd, 'key');
  const ar = str(fd, 'lang') === 'ar';
  await requireDb().delete(schema.contentBlocks).where(eq(schema.contentBlocks.key, ar ? `ar:${key}` : key));
  await audit(me.id, 'block.reset', 'content_block', ar ? `ar:${key}` : key);
  refreshSite();
  const group = blockDef(key)?.page ?? 'Home';
  redirect(`/admin/pages/${builtinSlugForGroup(group)}?open=${encodeURIComponent(key)}&reset=1${ar ? '&lang=ar' : ''}`);
}

// ------------------------------------------------------------------ Services
const serviceSchema = z.object({
  country: z.enum(['kuwait', 'qatar', 'saudi-arabia']),
  slug: slugSchema,
  group: z.enum(['corporate', 'pro', 'finance', 'relocation']),
  name: required('Name', 160),
  metaTitle: required('Meta title', 70),
  metaDescription: required('Meta description', 170),
  keywords: z.array(z.string().trim().max(120)).max(30),
  listingBody: required('Listing text', 1200),
  heroHeading: required('Hero heading', 200),
  heroSubtitle: required('Hero subtitle', 600),
  whyHeading: required('Why heading', 200),
  whyDescription: required('Why text', 2000),
  benefits: titled(6),
  stepsHeading: required('Process heading', 200),
  steps: titled(8),
  faqs: faqList,
  ctaHeading: required('Closing heading', 200),
  ctaDescription: required('Closing text', 600),
  ctaText: required('Button label', 60),
  published: z.boolean(),
  sort: z.coerce.number().int().min(0).max(10000),
});

function readService(fd: FormData) {
  return serviceSchema.parse({
    country: str(fd, 'country'), slug: str(fd, 'slug'), group: str(fd, 'group'), name: str(fd, 'name'),
    metaTitle: str(fd, 'metaTitle'), metaDescription: str(fd, 'metaDescription'),
    keywords: str(fd, 'keywords').split(',').map((k) => k.trim()).filter(Boolean),
    listingBody: str(fd, 'listingBody'), heroHeading: str(fd, 'heroHeading'), heroSubtitle: str(fd, 'heroSubtitle'),
    whyHeading: str(fd, 'whyHeading'), whyDescription: str(fd, 'whyDescription'), benefits: json(fd, 'benefits'),
    stepsHeading: str(fd, 'stepsHeading'), steps: json(fd, 'steps'), faqs: json(fd, 'faqs'),
    ctaHeading: str(fd, 'ctaHeading'), ctaDescription: str(fd, 'ctaDescription'), ctaText: str(fd, 'ctaText'),
    published: fd.get('published') === 'on', sort: str(fd, 'sort') || 0,
  });
}

const groupLabelFor = (group: GroupKey, country: string) => (group === 'pro' && country === 'saudi-arabia' ? 'GRO Services' : groupInfo[group].label);

export async function saveService(_prev: ActionState, fd: FormData) {
  return run('content.edit', async (me): Promise<ActionState> => {
    const id = str(fd, 'id');
    const v = readService(fd);
    const d = requireDb();
    const clash = await d
      .select({ id: schema.services.id })
      .from(schema.services)
      .where(and(eq(schema.services.country, v.country), eq(schema.services.slug, v.slug), id ? ne(schema.services.id, id) : undefined));
    if (clash.length) return { ok: false, message: 'Another service in this country already uses that URL slug.', errors: { slug: 'Already in use in this country.' } };
    const values = { ...v, groupLabel: groupLabelFor(v.group, v.country), updatedBy: me.id, updatedAt: new Date() };
    if (id) {
      await d.update(schema.services).set(values).where(eq(schema.services.id, z.string().uuid().parse(id)));
      await audit(me.id, 'service.update', 'service', id, { country: v.country, slug: v.slug });
    } else {
      const [row] = await d.insert(schema.services).values(values).returning({ id: schema.services.id });
      await audit(me.id, 'service.create', 'service', row.id, { country: v.country, slug: v.slug });
      refreshSite();
      redirect(`/admin/services/${row.id}?created=1`);
    }
    refreshSite();
    return { ok: true, message: 'Service saved. The website has been updated.' };
  });
}

export async function deleteService(fd: FormData) {
  const me = await requirePermission('content.edit');
  const id = z.string().uuid().parse(str(fd, 'id'));
  const [row] = await requireDb().delete(schema.services).where(eq(schema.services.id, id)).returning({ slug: schema.services.slug, country: schema.services.country });
  await audit(me.id, 'service.delete', 'service', id, row);
  refreshSite();
  redirect('/admin/services?deleted=1');
}

export async function togglePublished(fd: FormData) {
  const me = await requirePermission('content.edit');
  const id = z.string().uuid().parse(str(fd, 'id'));
  const published = str(fd, 'published') === 'true';
  await requireDb().update(schema.services).set({ published, updatedAt: new Date(), updatedBy: me.id }).where(eq(schema.services.id, id));
  await audit(me.id, published ? 'service.publish' : 'service.unpublish', 'service', id);
  refreshSite();
}

// ------------------------------------------------------------------ Countries
export async function saveCountry(_prev: ActionState, fd: FormData) {
  return run('content.edit', async (me) => {
    const slug = str(fd, 'slug');
    const v = z
      .object({
        name: required('Name', 80), code: required('Code', 4), line: line(300), intro: line(1200), authoritiesSummary: line(400),
        quickFacts: z.array(z.object({ label: z.string().trim().max(120), value: z.string().trim().max(200) })).max(6),
        authorities: z.array(z.string().trim().max(160)).max(30),
        officeDetail: line(300), officePhone: line(40),
      })
      .parse({
        name: str(fd, 'name'), code: str(fd, 'code'), line: str(fd, 'line'), intro: str(fd, 'intro'), authoritiesSummary: str(fd, 'authoritiesSummary'),
        quickFacts: json(fd, 'quickFacts'), authorities: (json(fd, 'authorities') as { name: string }[]).map((a) => a.name),
        officeDetail: str(fd, 'officeDetail'), officePhone: str(fd, 'officePhone'),
      });
    await requireDb()
      .update(schema.countries)
      .set({
        name: v.name, code: v.code.toUpperCase(), line: v.line, intro: v.intro, authoritiesSummary: v.authoritiesSummary, quickFacts: v.quickFacts,
        authorities: v.authorities.filter(Boolean), office: { detail: v.officeDetail, phone: v.officePhone || null }, updatedAt: new Date(),
      })
      .where(eq(schema.countries.slug, slug));
    await audit(me.id, 'country.update', 'country', slug);
    refreshSite();
    return { ok: true, message: 'Country saved. The website has been updated.' };
  });
}

// ------------------------------------------------------------------ Guides
const guideSchema = z.object({
  slug: slugSchema,
  title: required('Title', 160),
  excerpt: required('Excerpt', 300),
  metaTitle: required('Meta title', 70),
  metaDescription: required('Meta description', 170),
  country: z.enum(['kuwait', 'qatar', 'saudi-arabia']),
  category: required('Category', 40),
  image: required('Image', 500),
  service: slugSchema,
  intro: z.array(z.string().trim().max(3000)).max(8),
  published: z.boolean(),
  sort: z.coerce.number().int().min(0).max(10000),
});

export async function saveGuide(_prev: ActionState, fd: FormData) {
  return run('content.edit', async (me): Promise<ActionState> => {
    const original = str(fd, 'originalSlug');
    const v = guideSchema.parse({
      slug: str(fd, 'slug'), title: str(fd, 'title'), excerpt: str(fd, 'excerpt'), metaTitle: str(fd, 'metaTitle'), metaDescription: str(fd, 'metaDescription'),
      country: str(fd, 'country'), category: str(fd, 'category') || 'Guide', image: str(fd, 'image'), service: str(fd, 'service'),
      intro: str(fd, 'intro').split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean), published: fd.get('published') === 'on', sort: str(fd, 'sort') || 0,
    });
    const d = requireDb();
    const [svc] = await d.select({ id: schema.services.id }).from(schema.services).where(and(eq(schema.services.country, v.country), eq(schema.services.slug, v.service)));
    if (!svc) return { ok: false, message: 'Choose a related service that exists in the selected country.', errors: { service: 'Not found in this country.' } };
    if (v.slug !== original) {
      const [clash] = await d.select({ slug: schema.guides.slug }).from(schema.guides).where(eq(schema.guides.slug, v.slug));
      if (clash) return { ok: false, message: 'Another guide already uses that URL slug.', errors: { slug: 'Already in use.' } };
    }
    if (original) {
      await d.update(schema.guides).set({ ...v, updatedBy: me.id, updatedAt: new Date() }).where(eq(schema.guides.slug, original));
      await audit(me.id, 'guide.update', 'guide', v.slug);
    } else {
      await d.insert(schema.guides).values({ ...v, updatedBy: me.id });
      await audit(me.id, 'guide.create', 'guide', v.slug);
    }
    refreshSite();
    if (!original || v.slug !== original) redirect(`/admin/guides/${v.slug}?saved=1`);
    return { ok: true, message: 'Guide saved. The website has been updated.' };
  });
}

export async function deleteGuide(fd: FormData) {
  const me = await requirePermission('content.edit');
  const slug = slugSchema.parse(str(fd, 'slug'));
  await requireDb().delete(schema.guides).where(eq(schema.guides.slug, slug));
  await audit(me.id, 'guide.delete', 'guide', slug);
  refreshSite();
  redirect('/admin/guides?deleted=1');
}

// ------------------------------------------------------------------ Legal pages
export async function saveLegal(_prev: ActionState, fd: FormData) {
  return run('content.edit', async (me) => {
    const slug = z.enum(['privacy-policy', 'terms-and-conditions', 'cookies-policy']).parse(str(fd, 'slug'));
    const title = required('Title', 120).parse(str(fd, 'title'));
    const effective = required('Effective date', 60).parse(str(fd, 'effective'));
    const intro = textToBlocks(z.string().max(10000).parse(str(fd, 'intro')));
    const rawSections = z.array(z.object({ title: z.string().trim().min(1, 'Every section needs a title.').max(200), body: z.string().max(20000) })).max(40).parse(json(fd, 'sections'));
    const sections = rawSections.map((s) => ({ title: s.title, blocks: textToBlocks(s.body) }));
    await requireDb()
      .insert(schema.legalPages)
      .values({ slug, title, effective, intro, sections, updatedBy: me.id })
      .onConflictDoUpdate({ target: schema.legalPages.slug, set: { title, effective, intro, sections, updatedBy: me.id, updatedAt: new Date() } });
    await audit(me.id, 'legal.update', 'legal_page', slug);
    refreshSite();
    return { ok: true, message: 'Page saved. The website has been updated.' };
  });
}
