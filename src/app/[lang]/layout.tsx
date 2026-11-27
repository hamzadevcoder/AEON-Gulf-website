import 'lenis/dist/lenis.css';
import '@fontsource/ibm-plex-sans-arabic/400.css';
import '@fontsource/ibm-plex-sans-arabic/500.css';
import { notFound } from 'next/navigation';
import { I18nProvider } from '@/i18n/client';
import { setLocale, getMessages } from '@/i18n/server';
import { dirOf, isLocale, locales } from '@/i18n/config';
import { MotionProvider } from '@/components/motion/MotionProvider';
import { TransitionProvider } from '@/components/motion/TransitionProvider';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { GridLines } from '@/components/layout/GridLines';
import { ImageOverrides } from '@/components/ui/ImageOverrides';
import { JsonLd } from '@/components/seo/JsonLd';
import { organizationLd, websiteLd } from '@/lib/seo';
import { getContact, getCountries, getBlock, getImageOverrides, getPages, getNavigation } from '@/server/content';
import { setImageOverrides } from '@/content/images';

/** Public website shell. All shared content (contact details, countries, footer text, images) comes from the database. */
// true (unknown languages are rejected below) so pages regenerate correctly after a dashboard save
export const dynamicParams = true;
export const generateStaticParams = () => locales.map((lang) => ({ lang }));

export default async function SiteLayout({ children, params }: { children: React.ReactNode; params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  setLocale(lang);
  const [contact, countries, footer, overrides, pages, messages, nav] = await Promise.all([getContact(), getCountries(), getBlock('footer'), getImageOverrides(), getPages(), getMessages(lang), getNavigation()]);
  const extraNav = pages.filter((p) => p.showInMenu).map((p) => ({ label: p.title, href: `/${p.slug}` }));
  setImageOverrides(overrides); // server render
  const countryLinks = countries.map(({ slug, name, code }) => ({ slug, name, code }));
  return (
    <div lang={lang} dir={dirOf(lang)} className={`site site--${lang}`}>
      <JsonLd data={[organizationLd, websiteLd]} />
      <I18nProvider locale={lang} messages={messages}>
      <ImageOverrides overrides={overrides}>
        <MotionProvider>
          <TransitionProvider>
            <a className="skip-link" href="#main">
              Skip to content
            </a>
            <Header contact={contact} countries={countryLinks} extraNav={extraNav} nav={nav} />
            <div className="page" data-blur>
              <main id="main">{children}</main>
              <Footer contact={contact} countries={countryLinks} text={footer} extraNav={extraNav} nav={nav} />
            </div>
            <GridLines />
          </TransitionProvider>
        </MotionProvider>
      </ImageOverrides>
      </I18nProvider>
    </div>
  );
}
