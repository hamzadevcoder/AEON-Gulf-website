'use server';

import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { requireDb, schema } from '@/server/db';
import { audit } from '@/server/auth';
import { json, refreshSite, run, str, type ActionState } from '@/server/admin-action';
import type { Navigation } from '@/content/navigation';

const href = z
  .string()
  .trim()
  .max(300)
  .refine((v) => /^(\/|#|https?:\/\/|mailto:|tel:)/.test(v), 'Use a page address such as /contact, or a full https:// link.');

const links = (max: number) =>
  z
    .array(z.object({ label: z.string().trim().max(80), labelAr: z.string().trim().max(80), href: z.string().trim().max(300) }))
    .max(max)
    .transform((l) => l.filter((x) => x.label || x.labelAr || x.href))
    .pipe(z.array(z.object({ label: z.string(), labelAr: z.string(), href })).superRefine((l, ctx) => {
      l.forEach((x, i) => {
        if (!x.label && !x.labelAr) ctx.addIssue({ code: 'custom', message: `Link ${i + 1} needs a name.`, path: [] });
      });
    }));

const text = (max: number) => z.string().trim().max(max);

/** Header, menu and footer: one action, saving the section that was submitted. */
export async function saveSiteSection(_prev: ActionState, fd: FormData) {
  return run('content.edit', async (me): Promise<ActionState> => {
    const section = str(fd, 'section');
    const d = requireDb();
    const [row] = await d.select().from(schema.settings).where(eq(schema.settings.key, 'navigation'));
    const stored = ((row?.value ?? {}) as Partial<Navigation>) ?? {};
    const next: Partial<Navigation> = { ...stored };

    if (section === 'header') {
      const v = z
        .object({ ctaLabel: text(60), ctaLabelAr: text(60), ctaHref: href, showCta: z.boolean(), showCountries: z.boolean(), showLanguage: z.boolean() })
        .parse({ ctaLabel: str(fd, 'ctaLabel'), ctaLabelAr: str(fd, 'ctaLabelAr'), ctaHref: str(fd, 'ctaHref'), showCta: fd.get('showCta') === 'on', showCountries: fd.get('showCountries') === 'on', showLanguage: fd.get('showLanguage') === 'on' });
      next.header = v;
    } else if (section === 'menu') {
      next.menu = links(10).parse(json(fd, 'menu'));
      next.popular = links(8).parse(json(fd, 'popular'));
    } else if (section === 'footer') {
      const f = z
        .object({
          links: links(10), legal: links(6), social: links(8), copyright: text(120), copyrightAr: text(120), showMarkets: z.boolean(), showNewsletter: z.boolean(),
        })
        .parse({
          links: json(fd, 'links'), legal: json(fd, 'legal'), social: json(fd, 'social'), copyright: str(fd, 'copyright'), copyrightAr: str(fd, 'copyrightAr'),
          showMarkets: fd.get('showMarkets') === 'on', showNewsletter: fd.get('showNewsletter') === 'on',
        });
      next.footer = f;
      // footer text lives in the "footer" page block (English) and "ar:footer" (Arabic)
      const copy = z.object({ blurb: text(600), tagline: text(200), newsletterLabel: text(200) });
      const en = copy.parse({ blurb: str(fd, 'blurb'), tagline: str(fd, 'tagline'), newsletterLabel: str(fd, 'newsletterLabel') });
      const ar = copy.parse({ blurb: str(fd, 'blurbAr'), tagline: str(fd, 'taglineAr'), newsletterLabel: str(fd, 'newsletterLabelAr') });
      for (const [key, value] of [['footer', en], ['ar:footer', ar]] as const) {
        await d
          .insert(schema.contentBlocks)
          .values({ key, value, updatedBy: me.id })
          .onConflictDoUpdate({ target: schema.contentBlocks.key, set: { value, updatedBy: me.id, updatedAt: new Date() } });
      }
    } else {
      return { ok: false, message: 'Unknown section.' };
    }

    await d
      .insert(schema.settings)
      .values({ key: 'navigation', value: next, updatedBy: me.id })
      .onConflictDoUpdate({ target: schema.settings.key, set: { value: next, updatedBy: me.id, updatedAt: new Date() } });
    await audit(me.id, `site.${section}`, 'settings', 'navigation');
    refreshSite();
    return { ok: true, message: 'Saved. The website has been updated.' };
  });
}

export async function resetSiteSection(fd: FormData) {
  const { requirePermission } = await import('@/server/auth');
  const me = await requirePermission('content.edit');
  const section = str(fd, 'section');
  const d = requireDb();
  const [row] = await d.select().from(schema.settings).where(eq(schema.settings.key, 'navigation'));
  const next = { ...((row?.value ?? {}) as Record<string, unknown>) };
  if (section === 'header') delete next.header;
  if (section === 'menu') { delete next.menu; delete next.popular; }
  if (section === 'footer') {
    delete next.footer;
    await d.delete(schema.contentBlocks).where(eq(schema.contentBlocks.key, 'footer'));
    await d.delete(schema.contentBlocks).where(eq(schema.contentBlocks.key, 'ar:footer'));
  }
  await d.insert(schema.settings).values({ key: 'navigation', value: next, updatedBy: me.id }).onConflictDoUpdate({ target: schema.settings.key, set: { value: next, updatedBy: me.id, updatedAt: new Date() } });
  await audit(me.id, `site.${section}_reset`, 'settings', 'navigation');
  refreshSite();
}
