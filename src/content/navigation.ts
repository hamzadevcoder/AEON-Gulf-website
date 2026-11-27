/**
 * Header, menu and footer content. Defaults are the current site; anything saved in the dashboard
 * (Header & Footer) replaces them. "{country}" in a link is replaced by the country page the visitor is on
 * (Kuwait elsewhere); "{year}" in the copyright by the current year.
 */
import type { Locale } from '@/i18n/config';

export type NavLink = { label: string; labelAr: string; href: string };
export type Navigation = {
  header: { ctaLabel: string; ctaLabelAr: string; ctaHref: string; showCta: boolean; showCountries: boolean; showLanguage: boolean };
  menu: NavLink[];
  popular: NavLink[];
  footer: { links: NavLink[]; legal: NavLink[]; social: NavLink[]; copyright: string; copyrightAr: string; showMarkets: boolean; showNewsletter: boolean };
};

const L = (label: string, labelAr: string, href: string): NavLink => ({ label, labelAr, href });
const main = [
  L('Home', 'الرئيسية', '/'),
  L('Our Company', 'شركتنا', '/about'),
  L('Services', 'الخدمات', '/services'),
  L('Insights', 'رؤى ومقالات', '/insights'),
  L('Get a quote', 'اطلب عرض سعر', '/quote'),
  L('Contact', 'تواصل معنا', '/contact'),
];

export const defaultNavigation: Navigation = {
  header: { ctaLabel: 'Get a quote', ctaLabelAr: 'اطلب عرض سعر', ctaHref: '/quote', showCta: true, showCountries: true, showLanguage: true },
  menu: main,
  popular: [
    L('Company formation', 'تأسيس الشركات', '/{country}/services/company-formation-management'),
    L('Visa and immigration', 'التأشيرات والإقامة', '/{country}/services/visa-immigration-services'),
    L('Annual compliance', 'الامتثال السنوي', '/{country}/services/annual-compliance'),
  ],
  footer: {
    links: main,
    legal: [L('Privacy Policy', 'سياسة الخصوصية', '/privacy-policy'), L('Terms and Conditions', 'الشروط والأحكام', '/terms-and-conditions'), L('Cookies Policy', 'سياسة ملفات تعريف الارتباط', '/cookies-policy')],
    social: [],
    copyright: '© {year} AEON Gulf',
    copyrightAr: '© {year} AEON Gulf',
    showMarkets: true,
    showNewsletter: true,
  },
};

export type ResolvedNav = {
  header: { ctaLabel: string; ctaHref: string; showCta: boolean; showCountries: boolean; showLanguage: boolean };
  menu: { label: string; href: string }[];
  popular: { label: string; href: string }[];
  footer: { links: { label: string; href: string }[]; legal: { label: string; href: string }[]; social: { label: string; href: string }[]; copyright: string; showMarkets: boolean; showNewsletter: boolean };
};

/** Stored values over the defaults (lists are replaced as a whole), in one language. */
export function resolveNavigation(stored: Partial<Navigation> | undefined, locale: Locale): ResolvedNav {
  const d = defaultNavigation;
  const s = stored ?? {};
  const ar = locale === 'ar';
  const links = (list: NavLink[]) => list.filter((l) => l && l.href).map((l) => ({ label: (ar ? l.labelAr : '') || l.label || l.labelAr, href: l.href }));
  const h = { ...d.header, ...(s.header ?? {}) };
  const f = { ...d.footer, ...(s.footer ?? {}) };
  const year = String(new Date().getFullYear());
  return {
    header: { ctaLabel: (ar ? h.ctaLabelAr : '') || h.ctaLabel, ctaHref: h.ctaHref || '/quote', showCta: h.showCta !== false, showCountries: h.showCountries !== false, showLanguage: h.showLanguage !== false },
    menu: links(s.menu ?? d.menu),
    popular: links(s.popular ?? d.popular),
    footer: {
      links: links(f.links), legal: links(f.legal), social: links(f.social),
      copyright: ((ar ? f.copyrightAr : '') || f.copyright).replace('{year}', year),
      showMarkets: f.showMarkets !== false, showNewsletter: f.showNewsletter !== false,
    },
  };
}
