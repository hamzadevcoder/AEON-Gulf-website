import 'server-only';
import { desc } from 'drizzle-orm';
import { requireDb, schema } from './db';
import { sources } from '@/content/images';

/** Choices for "image" fields: the site's own photos plus anything uploaded under Images. */
export async function imageOptions() {
  const media = await requireDb().select({ url: schema.media.url, filename: schema.media.filename }).from(schema.media).orderBy(desc(schema.media.createdAt)).limit(200);
  return [
    { value: '', label: 'No photo' },
    ...Object.entries(sources).map(([k, v]) => ({ value: k, label: `Site photo: ${v.alt}` })),
    ...media.map((m) => ({ value: m.url, label: `Uploaded: ${m.filename}` })),
  ];
}
