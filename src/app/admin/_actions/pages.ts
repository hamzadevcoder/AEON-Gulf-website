'use server';

import { randomUUID } from 'node:crypto';
import { redirect } from 'next/navigation';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { requireDb, schema } from '@/server/db';
import type { PageSection } from '@/server/db/schema';
import { audit, requirePermission } from '@/server/auth';
import { refreshSite, run, str, UserError, type ActionState } from '@/server/admin-action';
import { fieldsSchema, readFields } from '@/server/fields';
import { pageStarters, reservedSlugs, sectionTemplate } from '@/content/sections';

const slugify = (s: string) => s.toLowerCase().trim().replace(/&/g, ' and ').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '').slice(0, 80);
const slugSchema = z.string().trim().toLowerCase().min(1, 'Enter a page address.').max(80).regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, 'Use lowercase letters, numbers and hyphens only.')
  .refine((v) => !reservedSlugs.includes(v), 'That address is used by the website itself. Choose another.');

const freshSection = (type: string): PageSection => {
  const t = sectionTemplate(type);
  if (!t) throw new UserError('Unknown section type.');
  return { id: randomUUID(), type, data: structuredClone(t.defaults) };
};

async function loadPage(id: string) {
  const [page] = await requireDb().select().from(schema.pages).where(eq(schema.pages.id, z.string().uuid().parse(id)));
  if (!page) throw new UserError('This page no longer exists.');
  return page;
}

async function saveSections(pageId: string, sections: PageSection[], userId: string) {
  await requireDb().update(schema.pages).set({ sections, updatedBy: userId, updatedAt: new Date() }).where(eq(schema.pages.id, pageId));
  refreshSite();
}

export async function createPage(_prev: ActionState, fd: FormData): Promise<ActionState> {
  return run('content.edit', async (me): Promise<ActionState> => {
    const title = z.string().trim().min(2, 'Enter a page title.').max(120).parse(str(fd, 'title'));
    const slug = slugSchema.parse(str(fd, 'slug') || slugify(title));
    const starter = pageStarters.find((s) => s.key === str(fd, 'starter')) ?? pageStarters[0];
    const d = requireDb();
    const [clash] = await d.select({ id: schema.pages.id }).from(schema.pages).where(eq(schema.pages.slug, slug));
    if (clash) return { ok: false, message: 'Another page already uses that address.', errors: { slug: 'Already in use.' } };
    const sections = starter.sections.map(freshSection);
    if (sections[0]?.type === 'hero') Object.assign(sections[0].data, { title });
    const [row] = await d.insert(schema.pages).values({ slug, title, metaTitle: title, sections, updatedBy: me.id }).returning({ id: schema.pages.id });
    await audit(me.id, 'page.create', 'page', row.id, { slug, starter: starter.key });
    redirect(`/admin/pages/custom/${row.id}?created=1`);
  });
}

export async function savePageSettings(_prev: ActionState, fd: FormData): Promise<ActionState> {
  return run('content.edit', async (me): Promise<ActionState> => {
    const page = await loadPage(str(fd, 'id'));
    const v = z.object({
      title: z.string().trim().min(2, 'Enter a page title.').max(120), slug: slugSchema,
      metaTitle: z.string().trim().max(70), metaDescription: z.string().trim().max(170), published: z.boolean(), showInMenu: z.boolean(),
    }).parse({ title: str(fd, 'title'), slug: str(fd, 'slug'), metaTitle: str(fd, 'metaTitle'), metaDescription: str(fd, 'metaDescription'), published: fd.get('published') === 'on', showInMenu: fd.get('showInMenu') === 'on' });
    if (v.slug !== page.slug) {
      const [clash] = await requireDb().select({ id: schema.pages.id }).from(schema.pages).where(eq(schema.pages.slug, v.slug));
      if (clash) return { ok: false, message: 'Another page already uses that address.', errors: { slug: 'Already in use.' } };
    }
    await requireDb().update(schema.pages).set({ ...v, updatedBy: me.id, updatedAt: new Date() }).where(eq(schema.pages.id, page.id));
    await audit(me.id, 'page.update', 'page', page.id, { slug: v.slug, published: v.published });
    refreshSite();
    return { ok: true, message: v.published ? 'Saved. The page is live.' : 'Saved. The page is a draft and not visible on the website.' };
  });
}

