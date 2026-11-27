'use server';

import { revalidatePath } from 'next/cache';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { requireDb, schema } from '@/server/db';
import { audit, requirePermission } from '@/server/auth';
import { json, refreshSite, run, str, type ActionState } from '@/server/admin-action';
import { defaultMessages, messageKeys } from '@/i18n/dict';
import { textToBlocks } from '@/lib/legal-text';
import { policies } from '@/content/legal';

/** Arabic versions are stored in each row's "ar" column. Empty fields fall back to the built-in Arabic text where there is one. */
const text = (max: number) => z.string().trim().max(max);
const pairs = (a: string, b: string, max: number) =>
  z.array(z.object({ [a]: z.string().trim().max(400), [b]: z.string().trim().max(4000) })).max(max).transform((l) => l.filter((x) => Object.values(x).some(Boolean)));

export async function saveServiceAr(_prev: ActionState, fd: FormData) {
  return run('content.edit', async (me): Promise<ActionState> => {
    const id = z.string().uuid().parse(str(fd, 'id'));
    const v = z
      .object({
        name: text(160), metaTitle: text(70), metaDescription: text(170), keywords: z.array(text(120)).max(30), listingBody: text(1200),
        heroHeading: text(200), heroSubtitle: text(600), whyHeading: text(200), whyDescription: text(2000), benefits: pairs('title', 'text', 6),
        stepsHeading: text(200), steps: pairs('title', 'text', 8), faqs: pairs('q', 'a', 12), ctaHeading: text(200), ctaDescription: text(600), ctaText: text(60),
      })
      .parse({
        name: str(fd, 'name'), metaTitle: str(fd, 'metaTitle'), metaDescription: str(fd, 'metaDescription'),
        keywords: str(fd, 'keywords').split(/[,،]/).map((k) => k.trim()).filter(Boolean), listingBody: str(fd, 'listingBody'),
        heroHeading: str(fd, 'heroHeading'), heroSubtitle: str(fd, 'heroSubtitle'), whyHeading: str(fd, 'whyHeading'), whyDescription: str(fd, 'whyDescription'),
        benefits: json(fd, 'benefits'), stepsHeading: str(fd, 'stepsHeading'), steps: json(fd, 'steps'), faqs: json(fd, 'faqs'),
        ctaHeading: str(fd, 'ctaHeading'), ctaDescription: str(fd, 'ctaDescription'), ctaText: str(fd, 'ctaText'),
      });
    const empty = !Object.values(v).some((x) => (Array.isArray(x) ? x.length : x));
    await requireDb().update(schema.services).set({ ar: empty ? null : v, updatedBy: me.id, updatedAt: new Date() }).where(eq(schema.services.id, id));
    await audit(me.id, 'service.save_ar', 'service', id);
    refreshSite();
    const complete = Boolean(v.heroHeading && v.whyDescription);
    return { ok: true, message: complete ? 'Arabic saved. The full Arabic page is live.' : 'Arabic saved. Add the page heading and overview to publish the full Arabic page.' };
  });
}

export async function saveCountryAr(_prev: ActionState, fd: FormData) {
  return run('content.edit', async (me): Promise<ActionState> => {
    const slug = str(fd, 'slug');
    const v = {
      name: str(fd, 'name'), line: str(fd, 'line'), intro: str(fd, 'intro'), authorities: str(fd, 'authoritiesSummary'),
      quickFacts: z.array(z.object({ label: text(120), value: text(200) })).max(6).parse(json(fd, 'quickFacts')),
      authorityList: (json(fd, 'authorities') as { name: string }[]).map((a) => a.name.trim()).filter(Boolean),
      officeDetail: str(fd, 'officeDetail'),
    };
    await requireDb().update(schema.countries).set({ ar: v, updatedAt: new Date() }).where(eq(schema.countries.slug, slug));
    await audit(me.id, 'country.save_ar', 'country', slug);
    refreshSite();
    return { ok: true, message: 'Arabic saved. The Arabic website has been updated.' };
  });
}

