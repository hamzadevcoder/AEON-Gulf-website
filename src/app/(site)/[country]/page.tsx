import type { Metadata } from 'next';
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
import { groupInfo, groupOrder, servicePath, servicesFor, type CountrySlug } from '@/content/services';
import { countrySlugs } from '@/content/site';
import { image, countryImages } from '@/content/images';

// true (with notFound() for unknown slugs) so on-demand regeneration after a dashboard save works.
export const dynamicParams = true;
export const generateStaticParams = () => countrySlugs.map((country) => ({ country }));

type Params = { params: Promise<{ country: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { country } = await params;
  const [countries, services] = await Promise.all([getCountries(), getServices()]);
  const c = countries.find((x) => x.slug === country);
  if (!c) {
    const page = await getPage(country);
    if (!page) return {};
    return pageMetadata({ title: page.metaTitle || page.title, description: page.metaDescription || `${page.title}: business setup and corporate services in Kuwait, Qatar and Saudi Arabia from AEON Gulf.`, path: `/${page.slug}` });
  }
  return pageMetadata({
    title: `Business Setup Services in ${c.name}`,
    description: `Company formation, ${c.slug === 'saudi-arabia' ? 'GRO' : 'PRO'} services, annual compliance, accounting and relocation in ${c.name}. ${servicesFor(services, c.slug).length} services from AEON Gulf. Get a quote.`,
    path: `/${c.slug}`,
  });
}

export default async function CountryPage({ params }: Params) {
  const { country } = await params;
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
  const proLabel = c.slug === 'saudi-arabia' ? 'GRO Services' : 'PRO Services';

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
              name: `Services in ${c.name}`,
              itemListElement: list.map((s) => ({ '@type': 'Offer', itemOffered: { '@type': 'Service', name: s.name, url: abs(servicePath(s)) } })),
            },
          },
          breadcrumbLd([{ name: 'Home', path: '/' }, { name: c.name, path: `/${c.slug}` }]),
        ]}
      />
      <PageHero
        eyebrow={`AEON Gulf ${c.name}`}
        title={fill(t.title, vars)}
        titleSoft={fill(t.titleSoft, vars)}
        subtitle={c.intro}
        image={image(countryImages[c.slug as CountrySlug].banner)}
        crumbs={[{ label: 'Home', href: '/' }, { label: c.name }]}
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
          {`Get a ${c.name} quote`}
        </Button>
        <Button href="#country-services" variant="dark">
          {`${list.length} services`}
        </Button>
      </PageHero>

      <section className="section tone-white country-intro">
        <Stairs />
        <div className="grid4">
          <div className="country-intro__side">
            <Eyebrow>{`Why AEON Gulf in ${c.name}`}</Eyebrow>
            <Photo {...image(countryImages[c.slug as CountrySlug].card)} reveal className="country-intro__photo" />
          </div>
          <div className="country-intro__main">
            <ScrubText className="h-statement">
              {fill(t.statement, vars)}
            </ScrubText>
            <Fade className="country-intro__links">
              <p className="eyebrow eyebrow--small">Jump to</p>
              <ul>
                {groupOrder.map((g) => {
                  const n = list.filter((s) => s.group === g).length;
                  return (
                    <li key={g}>
                      <TransitionLink href={`#${g}`}>
                        <ArrowIcon /> {g === 'pro' ? proLabel : groupInfo[g].label} <span>({n})</span>
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
            <Eyebrow>{`AEON Gulf in ${c.name}`}</Eyebrow>
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
                  <Eyebrow>{`${String(gi + 1).padStart(2, '0')} / ${items.length} services in ${c.name}`}</Eyebrow>
                  <SplitReveal as="h2" className="h-big" id={`cg-${g}`}>
                    {g === 'pro' ? proLabel : groupInfo[g].label}
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
          <Eyebrow className="center">{`Authorities we work with in ${c.name}`}</Eyebrow>
          <ScrubText as="h2" className="h-statement center" from={0.25}>
            {`One team handling your filings with every ${c.name} authority involved.`}
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
            <Eyebrow>{`Contact our ${c.name} team`}</Eyebrow>
            <SplitReveal as="h2" className="h-big" id="cc-h">
              {`Talk to us about ${c.name}.`}
            </SplitReveal>
            <Fade className="country-contact__details" childrenStagger>
              <div>
                <p className="eyebrow eyebrow--small">Office</p>
                <p>{office?.detail}</p>
              </div>
              <div>
                <p className="eyebrow eyebrow--small">Phone</p>
                {office?.phone ? (
                  <a href={`tel:${office.phone.replace(/\s/g, '')}`}>
                    <ArrowIcon /> {office.phone}
                  </a>
                ) : (
                  <p>To be confirmed</p>
                )}
              </div>
              <div>
                <p className="eyebrow eyebrow--small">Email</p>
                <a href={`mailto:${contact.email}?subject=${encodeURIComponent(`Enquiry: ${c.name}`)}`}>
                  <ArrowIcon /> {contact.email}
                </a>
              </div>
            </Fade>
            <Fade>
              <Button href={`/quote?country=${c.slug}`}>{`Get a ${c.name} quote`}</Button>
            </Fade>
          </div>
          <div className="country-contact__others">
            <p className="eyebrow eyebrow--small">Other markets</p>
            {others.map((o) => (
              <TransitionLink key={o.slug} href={`/${o.slug}`} className="mini-country">
                <Photo {...image(countryImages[o.slug as CountrySlug].card)} className="mini-country__photo" />
                <span className="mini-country__shade" aria-hidden="true" />
                <span className="mini-country__name h-card">{o.name}</span>
                <span className="mini-country__go">
                  <ArrowIcon /> View services
                </span>
              </TransitionLink>
            ))}
          </div>
        </div>
      </section>

      <CtaBand
        heading={`Start your journey in ${c.name}.`}
        text="Share a few details and we will come back with the steps, timeline and a quote for your situation."
        primary={{ label: 'Get a quote', href: `/quote?country=${c.slug}` }}
        secondary={{ label: 'All services', href: '/services' }}
      />
    </>
  );
}
