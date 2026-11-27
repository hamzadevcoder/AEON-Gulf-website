import type { Metadata } from 'next';
import { setLocale, getT } from '@/i18n/server';
import { pageMetadata, breadcrumbLd, abs, SITE_NAME } from '@/lib/seo';
import { JsonLd } from '@/components/seo/JsonLd';
import { notFound, redirect } from 'next/navigation';
import { SplitReveal } from '@/components/motion/SplitReveal';
import { ScrubText } from '@/components/motion/ScrubText';
import { Fade } from '@/components/motion/Fade';
import { Stairs } from '@/components/motion/Stairs';
import { TransitionLink } from '@/components/motion/TransitionLink';
import { Eyebrow } from '@/components/ui/Eyebrow';
import { Button, ArrowIcon } from '@/components/ui/Button';
import { Photo } from '@/components/ui/Photo';
import { Flag } from '@/components/ui/Flag';
import { GuideCard } from '@/components/sections/insights/GuideCard';
import { guidePath } from '@/content/insights';
import { getGuides } from '@/server/content';
import { servicePath } from '@/content/services';
import { imageFor } from '@/content/images';

export const dynamicParams = true;
export async function generateStaticParams() {
  return (await getGuides().catch(() => [])).map((g) => ({ slug: g.slug }));
}
const findGuide = async (slug: string) => (await getGuides()).find((g) => g.slug === slug);

type Params = { params: Promise<{ slug: string; lang: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug, lang } = await params;
  setLocale(lang);
  const g = await findGuide(slug);
  if (!g) return {};
  const arOk = (await getGuides('ar')).some((x) => x.slug === g.slug);
  return pageMetadata({ title: g.metaTitle, description: g.metaDescription, path: guidePath(g), type: 'article', alternate: arOk });
}

const anchor = (i: number) => `q${i + 1}`;

