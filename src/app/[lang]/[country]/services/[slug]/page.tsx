import type { Metadata } from 'next';
import { setLocale, getT } from '@/i18n/server';
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

type Params = { params: Promise<{ country: string; slug: string; lang: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { country, slug, lang } = await params;
  setLocale(lang);
  const s = findService(await getServices(), country, slug);
  if (!s) return {};
  return { ...pageMetadata({
      title: s.metaTitle, description: s.metaDescription, path: servicePath(s), absoluteTitle: true, noindex: !s.translated,
      alternate: Boolean(findService(await getServices('ar'), country, slug)?.translated),
    }), keywords: s.keywords };
}

export default async function ServicePage({ params }: Params) {
  const { country, slug, lang } = await params;
  setLocale(lang);
  const t = await getT();
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

  if (!s.translated) {
    return (
      <>
        <PageHero
          eyebrow={s.groupLabel}
          title={title}
          titleSoft={soft || undefined}
          subtitle={t('svc.arPending')}
          image={image(countryImages[s.country as CountrySlug].banner)}
          crumbs={[{ label: t('common.home'), href: '/' }, { label: s.countryName, href: `/${s.country}` }, { label: s.name }]}
        >
          <Button href={quote} variant="light">
            {t('common.getQuote')}
          </Button>
          <a className="arrow-link arrow-link--light" href={servicePath(s)} lang="en" hrefLang="en">
            <ArrowIcon /> {t('svc.readEnglish')}
          </a>
        </PageHero>
        <section id="request-quote" className="section tone-ice svc-quote">
          <div className="grid4">
            <div className="svc-quote__intro">
              <Eyebrow>{t('common.letsStart')}</Eyebrow>
              <SplitReveal as="h2" className="h-big">
                {t('svc.titleIn', { service: s.name, country: s.countryName })}
              </SplitReveal>
              <Fade as="p" className="cta__text">
                {t('svc.arPendingText')}
              </Fade>
            </div>
            <Fade className="svc-quote__form">
              <QuoteForm options={options} country={s.country} service={s.name} compact title={t('form.requestQuote')} />
            </Fade>
          </div>
        </section>
      </>
    );
  }

  const sections = [
    { id: 'overview', label: t('svc.overview') },
    { id: 'benefits', label: t('svc.benefits') },
    { id: 'process', label: t('svc.process') },
    { id: 'faqs', label: t('svc.faqs') },
    { id: 'request-quote', label: t('common.getQuote') },
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
      { name: t('common.home'), path: '/' },
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
        crumbs={[{ label: t('common.home'), href: '/' }, { label: s.countryName, href: `/${s.country}` }, { label: t('common.services'), href: `/${s.country}#${s.group}` }, { label: s.name }]}
        aside={
          <dl className="facts">
            <div>
              <dt>{t('svc.country')}</dt>
              <dd className="facts__flag">
                <Flag country={s.country} size={18} /> {s.countryName}
              </dd>
            </div>
            <div>
              <dt>{t('svc.group')}</dt>
              <dd>{s.groupLabel}</dd>
            </div>
            <div>
              <dt>{t('svc.howItWorks')}</dt>
              <dd>{t('svc.stepsProcess', { n: s.steps.items.length })}</dd>
            </div>
            {elsewhere.length > 0 && (
              <div>
                <dt>{t('svc.alsoIn')}</dt>
                <dd>{elsewhere.map((e) => e.countryName).join(t('svc.and'))}</dd>
              </div>
            )}
          </dl>
        }
      >
        <Button href={quote} variant="light">
          {s.cta.text}
        </Button>
        <Button href={`/${s.country}#country-services`} variant="dark">
          {t('svc.allInCountry', { country: s.countryName })}
        </Button>
      </PageHero>

      <SubNav items={sections} />

      {/* 2. Overview */}
      <section id="overview" className="section tone-white svc-why" aria-labelledby="why-h">
        <Stairs />
        <div className="grid4">
          <div className="svc-why__side">
            <Eyebrow>{t('svc.overview')}</Eyebrow>
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
            <Eyebrow>{t('svc.whatYouGet')}</Eyebrow>
            <SplitReveal as="h2" className="h-big" id="ben-h">
              {t('svc.whyChoose', { service: s.name.toLowerCase() })}
            </SplitReveal>
            <Fade as="p" className="svc-benefits__text">
              {t('svc.threeReasons', { country: s.countryName })}
            </Fade>
          </div>
          <Stack className="svc-benefits__stack">
            {s.benefits.map((b, i) => (
              <article className="value-card benefit-stack" data-stack-card key={b.title}>
                <Eyebrow className="eyebrow--small">{t('svc.benefitN', { n: i + 1 })}</Eyebrow>
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
          <Eyebrow className="center">{t('svc.aeonIn', { country: s.countryName })}</Eyebrow>
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
          <Eyebrow className="svc-steps__eyebrow">{t('svc.howItWorks')}</Eyebrow>
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
            <Eyebrow>{t('svc.inCountry', { country: s.countryName })}</Eyebrow>
            <SplitReveal as="h2" className="h-big" id="num-h">
              {t('svc.onePartner')}
              <br />
              <span className="tone-2">{t('svc.everyFiling')}</span>
            </SplitReveal>
            <Fade as="p" className="numbers__text">
              {t('svc.oneOf', { service: s.name, n: inCountry.length, country: s.countryName })}
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
              { value: String(inCountry.length), suffix: '', label: t('svc.statAvailable', { country: s.countryName }) },
              { value: String(inGroup), suffix: '', label: t('svc.statGroup', { group: s.groupLabel, country: s.countryName }) },
              { value: String(s.steps.items.length), suffix: '', label: t('svc.statSteps') },
              { value: '3', suffix: '', label: t('svc.statMarkets') },
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
            <Eyebrow>{t('svc.qa')}</Eyebrow>
            <SplitReveal as="h2" className="h-big" id="faq-h">
              {t('svc.faqTitle', { service: s.name, country: s.countryName })}
              <br />
              <span className="tone-2">{t('svc.faqSoft')}</span>
            </SplitReveal>
            <Fade className="svc-faq__ask">
              <p>{t('svc.notCovered')}</p>
              <Button href="/contact">{t('svc.askTeam')}</Button>
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
            <Eyebrow>{t('svc.moreIn', { group: s.groupLabel.toLowerCase(), country: s.countryName })}</Eyebrow>
            <SplitReveal as="h2" className="h-big" id="rel-h">
              {t('svc.related')}
            </SplitReveal>
          </div>
        </div>
        <Fade className="related-grid" childrenStagger>
          {more.map((r) => (
            <TransitionLink key={r.slug} href={servicePath(r)} className="related-card">
              <h3 className="h-6">{r.name}</h3>
              <p>{r.listing.body}</p>
              <span className="related-card__go">
                <ArrowIcon /> {t('common.explore')}
              </span>
            </TransitionLink>
          ))}
        </Fade>
        {elsewhere.length > 0 && (
          <div className="svc-markets">
            <p className="eyebrow">{t('svc.otherMarkets', { service: s.name })}</p>
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
                      <ArrowIcon /> {t('svc.viewIn', { country: e.countryName })}
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
            <Eyebrow>{t('common.letsStart')}</Eyebrow>
            <SplitReveal as="h2" className="h-big" id="sq-h">
              {s.cta.heading}
            </SplitReveal>
            <Fade as="p" className="cta__text">
              {s.cta.description}
            </Fade>
            <Fade className="svc-quote__contact">
              <p className="eyebrow eyebrow--small">{t('svc.ourTeam', { country: s.countryName })}</p>
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
            <QuoteForm options={options} country={s.country} service={s.name} compact title={t('svc.requestQuote', { service: s.name.toLowerCase() })} />
          </Fade>
        </div>
      </section>
    </>
  );
}
