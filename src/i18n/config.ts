export const locales = ['en', 'ar'] as const;
export type Locale = (typeof locales)[number];
export const isLocale = (v: unknown): v is Locale => v === 'en' || v === 'ar';
export const dirOf = (l: Locale) => (l === 'ar' ? 'rtl' : 'ltr');

/** Remove the /ar prefix from a path. */
export function stripLocale(path: string) {
  // English pages are served internally from /en (see middleware), so the path can carry either prefix
  for (const l of ['/ar', '/en']) {
    if (path === l) return '/';
    if (path.startsWith(l + '/')) return path.slice(3);
  }
  return path;
}

/** Internal links get /ar in front on the Arabic site; admin, API, uploads, hashes and external links are left alone. */
export function localizeHref(href: string, locale: Locale) {
  if (locale !== 'ar' || !href.startsWith('/') || href.startsWith('//')) return href;
  if (/^\/(ar)(\/|$|\?|#)/.test(href) || /^\/(admin|api|uploads|brand|images|fonts|flags)(\/|$)/.test(href)) return href;
  if (href === '/') return '/ar';
  if (href.startsWith('/#') || href.startsWith('/?')) return '/ar' + href.slice(1);
  return '/ar' + href;
}

/** The same page in the other language. */
export const switchLocalePath = (path: string, to: Locale) => (to === 'ar' ? localizeHref(stripLocale(path), 'ar') : stripLocale(path));
