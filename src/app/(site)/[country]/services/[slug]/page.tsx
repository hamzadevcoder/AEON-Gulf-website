import type { Metadata } from 'next';
import { pageMetadata, breadcrumbLd, abs, SITE_NAME } from '@/lib/seo';
import { JsonLd } from '@/components/seo/JsonLd';
import { notFound } from 'next/navigation';
import { PageHero } from '@/components/sections/shared/PageHero';
import { StepsIndex } from '@/components/sections/shared/StepsIndex';
import { Faq } from '@/components/sections/shared/Faq';
import { SubNav } from '@/components/sections/shared/SubNav';
import { QuoteForm } from '@/components/sections/quote/QuoteForm';
import { Stairs } from '@/components/motion/Stairs';
import { ScrubText } from '@/components/motion/ScrubText';
import { SplitReveal } from '@/components/motion/SplitReveal';
import { Fade } from '@/components/motion/Fade';
import { Stack } from '@/components/motion/Stack';
import { Odometer } from '@/components/motion/Odometer';
import { Marquee } from '@/components/motion/Marquee';
import { Eyebrow } from '@/components/ui/Eyebrow';
import { Button, ArrowIcon } from '@/components/ui/Button';
import { Photo } from '@/components/ui/Photo';
import { Flag } from '@/components/ui/Flag';
import { TransitionLink } from '@/components/motion/TransitionLink';
import { services as builtInServices, servicesFor, findService, related, siblings, servicePath, splitHeading, type CountrySlug } from '@/content/services';
import { getContact, getCountries, getQuoteOptions, getServices } from '@/server/content';
import { image, groupImages, countryImages } from '@/content/images';

// Pre-render every service at build; services added later in the dashboard render on first visit, then stay cached.
export const dynamicParams = true;
export async function generateStaticParams() {
  const list = await getServices().catch(() => builtInServices);
  return list.map((s) => ({ country: s.country, slug: s.slug }));
}

