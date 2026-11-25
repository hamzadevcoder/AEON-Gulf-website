import 'lenis/dist/lenis.css';
import { MotionProvider } from '@/components/motion/MotionProvider';
import { TransitionProvider } from '@/components/motion/TransitionProvider';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { GridLines } from '@/components/layout/GridLines';
import { ImageOverrides } from '@/components/ui/ImageOverrides';
import { JsonLd } from '@/components/seo/JsonLd';
import { organizationLd, websiteLd } from '@/lib/seo';
import { getContact, getCountries, getBlock, getImageOverrides, getPages } from '@/server/content';
import { setImageOverrides } from '@/content/images';

/** Public website shell. All shared content (contact details, countries, footer text, images) comes from the database. */
export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const [contact, countries, footer, overrides, pages] = await Promise.all([getContact(), getCountries(), getBlock('footer'), getImageOverrides(), getPages()]);
  const extraNav = pages.filter((p) => p.showInMenu).map((p) => ({ label: p.title, href: `/${p.slug}` }));
  setImageOverrides(overrides); // server render
  const countryLinks = countries.map(({ slug, name, code }) => ({ slug, name, code }));
  return (
    <>
      <JsonLd data={[organizationLd, websiteLd]} />
      <ImageOverrides overrides={overrides}>
        <MotionProvider>
          <TransitionProvider>
            <a className="skip-link" href="#main">
              Skip to content
            </a>
            <Header contact={contact} countries={countryLinks} extraNav={extraNav} />
            <div className="page" data-blur>
              <main id="main">{children}</main>
              <Footer contact={contact} countries={countryLinks} text={footer} extraNav={extraNav} />
            </div>
            <GridLines />
          </TransitionProvider>
        </MotionProvider>
      </ImageOverrides>
    </>
  );
}
