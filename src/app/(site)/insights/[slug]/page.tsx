import type { Metadata } from 'next';
import { pageMetadata, breadcrumbLd, abs, SITE_NAME } from '@/lib/seo';
import { JsonLd } from '@/components/seo/JsonLd';
import { notFound } from 'next/navigation';
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

type Params = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const g = await findGuide((await params).slug);
  if (!g) return {};
  return pageMetadata({ title: g.metaTitle, description: g.metaDescription, path: guidePath(g), type: 'article' });
}

const anchor = (i: number) => `q${i + 1}`;

export default async function GuidePage({ params }: Params) {
  const { slug } = await params;
  const guides = await getGuides();
  const g = guides.find((x) => x.slug === slug);
  if (!g) notFound();
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
    breadcrumbLd([{ name: 'Home', path: '/' }, { name: 'Insights', path: '/insights' }, { name: g.title, path: guidePath(g) }]),
  ];

  return (
    <>
      <JsonLd data={jsonLd} />

      <section className="section tone-white guide-hero" aria-labelledby="g-title">
        <div className="grid4">
          <div className="guide-hero__text">
            <Fade load as="nav" className="crumbs crumbs--light" aria-label="Breadcrumb" y={14}>
              <ol>
                <li>
                  <TransitionLink href="/">Home</TransitionLink>
                </li>
                <li>
                  <TransitionLink href="/insights">Insights</TransitionLink>
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
              <span>{`${g.readMinutes} min read`}</span>
              <span>{`${s.faqs.length} questions answered`}</span>
            </Fade>
          </div>
        </div>
        <div className="guide-hero__image">
          <Photo {...imageFor(g.image, g.title)} reveal parallax={0.12} priority />
        </div>
      </section>

      <section className="section tone-white guide-body">
        <div className="grid4">
          <nav className="guide-toc" aria-label="In this guide">
            <p className="eyebrow eyebrow--small">In this guide</p>
            <ol>
              <li>
                <TransitionLink href="#overview">Overview</TransitionLink>
              </li>
              {s.faqs.map((f, i) => (
                <li key={i}>
                  <TransitionLink href={`#${anchor(i)}`}>{f.q}</TransitionLink>
                </li>
              ))}
              <li>
                <TransitionLink href="#how-we-help">How AEON Gulf helps</TransitionLink>
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
              <p className="eyebrow eyebrow--small">Related service</p>
              <h3 className="h-card">{`${s.name} in ${g.countryName}`}</h3>
              <p>{s.listing.body}</p>
              <TransitionLink href={servicePath(s)} className="arrow-link">
                <ArrowIcon /> View the service
              </TransitionLink>
            </Fade>
          </article>
        </div>
      </section>

      <section id="how-we-help" className="section tone-ice guide-help" aria-labelledby="help-h">
        <Stairs />
        <div className="grid4">
          <div className="guide-help__intro">
            <Eyebrow>How AEON Gulf helps</Eyebrow>
            <SplitReveal as="h2" className="h-big" id="help-h">
              {s.why.heading}
            </SplitReveal>
            <ScrubText className="guide-help__text">{s.why.description}</ScrubText>
            <Fade className="cta__actions" childrenStagger>
              <Button href={quote}>{s.cta.text}</Button>
              <Button href={servicePath(s)} variant="dark">
                About the service
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
            <Eyebrow>Keep reading</Eyebrow>
            <SplitReveal as="h2" className="h-big" id="more-h">
              More guides
            </SplitReveal>
          </div>
          <div className="insights__all">
            <Button href="/insights">All guides</Button>
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