type Params = { params: Promise<{ country: string; slug: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { country, slug } = await params;
  const s = findService(await getServices(), country, slug);
  if (!s) return {};
  return { ...pageMetadata({ title: s.metaTitle, description: s.metaDescription, path: servicePath(s), absoluteTitle: true }), keywords: s.keywords };
}

export default async function ServicePage({ params }: Params) {
  const { country, slug } = await params;
  const [services, countries, contact, options] = await Promise.all([getServices(), getCountries(), getContact(), getQuoteOptions()]);
  const s = findService(services, country, slug);
  if (!s) notFound();
  const c = countries.find((x) => x.slug === s.country)!;
  const [title, soft] = splitHeading(s.hero.heading, s.countryName);
  const more = related(services, s, 3);
  const elsewhere = siblings(services, s);
  const inCountry = servicesFor(services, s.country);
  const inGroup = inCountry.filter((x) => x.group === s.group).length;
  const quote = `/quote?country=${s.country}&service=${encodeURIComponent(s.name)}`;
  const office = contact.offices.find((o) => o.slug === s.country);

  const sections = [
    { id: 'overview', label: 'Overview' },
    { id: 'benefits', label: 'Benefits' },
    { id: 'process', label: 'Process' },
    { id: 'faqs', label: 'FAQs' },
    { id: 'request-quote', label: 'Get a quote' },
  ];

  const jsonLd = [
    {
      '@context': 'https://schema.org',
      '@type': 'Service',
      name: s.hero.heading,
      description: s.metaDescription,
      url: abs(servicePath(s)),
      serviceType: s.name,
      category: s.groupLabel,
      areaServed: { '@type': 'Country', name: s.countryName },
      provider: { '@type': 'Organization', '@id': abs('/#organization'), name: SITE_NAME, email: contact.email },
    },
    {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: s.faqs.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
    },
    breadcrumbLd([
      { name: 'Home', path: '/' },
      { name: s.countryName, path: `/${s.country}` },
      { name: s.name, path: servicePath(s) },
    ]),
  ];

  return (
    <>
      <JsonLd data={jsonLd} />

      {/* 1. Hero with an "at a glance" panel */}
      <PageHero
        eyebrow={s.groupLabel}
        title={title}
        titleSoft={soft || undefined}
        subtitle={s.hero.subtitle}
        image={image(countryImages[s.country as CountrySlug].banner)}
        crumbs={[{ label: 'Home', href: '/' }, { label: s.countryName, href: `/${s.country}` }, { label: 'Services', href: `/${s.country}#${s.group}` }, { label: s.name }]}
        aside={
          <dl className="facts">
            <div>
              <dt>Country</dt>
              <dd className="facts__flag">
                <Flag country={s.country} size={18} /> {s.countryName}
              </dd>
            </div>
            <div>
              <dt>Service group</dt>
              <dd>{s.groupLabel}</dd>
            </div>
            <div>
              <dt>How it works</dt>
              <dd>{s.steps.items.length}-step process, handled by our team</dd>
            </div>
            {elsewhere.length > 0 && (
              <div>
                <dt>Also available in</dt>
                <dd>{elsewhere.map((e) => e.countryName).join(' and ')}</dd>
              </div>
            )}
          </dl>
        }
      >
        <Button href={quote} variant="light">
          {s.cta.text}
        </Button>
        <Button href={`/${s.country}#country-services`} variant="dark">
          {`All ${s.countryName} services`}
        </Button>
      </PageHero>

      <SubNav items={sections} />

      {/* 2. Overview */}
      <section id="overview" className="section tone-white svc-why" aria-labelledby="why-h">
        <Stairs />
        <div className="grid4">
          <div className="svc-why__side">
            <Eyebrow>Overview</Eyebrow>
            <Photo {...image(groupImages[s.group as keyof typeof groupImages])} reveal className="svc-why__photo" />
          </div>
          <div className="svc-why__main">
            <h2 id="why-h" className="svc-why__heading h-mid">
              {s.why.heading}
            </h2>
            <ScrubText className="h-statement">{s.why.description}</ScrubText>
            <Fade className="svc-overview__foot">
              <p>{s.listing.body}</p>
              <Button href={quote}>{s.cta.text}</Button>
            </Fade>
          </div>
        </div>
      </section>

      {/* 3. Benefits as sticky stacking cards */}
      <section id="benefits" className="section tone-ice svc-benefits" aria-labelledby="ben-h">
        <Stairs />
        <div className="grid4">
          <div className="svc-benefits__intro">
            <Eyebrow>What you get</Eyebrow>
            <SplitReveal as="h2" className="h-big" id="ben-h">
              {`Why companies choose AEON Gulf for ${s.name.toLowerCase()}`}
            </SplitReveal>
            <Fade as="p" className="svc-benefits__text">
              {`Three reasons our ${s.countryName} clients rely on us for this service.`}
            </Fade>
          </div>
          <Stack className="svc-benefits__stack">
            {s.benefits.map((b, i) => (
              <article className="value-card benefit-stack" data-stack-card key={b.title}>
                <Eyebrow className="eyebrow--small">{`Benefit ${i + 1}`}</Eyebrow>
                <div>
                  <h3 className="h-mid">{b.title}</h3>
                  <p className="benefit-stack__text">{b.text}</p>
                </div>
                <span className="value-card__num" aria-hidden="true">
                  {String(i + 1).padStart(2, '0')}
                </span>
              </article>
            ))}
          </Stack>
        </div>
      </section>

      {/* 4. Full-bleed image band */}
      <section className="section tone-black svc-band" data-tone="dark" aria-label={s.cta.heading}>
        <Stairs />
        <div className="svc-band__media" aria-hidden="true">
          <Photo {...image(countryImages[s.country as CountrySlug].card)} alt="" parallax={0.22} tone="dark" />
        </div>
        <div className="svc-band__inner">
          <Eyebrow className="center">{`AEON Gulf ${s.countryName}`}</Eyebrow>
          <ScrubText className="h-statement center" from={0.25}>
            {s.cta.description}
          </ScrubText>
          <Fade className="center svc-band__cta">
            <Button href={quote} variant="light">
              {s.cta.text}
            </Button>
          </Fade>
        </div>
      </section>

      {/* 5. Process */}
      <section id="process" className="section tone-ice svc-steps" aria-labelledby="steps-h">
        <Stairs />
        <div className="grid4 svc-steps__head">
          <Eyebrow className="svc-steps__eyebrow">How it works</Eyebrow>
          <SplitReveal as="h2" className="h-big svc-steps__title" id="steps-h">
            {s.steps.heading}
          </SplitReveal>
        </div>
        <StepsIndex items={s.steps.items} />
      </section>

      {/* 6. Numbers band */}
      <section className="section tone-charcoal numbers svc-numbers" data-tone="dark" aria-labelledby="num-h">
        <Stairs />
        <div className="grid4">
          <div className="numbers__intro">
            <Eyebrow>{`AEON Gulf in ${s.countryName}`}</Eyebrow>
            <SplitReveal as="h2" className="h-big" id="num-h">
              One partner
              <br />
              <span className="tone-2">for every filing that follows.</span>
            </SplitReveal>
            <Fade as="p" className="numbers__text">
              {`${s.name} is one of ${inCountry.length} services we offer in ${s.countryName}, so the steps that come after it are handled by the same team.`}
            </Fade>
            <Marquee className="svc-numbers__marquee" speed={40}>
              {c.authorityList.map((a) => (
                <span className="authorities__item" key={a}>
                  {a}
                </span>
              ))}
            </Marquee>
          </div>
          <div className="numbers__grid">
            {[
              { value: String(inCountry.length), suffix: '', label: `Services available in ${s.countryName}` },
              { value: String(inGroup), suffix: '', label: `${s.groupLabel} in ${s.countryName}` },
              { value: String(s.steps.items.length), suffix: '', label: 'Clear steps from start to finish' },
              { value: '3', suffix: '', label: 'Gulf markets with one point of contact' },
            ].map((n) => (
              <div className="stat" key={n.label}>
                <Odometer value={n.value} suffix={n.suffix} className="stat__value" />
                <p className="stat__label">{n.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 7. FAQs */}
      <section id="faqs" className="section tone-white svc-faq" aria-labelledby="faq-h">
        <Stairs />
        <div className="grid4">
          <div className="svc-faq__intro">
            <Eyebrow>Questions and answers</Eyebrow>
            <SplitReveal as="h2" className="h-big" id="faq-h">
              {`${s.name} in ${s.countryName}:`}
              <br />
              <span className="tone-2">what clients ask us.</span>
            </SplitReveal>
            <Fade className="svc-faq__ask">
              <p>Have a question that isn’t covered here?</p>
              <Button href="/contact">Ask our team</Button>
            </Fade>
          </div>
          <div className="svc-faq__list">
            <Faq items={s.faqs} />
          </div>
        </div>
      </section>

      {/* 8. Related services and the same service in other markets */}
      <section className="section tone-black svc-related" data-tone="dark" aria-labelledby="rel-h">
        <Stairs />
        <div className="grid4 svc-related__head">
          <div className="svc-related__title">
            <Eyebrow>{`More ${s.groupLabel.toLowerCase()} in ${s.countryName}`}</Eyebrow>
            <SplitReveal as="h2" className="h-big" id="rel-h">
              Related services
            </SplitReveal>
          </div>
        </div>
        <Fade className="related-grid" childrenStagger>
          {more.map((r) => (
            <TransitionLink key={r.slug} href={servicePath(r)} className="related-card">
              <h3 className="h-6">{r.name}</h3>
              <p>{r.listing.body}</p>
              <span className="related-card__go">
                <ArrowIcon /> Explore
              </span>
            </TransitionLink>
          ))}
        </Fade>
        {elsewhere.length > 0 && (
          <div className="svc-markets">
            <p className="eyebrow">{`${s.name} in other markets`}</p>
            <Fade className="svc-markets__grid" childrenStagger>
              {elsewhere.map((e) => (
                <TransitionLink key={e.country} href={servicePath(e)} className="market-card">
                  <Photo {...image(countryImages[e.country as CountrySlug].card)} className="market-card__photo" />
                  <span className="market-card__shade" aria-hidden="true" />
                  <span className="market-card__body">
                    <span className="market-card__name">
                      <Flag country={e.country} size={18} /> {e.countryName}
                    </span>
                    <span className="market-card__text">{e.hero.subtitle}</span>
                    <span className="related-card__go">
                      <ArrowIcon /> {`View in ${e.countryName}`}
                    </span>
                  </span>
                </TransitionLink>
              ))}
            </Fade>
          </div>
        )}
      </section>

      {/* 9. Inline quote request */}
      <section id="request-quote" className="section tone-ice svc-quote" aria-labelledby="sq-h">
        <Stairs />
        <div className="grid4">
          <div className="svc-quote__intro">
            <Eyebrow>Let’s start</Eyebrow>
            <SplitReveal as="h2" className="h-big" id="sq-h">
              {s.cta.heading}
            </SplitReveal>
            <Fade as="p" className="cta__text">
              {s.cta.description}
            </Fade>
            <Fade className="svc-quote__contact">
              <p className="eyebrow eyebrow--small">{`Our ${s.countryName} team`}</p>
              <p>{office?.detail}</p>
              <a href={`mailto:${contact.email}?subject=${encodeURIComponent(`${s.name} (${s.countryName})`)}`}>
                <ArrowIcon /> {contact.email}
              </a>
              {office?.phone && (
                <a href={`tel:${office.phone.replace(/\s/g, '')}`}>
                  <ArrowIcon /> {office.phone}
                </a>
              )}
            </Fade>
          </div>
          <Fade className="svc-quote__form">
            <QuoteForm options={options} country={s.country} service={s.name} compact title={`Request a ${s.name.toLowerCase()} quote`} />
          </Fade>
        </div>
      </section>
    </>
  );
}
