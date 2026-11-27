'use server';

import { revalidatePath } from 'next/cache';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { requireDb, schema } from '@/server/db';
import { audit, requirePermission } from '@/server/auth';
import { refreshSite, run, str, UserError, type ActionState } from '@/server/admin-action';
import { MAX_BYTES, sniffImage, storeImage, deleteImage } from '@/server/storage';
import { sources } from '@/content/images';

async function saveUpload(file: File, alt: string, userId: string) {
  if (!file || typeof file === 'string' || file.size === 0) throw new UserError('Choose an image to upload.');
  if (file.size > MAX_BYTES) throw new UserError(`Images must be ${MAX_BYTES / 1048576} MB or smaller.`);
  const buf = Buffer.from(await file.arrayBuffer());
  const mime = sniffImage(buf);
  if (!mime) throw new UserError('Upload a JPG, PNG, WebP, AVIF or GIF image.');
  const stored = await storeImage(buf, mime);
  const [row] = await requireDb()
    .insert(schema.media)
    .values({ url: stored.url, storageKey: stored.key, filename: file.name.slice(0, 200), mime, size: buf.length, alt, uploadedBy: userId })
    .returning();
  await audit(userId, 'media.upload', 'media', row.id, { filename: row.filename });
  return row;
}

export async function uploadMedia(_prev: ActionState, fd: FormData) {
  return run('media.manage', async (me) => {
    const files = fd.getAll('files').filter((f): f is File => typeof f !== 'string' && f.size > 0);
    if (!files.length) throw new UserError('Choose at least one image.');
    if (files.length > 20) throw new UserError('Upload up to 20 images at a time.');
    for (const f of files) await saveUpload(f, '', me.id);
    revalidatePath('/admin/media');
    return { ok: true, message: `${files.length} image${files.length > 1 ? 's' : ''} uploaded.` };
  });
}

async function setSlot(slot: string, value: { src: string; alt?: string } | null, userId: string) {
  if (!(slot in sources)) throw new UserError('Unknown image slot.');
  const d = requireDb();
  const [row] = await d.select().from(schema.settings).where(eq(schema.settings.key, 'image_slots'));
  const map = { ...((row?.value as Record<string, { src: string; alt?: string }>) ?? {}) };
  if (value) map[slot] = value;
  else delete map[slot];
  await d
    .insert(schema.settings)
    .values({ key: 'image_slots', value: map, updatedBy: userId })
    .onConflictDoUpdate({ target: schema.settings.key, set: { value: map, updatedBy: userId, updatedAt: new Date() } });
}

/** Replace a site image: upload a new file, or pick one from the library. */
export async function replaceSlot(_prev: ActionState, fd: FormData) {
  return run('media.manage', async (me) => {
    const slot = str(fd, 'slot');
    const alt = z.string().trim().max(300).parse(str(fd, 'alt'));
    const file = fd.get('file');
    let src = str(fd, 'mediaUrl');
    if (file && typeof file !== 'string' && file.size > 0) src = (await saveUpload(file, alt, me.id)).url;
    if (!src) throw new UserError('Upload an image or choose one from the library.');
    if (!/^(\/uploads\/|https:\/\/)/.test(src)) throw new UserError('Choose an image from the library.');
    await setSlot(slot, { src, alt: alt || undefined }, me.id);
    await audit(me.id, 'image_slot.replace', 'image_slot', slot, { src });
    refreshSite();
    revalidatePath('/admin/media');
    return { ok: true, message: 'Image replaced. The website has been updated.' };
  });
}

export async function resetSlot(fd: FormData) {
  const me = await requirePermission('media.manage');
  const slot = str(fd, 'slot');
  await setSlot(slot, null, me.id);
  await audit(me.id, 'image_slot.reset', 'image_slot', slot);
  refreshSite();
  revalidatePath('/admin/media');
}

export async function updateMediaAlt(_prev: ActionState, fd: FormData) {
  return run('media.manage', async (me) => {
    const id = z.string().uuid().parse(str(fd, 'id'));
    const alt = z.string().trim().max(300).parse(str(fd, 'alt'));
    await requireDb().update(schema.media).set({ alt }).where(eq(schema.media.id, id));
    await audit(me.id, 'media.alt', 'media', id);
    revalidatePath('/admin/media');
    return { ok: true, message: 'Description saved.' };
  });
}

export async function deleteMedia(_prev: ActionState, fd: FormData) {
  return run('media.manage', async (me) => {
  const id = z.string().uuid().parse(str(fd, 'id'));
  const d = requireDb();
  const [row] = await d.select().from(schema.media).where(eq(schema.media.id, id));
  if (!row) return { ok: true, message: 'Already deleted.' };
  // refuse while the image is used in a slot or a guide
  const [slots] = await d.select().from(schema.settings).where(eq(schema.settings.key, 'image_slots'));
  const used = Object.values((slots?.value as Record<string, { src: string }>) ?? {}).some((v) => v.src === row.url);
  const [guide] = await d.select({ slug: schema.guides.slug }).from(schema.guides).where(eq(schema.guides.image, row.url));
  if (used || guide) throw new UserError('This image is in use on the website. Replace it there first.');
  await d.delete(schema.media).where(eq(schema.media.id, id));
  await deleteImage(row.storageKey);
  await audit(me.id, 'media.delete', 'media', id, { filename: row.filename });
  revalidatePath('/admin/media');
  return { ok: true, message: 'Image deleted.' };
  });
}