export async function addSection(fd: FormData) {
  const me = await requirePermission('content.edit');
  const page = await loadPage(str(fd, 'id'));
  const section = freshSection(str(fd, 'type'));
  const after = str(fd, 'after');
  const sections = [...page.sections];
  const at = after ? sections.findIndex((s) => s.id === after) + 1 : sections.length;
  sections.splice(at || sections.length, 0, section);
  await saveSections(page.id, sections, me.id);
  await audit(me.id, 'page.section_add', 'page', page.id, { type: section.type });
  redirect(`/admin/pages/custom/${page.id}?open=${section.id}${str(fd, 'lang') === 'ar' ? '&lang=ar' : ''}#s-${section.id}`);
}

export async function saveSection(_prev: ActionState, fd: FormData): Promise<ActionState> {
  return run('content.edit', async (me): Promise<ActionState> => {
    const page = await loadPage(str(fd, 'id'));
    const sections = [...page.sections];
    const i = sections.findIndex((s) => s.id === str(fd, 'sectionId'));
    if (i < 0) throw new UserError('This section no longer exists.');
    const tpl = sectionTemplate(sections[i].type);
    if (!tpl) throw new UserError('Unknown section type.');
    const value = fieldsSchema(tpl.fields).parse(readFields(fd, tpl.fields));
    sections[i] = str(fd, 'lang') === 'ar' ? { ...sections[i], dataAr: value } : { ...sections[i], data: value };
    await saveSections(page.id, sections, me.id);
    await audit(me.id, 'page.section_save', 'page', page.id, { type: tpl.type });
    return { ok: true, message: page.published ? 'Saved. The website has been updated.' : 'Saved (this page is still a draft).' };
  });
}

async function mutate(fd: FormData, fn: (sections: PageSection[], id: string) => PageSection[], action: string) {
  const me = await requirePermission('content.edit');
  const page = await loadPage(str(fd, 'id'));
  const sectionId = str(fd, 'sectionId');
  await saveSections(page.id, fn([...page.sections], sectionId), me.id);
  await audit(me.id, action, 'page', page.id, { sectionId });
  redirect(`/admin/pages/custom/${page.id}${str(fd, 'lang') === 'ar' ? '?lang=ar' : ''}`);
}

export async function moveSection(fd: FormData) {
  const dir = str(fd, 'dir') === 'up' ? -1 : 1;
  await mutate(fd, (list, id) => {
    const i = list.findIndex((s) => s.id === id);
    const j = i + dir;
    if (i >= 0 && j >= 0 && j < list.length) [list[i], list[j]] = [list[j], list[i]];
    return list;
  }, 'page.section_move');
}

export async function toggleSection(fd: FormData) {
  await mutate(fd, (list, id) => list.map((s) => (s.id === id ? { ...s, hidden: !s.hidden } : s)), 'page.section_toggle');
}

export async function duplicateSection(fd: FormData) {
  await mutate(fd, (list, id) => {
    const i = list.findIndex((s) => s.id === id);
    if (i >= 0) list.splice(i + 1, 0, { ...structuredClone(list[i]), id: randomUUID() });
    return list;
  }, 'page.section_duplicate');
}

export async function deleteSection(fd: FormData) {
  await mutate(fd, (list, id) => list.filter((s) => s.id !== id), 'page.section_delete');
}

export async function deletePage(fd: FormData) {
  const me = await requirePermission('content.edit');
  const page = await loadPage(str(fd, 'id'));
  await requireDb().delete(schema.pages).where(eq(schema.pages.id, page.id));
  await audit(me.id, 'page.delete', 'page', page.id, { slug: page.slug });
  refreshSite();
  redirect('/admin/pages?deleted=1');
}