export async function saveGuideAr(_prev: ActionState, fd: FormData) {
  return run('content.edit', async (me): Promise<ActionState> => {
    const slug = str(fd, 'slug');
    const v = {
      title: text(160).parse(str(fd, 'title')), excerpt: text(300).parse(str(fd, 'excerpt')), metaTitle: text(70).parse(str(fd, 'metaTitle')),
      metaDescription: text(170).parse(str(fd, 'metaDescription')), category: text(40).parse(str(fd, 'category')),
      intro: str(fd, 'intro').split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean),
    };
    await requireDb().update(schema.guides).set({ ar: v, updatedBy: me.id, updatedAt: new Date() }).where(eq(schema.guides.slug, slug));
    await audit(me.id, 'guide.save_ar', 'guide', slug);
    refreshSite();
    return { ok: true, message: 'Arabic saved. The guide shows on the Arabic site once its related service has an Arabic page.' };
  });
}

export async function saveLegalAr(_prev: ActionState, fd: FormData) {
  return run('content.edit', async (me): Promise<ActionState> => {
    const slug = z.enum(['privacy-policy', 'terms-and-conditions', 'cookies-policy']).parse(str(fd, 'slug'));
    const sections = z.array(z.object({ title: z.string().trim().min(1, 'Every section needs a title.').max(200), body: z.string().max(20000) })).max(40).parse(json(fd, 'sections'));
    const ar = { slug, title: text(120).parse(str(fd, 'title')), effective: text(60).parse(str(fd, 'effective')), intro: textToBlocks(str(fd, 'intro')), sections: sections.map((s) => ({ title: s.title, blocks: textToBlocks(s.body) })) };
    const en = policies[slug];
    await requireDb()
      .insert(schema.legalPages)
      .values({ slug, title: en.title, effective: en.effective, intro: en.intro, sections: en.sections, ar, updatedBy: me.id })
      .onConflictDoUpdate({ target: schema.legalPages.slug, set: { ar, updatedBy: me.id, updatedAt: new Date() } });
    await audit(me.id, 'legal.save_ar', 'legal_page', slug);
    refreshSite();
    return { ok: true, message: 'Arabic saved. The Arabic website has been updated.' };
  });
}

export async function savePageAr(_prev: ActionState, fd: FormData) {
  return run('content.edit', async (me): Promise<ActionState> => {
    const id = z.string().uuid().parse(str(fd, 'id'));
    const v = { title: text(120).parse(str(fd, 'title')), metaTitle: text(70).parse(str(fd, 'metaTitle')), metaDescription: text(170).parse(str(fd, 'metaDescription')) };
    await requireDb().update(schema.pages).set({ ar: v.title ? v : null, updatedBy: me.id, updatedAt: new Date() }).where(eq(schema.pages.id, id));
    await audit(me.id, 'page.save_ar', 'page', id);
    refreshSite();
    return { ok: true, message: 'Arabic page settings saved.' };
  });
}

/** Interface text: only values that differ from the built-in text are stored. */
export async function saveUiText(_prev: ActionState, fd: FormData) {
  return run('content.edit', async (me): Promise<ActionState> => {
    const value: Record<'en' | 'ar', Record<string, string>> = { en: {}, ar: {} };
    for (const k of messageKeys) {
      for (const l of ['en', 'ar'] as const) {
        const v = String(fd.get(`${l}:${k}`) ?? '').trim().slice(0, 600);
        if (v && v !== defaultMessages[l][k]) value[l][k] = v;
      }
    }
    await requireDb()
      .insert(schema.settings)
      .values({ key: 'ui_text', value, updatedBy: me.id })
      .onConflictDoUpdate({ target: schema.settings.key, set: { value, updatedBy: me.id, updatedAt: new Date() } });
    await audit(me.id, 'ui_text.save', 'settings', 'ui_text', { en: Object.keys(value.en).length, ar: Object.keys(value.ar).length });
    refreshSite();
    revalidatePath('/admin/translations');
    return { ok: true, message: `Saved. ${Object.keys(value.en).length + Object.keys(value.ar).length} custom text(s) in use.` };
  });
}

export async function clearServiceAr(fd: FormData) {
  const me = await requirePermission('content.edit');
  const id = z.string().uuid().parse(str(fd, 'id'));
  await requireDb().update(schema.services).set({ ar: null, updatedAt: new Date() }).where(eq(schema.services.id, id));
  await audit(me.id, 'service.clear_ar', 'service', id);
  refreshSite();
}