export default async function GuidePage({ params }: Params) {
  const { slug, lang } = await params;
  setLocale(lang);
  const t = await getT();
  const guides = await getGuides();
  const g = guides.find((x) => x.slug === slug);
  if (!g) {
    // no Arabic version yet: send Arabic visitors to the Arabic insights page instead of a 404
    if (lang === 'ar' && (await getGuides('en')).some((x) => x.slug === slug)) redirect('/ar/insights');
    notFound();
  }
  const s = g.related;
  const others = guides.filter((x) => x.slug !== g.slug);
  const quote = `/quote?country=${g.country}&service=${encodeURIComponent(s.name)}`;

  const jsonLd = [
    {
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: g.title,
      description: g.excerpt,
      about: s.name,
      mainEntityOfPage: abs(guidePath(g)),
      author: { '@type': 'Organization', name: SITE_NAME },
      publisher: { '@type': 'Organization', '@id': abs('/#organization'), name: SITE_NAME },
    },
    {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: s.faqs.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
    },
    breadcrumbLd([{ name: t('common.home'), path: '/' }, { name: t('ins.eyebrow'), path: '/insights' }, { name: g.title, path: guidePath(g) }]),
  ];

  return (
    <>
      <JsonLd data={jsonLd} />

      <section className="section tone-white guide-hero" aria-labelledby="g-title">
        <div className="grid4">
          <div className="guide-hero__text">
            <Fade load as="nav" className="crumbs crumbs--light" aria-label={t('common.breadcrumb')} y={14}>
              <ol>
                <li>
                  <TransitionLink href="/">{t('common.home')}</TransitionLink>
                </li>
                <li>
                  <TransitionLink href="/insights">{t('ins.eyebrow')}</TransitionLink>
                </li>
                <li>
                  <span aria-current="page">{g.countryName}</span>
                </li>
              </ol>
            </Fade>
            <Fade load y={20}>
              <Eyebrow>{`${g.category} / ${g.countryName}`}</Eyebrow>
            </Fade>
            <SplitReveal as="h1" load className="h-hero" id="g-title">
              {g.title}
            </SplitReveal>
            <Fade load as="p" className="guide-hero__lead" delay={0.2}>
              {g.excerpt}
            </Fade>
            <Fade load className="guide-hero__meta" delay={0.3}>
              <span>
                <Flag country={g.country} size={18} /> {g.countryName}
              </span>
              <span>{t('guide.readMin', { n: g.readMinutes })}</span>
              <span>{t('guide.questions', { n: s.faqs.length })}</span>
            </Fade>
          </div>
        </div>
        <div className="guide-hero__image">
          <Photo {...imageFor(g.image, g.title)} reveal parallax={0.12} priority />
        </div>
      </section>

      <section className="section tone-white guide-body">
        <div className="grid4">
          <nav className="guide-toc" aria-label={t('guide.inThis')}>
            <p className="eyebrow eyebrow--small">{t('guide.inThis')}</p>
            <ol>
              <li>
                <TransitionLink href="#overview">{t('svc.overview')}</TransitionLink>
              </li>
              {s.faqs.map((f, i) => (
                <li key={i}>
                  <TransitionLink href={`#${anchor(i)}`}>{f.q}</TransitionLink>
                </li>
              ))}
              <li>
                <TransitionLink href="#how-we-help">{t('guide.howWeHelp')}</TransitionLink>
              </li>
            </ol>
          </nav>
          <article className="guide-content">
            <section id="overview" className="guide-section">
              {g.intro.map((p, i) => (
                <Fade as="p" key={i} className={i === 0 ? 'guide-content__lead' : undefined} y={24}>
                  {p}
                </Fade>
              ))}
            </section>
            {s.faqs.map((f, i) => (
              <Fade as="section" id={anchor(i)} className="guide-section" key={i} y={30}>
                <h2 className="h-mid">
                  <span className="guide-section__n">{String(i + 1).padStart(2, '0')}</span>
                  {f.q}
                </h2>
                <p>{f.a}</p>
              </Fade>
            ))}
            <Fade as="aside" className="guide-callout" y={30}>
              <p className="eyebrow eyebrow--small">{t('guide.related')}</p>
              <h3 className="h-card">{t('svc.titleIn', { service: s.name, country: g.countryName })}</h3>
              <p>{s.listing.body}</p>
              <TransitionLink href={servicePath(s)} className="arrow-link">
                <ArrowIcon /> {t('guide.viewService')}
              </TransitionLink>
            </Fade>
          </article>
        </div>
      </section>

      <section id="how-we-help" className="section tone-ice guide-help" aria-labelledby="help-h">
        <Stairs />
        <div className="grid4">
          <div className="guide-help__intro">
            <Eyebrow>{t('guide.howWeHelp')}</Eyebrow>
            <SplitReveal as="h2" className="h-big" id="help-h">
              {s.why.heading}
            </SplitReveal>
            <ScrubText className="guide-help__text">{s.why.description}</ScrubText>
            <Fade className="cta__actions" childrenStagger>
              <Button href={quote}>{s.cta.text}</Button>
              <Button href={servicePath(s)} variant="dark">
                {t('guide.aboutService')}
              </Button>
            </Fade>
          </div>
          <Fade as="ol" className="guide-steps" childrenStagger>
            {s.steps.items.map((step, i) => (
              <li key={i}>
                <span className="guide-steps__n">{String(i + 1).padStart(2, '0')}</span>
                <span>
                  <strong>{step.title}</strong>
                  {step.text}
                </span>
              </li>
            ))}
          </Fade>
        </div>
      </section>

      <section className="section tone-white insights guide-more" aria-labelledby="more-h">
        <Stairs />
        <div className="grid4 insights__head">
          <div className="insights__title">
            <Eyebrow>{t('guide.keepReading')}</Eyebrow>
            <SplitReveal as="h2" className="h-big" id="more-h">
              {t('guide.more')}
            </SplitReveal>
          </div>
          <div className="insights__all">
            <Button href="/insights">{t('ins.allGuides')}</Button>
          </div>
        </div>
        <Fade className="insights__grid insights__grid--two" childrenStagger>
          {others.map((o) => (
            <GuideCard key={o.slug} guide={o} />
          ))}
        </Fade>
      </section>
    </>
  );
}
