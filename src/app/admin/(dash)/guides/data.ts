import 'server-only';
import { asc, desc } from 'drizzle-orm';
import { requireDb, schema } from '@/server/db';

export async function guideFormData() {
  const db = requireDb();
  const [countries, services, media] = await Promise.all([
    db.select({ slug: schema.countries.slug, name: schema.countries.name }).from(schema.countries).orderBy(asc(schema.countries.sort)),
    db.select({ country: schema.services.country, slug: schema.services.slug, name: schema.services.name }).from(schema.services),
    db.select({ url: schema.media.url, filename: schema.media.filename }).from(schema.media).orderBy(desc(schema.media.createdAt)).limit(200),
  ]);
  return { countries, services, media };
}
