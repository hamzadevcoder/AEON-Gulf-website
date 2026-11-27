import type { Metadata } from 'next';
import { setLocale, getT } from '@/i18n/server';
import { pageMetadata, breadcrumbLd, abs } from '@/lib/seo';
import { JsonLd } from '@/components/seo/JsonLd';
import { PageHero } from '@/components/sections/shared/PageHero';
import { CtaBand } from '@/components/sections/shared/CtaBand';
import { Stairs } from '@/components/motion/Stairs';
import { ScrubText } from '@/components/motion/ScrubText';
import { Fade } from '@/components/motion/Fade';
import { Eyebrow } from '@/components/ui/Eyebrow';
import { Button } from '@/components/ui/Button';
import { Photo } from '@/components/ui/Photo';
import { TransitionLink } from '@/components/motion/TransitionLink';
import { catalogue, groupOrder, servicePath } from '@/content/services';
import { getBlock, getCountries, getServices } from '@/server/content';
import { fill } from '@/content/blocks';
import { image, groupImages } from '@/content/images';

type P = { params: Promise<{ lang: string }> };
export async function generateMetadata({ params }: P): Promise<Metadata> {
  const { lang } = await params;
  setLocale(lang);
  const tr = await getT();
  return pageMetadata({ title: tr('meta.services.title'), description: tr('meta.services.desc'), path: '/services' });
}

export default async function ServicesPage({ params }: P) {
  setLocale((await params).lang);
  const tr = await getT();
  const [t, services, countries] = await Promise.all([getBlock('services.hub'), getServices(), getCountries()]);
  const rows = catalogue(services);
  return (
    <>
      <JsonLd
        data={[
          breadcrumbLd([{ name: tr('common.home'), path: '/' }, { name: tr('common.services'), path: '/services' }]),
          {
            '@context': 'https://schema.org',
            '@type': 'ItemList',
            name: tr('hub.listName'),
            itemListElement: rows.map((r, i) => ({ '@type': 'ListItem', position: i + 1, name: r.name, url: abs(servicePath(r.countries[0])) })),
          },
        ]}
      />
      <PageHero
        eyebrow={t.eyebrow}
        title={t.title}
        titleSoft={t.titleSoft}
        subtitle={fill(t.subtitle, { count: services.length })}
        image={image('boardroom')}
        crumbs={[{ label: tr('common.home'), href: '/' }, { label: tr('common.services') }]}
      >
        {countries.map((c) => (
          <Button key={c.slug} href={`/${c.slug}`} variant="light">
            {c.name}
          </Button>
        ))}
      </PageHero>

      {groupOrder.map((g, gi) => {
        const groupRows = rows.filter((r) => r.group === g);
        return (
          <section key={g} id={g} className={`section ${gi % 2 ? 'tone-ice' : 'tone-white'} svc-group`} aria-labelledby={`g-${g}`}>
            <Stairs />
            <div className="grid4 svc-group__head">
              <div className="svc-group__intro">
                <Eyebrow>{String(gi + 1).padStart(2, '0')}</Eyebrow>
                <h2 id={`g-${g}`} className="h-big">
                  {tr(g === 'pro' ? 'group.proGro' : `group.${g}`)}
                </h2>
                <ScrubText className="svc-group__lead">{tr(`group.${g}.intro`)}</ScrubText>
              </div>
              <div className="svc-group__photo">
                <Photo {...image(groupImages[g])} reveal />
              </div>
            </div>
            <Fade as="ul" className="cat-list" childrenStagger y={30} stagger={0.04}>
              {groupRows.map((r) => (
                <li className="cat-row" key={r.slug}>
                  <span className="cat-row__name h-6">{r.name}</span>
                  <span className="cat-row__links">
                    {countries.map((c) => {
                      const s = r.countries.find((x) => x.country === c.slug);
                      return s ? (
                        <TransitionLink key={c.slug} href={servicePath(s)} className="cat-chip" aria-label={tr('hub.nameIn', { service: r.name, country: c.name })}>
                          {c.name}
                        </TransitionLink>
                      ) : (
                        <span key={c.slug} className="cat-chip cat-chip--off" aria-label={tr('hub.notOffered', { country: c.name })}>
                          {c.name}
                        </span>
                      );
                    })}
                  </span>
                </li>
              ))}
            </Fade>
          </section>
        );
      })}

      <CtaBand
        heading={t.ctaHeading}
        text={t.ctaText}
        primary={{ label: tr('common.getQuote'), href: '/quote' }}
        secondary={{ label: tr('common.aboutUs'), href: '/about' }}
      />
    </>
  );
}
