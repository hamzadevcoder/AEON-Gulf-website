import type { MetadataRoute } from 'next';
import { abs } from '@/lib/seo';
import { servicePath } from '@/content/services';
import { guidePath } from '@/content/insights';
import { getCountries, getGuides, getPages, getServices } from '@/server/content';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [services, guides, countries, pages] = await Promise.all([getServices(), getGuides(), getCountries(), getPages()]);
  const now = new Date();
  const entry = (path: string, priority: number, changeFrequency: 'weekly' | 'monthly' | 'yearly' = 'monthly') => ({
    url: abs(path),
    lastModified: now,
    changeFrequency,
    priority,
  });
  return [
    entry('/', 1, 'weekly'),
    entry('/services', 0.9),
    ...countries.map((c) => entry(`/${c.slug}`, 0.9)),
    ...services.map((s) => entry(servicePath(s), 0.8)),
    ...pages.map((p) => entry(`/${p.slug}`, 0.7)),
    entry('/insights', 0.7),
    ...guides.map((g) => entry(guidePath(g), 0.6)),
    entry('/about', 0.6),
    entry('/quote', 0.7),
    entry('/contact', 0.6),
    entry('/privacy-policy', 0.2, 'yearly'),
    entry('/terms-and-conditions', 0.2, 'yearly'),
    entry('/cookies-policy', 0.2, 'yearly'),
  ];
}
