import type { Metadata } from 'next';
import { setLocale, getT } from '@/i18n/server';
import { pageMetadata, breadcrumbLd, abs, SITE_NAME } from '@/lib/seo';
import { JsonLd } from '@/components/seo/JsonLd';
import { notFound } from 'next/navigation';
import { PageHero } from '@/components/sections/shared/PageHero';
import { ServiceList } from '@/components/sections/shared/ServiceList';
import { CtaBand } from '@/components/sections/shared/CtaBand';
import { Stairs } from '@/components/motion/Stairs';
import { ScrubText } from '@/components/motion/ScrubText';
import { SplitReveal } from '@/components/motion/SplitReveal';
import { Marquee } from '@/components/motion/Marquee';
import { Fade } from '@/components/motion/Fade';
import { Eyebrow } from '@/components/ui/Eyebrow';
import { Button, ArrowIcon } from '@/components/ui/Button';
import { Photo } from '@/components/ui/Photo';
import { TransitionLink } from '@/components/motion/TransitionLink';
import { getBlock, getContact, getCountries, getPage, getServices } from '@/server/content';
import { CustomPage } from '@/components/sections/custom/CustomPage';
import { fill } from '@/content/blocks';
import { groupOrder, servicePath, servicesFor, type CountrySlug } from '@/content/services';
import { countrySlugs } from '@/content/site';
import { image, countryImages } from '@/content/images';

// true (with notFound() for unknown slugs) so on-demand regeneration after a dashboard save works.
export const dynamicParams = true;
export const generateStaticParams = () => countrySlugs.map((country) => ({ country }));

