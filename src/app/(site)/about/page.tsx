import type { Metadata } from 'next';
import { pageMetadata, breadcrumbLd, abs } from '@/lib/seo';
import { JsonLd } from '@/components/seo/JsonLd';
import { SplitReveal } from '@/components/motion/SplitReveal';
import { ScrubText } from '@/components/motion/ScrubText';
import { Fade } from '@/components/motion/Fade';
import { Stairs } from '@/components/motion/Stairs';
import { Stack } from '@/components/motion/Stack';
import { Eyebrow } from '@/components/ui/Eyebrow';
import { Button } from '@/components/ui/Button';
import { Photo } from '@/components/ui/Photo';
import { image } from '@/content/images';
import { getBlock } from '@/server/content';

export const metadata: Metadata = pageMetadata({
  title: 'About AEON Gulf: Business Setup Experts in the Gulf',
  description:
    'AEON Gulf is owned and managed by Kuwaiti nationals and expatriates with deep GCC experience, working across Kuwait, Qatar and Saudi Arabia.',
  path: '/about',
  absoluteTitle: true,
});

export default async function AboutPage() {
  const t = await getBlock('about.page');
  return (
    <>
      <JsonLd data={[{ '@context': 'https://schema.org', '@type': 'AboutPage', name: 'About AEON Gulf', url: abs('/about'), about: { '@id': abs('/#organization') } }, breadcrumbLd([{ name: 'Home', path: '/' }, { name: 'About', path: '/about' }])]} />
      <section className="section tone-white about-hero" aria-labelledby="about-title">
        <div className="grid4">
          <div className="about-hero__text">
            <Fade load as="div" y={20}>
              <Eyebrow>{t.eyebrow}</Eyebrow>
            </Fade>
            <SplitReveal as="h1" load className="h-hero" id="about-title">
              {t.title}
              <br />
              <span className="tone-2">{t.titleSoft}</span>
            </SplitReveal>
            <Fade load as="p" className="about-hero__lead" delay={0.2}>
              {t.lead}
            </Fade>
          </div>
          <Fade load className="about-hero__photo" delay={0.35}>
            <Photo {...image('team')} priority />
          </Fade>
        </div>
      </section>

      <section className="section tone-black mission" data-tone="dark" aria-labelledby="mission-title">
        <Stairs />
        <div className="mission__bg" aria-hidden="true">
          <Photo {...image('teamContact')} alt="" parallax={0.18} tone="dark" />
        </div>
        <div className="grid4 mission__grid">
          <div className="mission__text">
            <Eyebrow>{t.missionEyebrow}</Eyebrow>
            <h2 id="mission-title" className="sr-only">
              {t.missionEyebrow}
            </h2>
            <ScrubText className="h-mid" from={0.25}>
              {t.mission}
            </ScrubText>
          </div>
        </div>
      </section>

      <section className="section tone-white values" aria-labelledby="values-title">
        <Stairs />
        <div className="grid4">
          <div className="values__intro">
            <Eyebrow>{t.valuesEyebrow}</Eyebrow>
            <SplitReveal as="h2" className="h-statement" id="values-title">
              {t.valuesHeading}
            </SplitReveal>
            <Fade as="p" className="values__text">
              {t.valuesText}
            </Fade>
            <Fade>
              <Button href="/services">Our services</Button>
            </Fade>
          </div>
          <Stack className="values__stack">
            {t.values.map((v, i) => (
              <article className="value-card" data-stack-card key={i}>
                <Eyebrow className="eyebrow--small">{v.title}</Eyebrow>
                <p className="h-mid value-card__text">{v.text}</p>
                <span className="value-card__num" aria-hidden="true">
                  {String(i + 1).padStart(2, '0')}
                </span>
              </article>
            ))}
          </Stack>
        </div>
      </section>

      <section className="section tone-ice cta" aria-labelledby="cta-title">
        <Stairs />
        <div className="grid4">
          <div className="cta__eyebrow">
            <Eyebrow>Let&rsquo;s start</Eyebrow>
          </div>
          <div className="cta__main">
            <SplitReveal as="h2" className="h-hero" id="cta-title">
              {t.ctaTitle}
              <br />
              <span className="tone-2">{t.ctaTitleSoft}</span>
            </SplitReveal>
            <Fade as="p" className="cta__text">
              {t.ctaText}
            </Fade>
            <Fade className="cta__actions" childrenStagger>
              <Button href="/contact">Contact us</Button>
              <Button href="/quote" variant="dark">
                Get a quote
              </Button>
            </Fade>
          </div>
        </div>
      </section>
    </>
  );
}
