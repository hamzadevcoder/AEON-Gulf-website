import type { Metadata } from 'next';
import { localizeHref, type Locale } from '@/i18n/config';
import { getLocale } from '@/i18n/request';

/** Public site address. Set NEXT_PUBLIC_SITE_URL in the hosting environment to the real domain. */
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.aeongulf.com').replace(/\/$/, '');
export const SITE_NAME = 'AEON Gulf';
export const abs = (path: string) => `${SITE_URL}${path.startsWith('/') ? path : `/${path}`}`;

/** Trim to a search-result friendly length without cutting mid-word. */
export function clip(text: string, max: number) {
  if (text.length <= max) return text;
  const cut = text.slice(0, max - 1);
  return cut.slice(0, cut.lastIndexOf(' ')).replace(/[,;:.\-–]$/, '') + '…';
}

type PageSeo = { title: string; description: string; path: string; type?: 'website' | 'article'; absoluteTitle?: boolean; noindex?: boolean; locale?: Locale; /** false when the page has no real Arabic version yet */ alternate?: boolean };

/** Title, description, canonical, Open Graph and Twitter tags for a page. */
export function pageMetadata({ title, description, path, type = 'website', absoluteTitle = false, noindex = false, locale = getLocale(), alternate = true }: PageSeo): Metadata {
  const full = absoluteTitle ? title : `${title} | ${SITE_NAME}`;
  const url = localizeHref(path, locale);
  return {
    title: absoluteTitle ? { absolute: title } : title,
    description,
    // hreflang: Google shows each visitor the right language version
    alternates: { canonical: url, languages: alternate ? { en: path, ar: localizeHref(path, 'ar'), 'x-default': path } : undefined },
    robots: noindex ? { index: false, follow: true } : undefined,
    openGraph: { title: full, description, url: abs(url), siteName: SITE_NAME, type, locale: locale === 'ar' ? 'ar_KW' : 'en_GB', alternateLocale: locale === 'ar' ? 'en_GB' : 'ar_KW' },
    twitter: { card: 'summary_large_image', title: full, description },
  };
}

export const breadcrumbLd = (items: { name: string; path: string }[], locale: Locale = getLocale()) => ({
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: items.map((it, i) => ({ '@type': 'ListItem', position: i + 1, name: it.name, item: abs(localizeHref(it.path, locale)) })),
});

export const organizationLd = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  '@id': abs('/#organization'),
  name: SITE_NAME,
  url: SITE_URL,
  logo: abs('/brand/aeon-gulf-color.svg'),
  email: 'info@aeongulf.com',
  telephone: '+965 2220 5891',
  description:
    'Business setup, PRO and GRO, annual compliance, accounting and relocation services for companies in Kuwait, Qatar and Saudi Arabia.',
  areaServed: ['Kuwait', 'Qatar', 'Saudi Arabia'].map((name) => ({ '@type': 'Country', name })),
  contactPoint: [{ '@type': 'ContactPoint', contactType: 'sales', email: 'info@aeongulf.com', telephone: '+965 2220 5891', areaServed: ['KW', 'QA', 'SA'], availableLanguage: ['English'] }],
};

export const websiteLd = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  '@id': abs('/#website'),
  url: SITE_URL,
  name: SITE_NAME,
  publisher: { '@id': abs('/#organization') },
  inLanguage: 'en',
};