type Params = { params: Promise<{ country: string; lang: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { country, lang } = await params;
  setLocale(lang);
  const t = await getT();
  const [countries, services] = await Promise.all([getCountries(), getServices()]);
  const c = countries.find((x) => x.slug === country);
  if (!c) {
    const page = await getPage(country);
    if (!page) return {};
    return pageMetadata({ title: page.metaTitle || page.title, description: page.metaDescription || t('meta.page.desc', { title: page.title }), path: `/${page.slug}` });
  }
  return pageMetadata({
    title: t('country.metaTitle', { country: c.name }),
    description: t('country.metaDesc', { pro: c.slug === 'saudi-arabia' ? 'GRO' : 'PRO', country: c.name, n: servicesFor(services, c.slug).length }),
    path: `/${c.slug}`,
  });
}

export default async function CountryPage({ params }: Params) {
  const { country, lang } = await params;
  setLocale(lang);
  const tr = await getT();
  const [countries, services, contact, t] = await Promise.all([getCountries(), getServices(), getContact(), getBlock('country.common')]);
  const c = countries.find((x) => x.slug === country);
  if (!c) {
    // not a country: it may be a page built in the dashboard
    const page = await getPage(country);
    if (!page) notFound();
    return <CustomPage page={page} />;
  }
  const vars = { country: c.name };
  const list = servicesFor(services, c.slug);
  const office = contact.offices.find((o) => o.slug === c.slug);
  const others = countries.filter((x) => x.slug !== c.slug);
  const proLabel = tr(c.slug === 'saudi-arabia' ? 'group.gro' : 'group.pro');

  return (
    <>
      <JsonLd
        data={[
          {
            '@context': 'https://schema.org',
            '@type': 'ProfessionalService',
            '@id': abs(`/${c.slug}#service`),
            name: `${SITE_NAME} ${c.name}`,
            url: abs(`/${c.slug}`),
            description: c.intro,
            email: contact.email,
            telephone: office?.phone ?? undefined,
            areaServed: { '@type': 'Country', name: c.name },
            parentOrganization: { '@id': abs('/#organization') },
            hasOfferCatalog: {
              '@type': 'OfferCatalog',
              name: tr('country.servicesIn', { country: c.name }),
              itemListElement: list.map((s) => ({ '@type': 'Offer', itemOffered: { '@type': 'Service', name: s.name, url: abs(servicePath(s)) } })),
            },
          },
          breadcrumbLd([{ name: tr('common.home'), path: '/' }, { name: c.name, path: `/${c.slug}` }]),
        ]}
      />
      <PageHero
        eyebrow={tr('country.eyebrow', { country: c.name })}
        title={fill(t.title, vars)}
        titleSoft={fill(t.titleSoft, vars)}
        subtitle={c.intro}
        image={image(countryImages[c.slug as CountrySlug].banner)}
        crumbs={[{ label: tr('common.home'), href: '/' }, { label: c.name }]}
        aside={
          <dl className="facts">
            {c.quickFacts.map((f) => (
              <div key={f.label}>
                <dt>{f.label}</dt>
                <dd>{f.value}</dd>
              </div>
            ))}
          </dl>
        }
      >
        <Button href={`/quote?country=${c.slug}`} variant="light">
          {tr('country.getQuote', { country: c.name })}
        </Button>
        <Button href="#country-services" variant="dark">
          {tr('country.servicesCount', { n: list.length })}
        </Button>
      </PageHero>

      <section className="section tone-white country-intro">
        <Stairs />
        <div className="grid4">
          <div className="country-intro__side">
            <Eyebrow>{tr('country.why', { country: c.name })}</Eyebrow>
            <Photo {...image(countryImages[c.slug as CountrySlug].card)} reveal className="country-intro__photo" />
          </div>
          <div className="country-intro__main">
            <ScrubText className="h-statement">
              {fill(t.statement, vars)}
            </ScrubText>
            <Fade className="country-intro__links">
              <p className="eyebrow eyebrow--small">{tr('country.jumpTo')}</p>
              <ul>
                {groupOrder.map((g) => {
                  const n = list.filter((s) => s.group === g).length;
                  return (
                    <li key={g}>
                      <TransitionLink href={`#${g}`}>
                        <ArrowIcon /> {g === 'pro' ? proLabel : tr(`group.${g}`)} <span>({n})</span>
                      </TransitionLink>
                    </li>
                  );
                })}
              </ul>
            </Fade>
          </div>
        </div>
      </section>

      <section className="section tone-ice country-promises" aria-labelledby="promises-h">
        <Stairs />
        <div className="grid4">
          <div className="country-promises__head">
            <Eyebrow>{tr('country.inEyebrow', { country: c.name })}</Eyebrow>
            <SplitReveal as="h2" className="h-big" id="promises-h">
              {fill(t.promisesHeading, vars)}
            </SplitReveal>
          </div>
          <Fade as="ol" className="promises" childrenStagger>
            {t.promises.map((p, i) => (
              <li key={i}>
                <span className="promises__n">{String(i + 1).padStart(2, '0')}</span>
                <h3 className="h-card">{p.title}</h3>
                <p>{fill(p.text, vars)}</p>
              </li>
            ))}
          </Fade>
        </div>
      </section>

      <div id="country-services">
        {groupOrder.map((g, gi) => {
          const items = list.filter((s) => s.group === g);
          if (!items.length) return null;
          return (
            <section key={g} id={g} className={`section ${gi % 2 ? 'tone-white' : 'tone-ice'} svc-group`} aria-labelledby={`cg-${g}`}>
              <Stairs />
              <div className="grid4 svc-group__head">
                <div className="svc-group__intro">
                  <Eyebrow>{tr('country.groupCount', { num: String(gi + 1).padStart(2, '0'), n: items.length, country: c.name })}</Eyebrow>
                  <SplitReveal as="h2" className="h-big" id={`cg-${g}`}>
                    {g === 'pro' ? proLabel : tr(`group.${g}`)}
                  </SplitReveal>
                </div>
              </div>
              <ServiceList items={items.map((s) => ({ name: s.name, body: s.listing.body, href: servicePath(s) }))} />
            </section>
          );
        })}
      </div>

      <section className="section tone-black country-auth" data-tone="dark" aria-labelledby="auth-h">
        <Stairs />
        <div className="authorities__inner">
          <Eyebrow className="center">{tr('country.authEyebrow', { country: c.name })}</Eyebrow>
          <ScrubText as="h2" className="h-statement center" from={0.25}>
            {tr('country.authStatement', { country: c.name })}
          </ScrubText>
        </div>
        <Marquee className="authorities__marquee" speed={45}>
          {c.authorityList.map((a) => (
            <span className="authorities__item" key={a}>
              {a}
            </span>
          ))}
        </Marquee>
      </section>

      <section className="section tone-white country-contact" aria-labelledby="cc-h">
        <Stairs />
        <div className="grid4">
          <div className="country-contact__main">
            <Eyebrow>{tr('country.contactEyebrow', { country: c.name })}</Eyebrow>
            <SplitReveal as="h2" className="h-big" id="cc-h">
              {tr('country.talk', { country: c.name })}
            </SplitReveal>
            <Fade className="country-contact__details" childrenStagger>
              <div>
                <p className="eyebrow eyebrow--small">{tr('common.office')}</p>
                <p>{office?.detail}</p>
              </div>
              <div>
                <p className="eyebrow eyebrow--small">{tr('common.phone')}</p>
                {office?.phone ? (
                  <a href={`tel:${office.phone.replace(/\s/g, '')}`}>
                    <ArrowIcon /> {office.phone}
                  </a>
                ) : (
                  <p>{tr('common.toBeConfirmed')}</p>
                )}
              </div>
              <div>
                <p className="eyebrow eyebrow--small">{tr('common.email')}</p>
                <a href={`mailto:${contact.email}?subject=${encodeURIComponent(`Enquiry: ${c.name}`)}`}>
                  <ArrowIcon /> {contact.email}
                </a>
              </div>
            </Fade>
            <Fade>
              <Button href={`/quote?country=${c.slug}`}>{tr('country.getQuote', { country: c.name })}</Button>
            </Fade>
          </div>
          <div className="country-contact__others">
            <p className="eyebrow eyebrow--small">{tr('country.otherMarkets')}</p>
            {others.map((o) => (
              <TransitionLink key={o.slug} href={`/${o.slug}`} className="mini-country">
                <Photo {...image(countryImages[o.slug as CountrySlug].card)} className="mini-country__photo" />
                <span className="mini-country__shade" aria-hidden="true" />
                <span className="mini-country__name h-card">{o.name}</span>
                <span className="mini-country__go">
                  <ArrowIcon /> {tr('common.viewServices')}
                </span>
              </TransitionLink>
            ))}
          </div>
        </div>
      </section>

      <CtaBand
        heading={tr('country.ctaHeading', { country: c.name })}
        text={tr('country.ctaText')}
        primary={{ label: tr('common.getQuote'), href: `/quote?country=${c.slug}` }}
        secondary={{ label: tr('common.allServices'), href: '/services' }}
      />
    </>
  );
}
