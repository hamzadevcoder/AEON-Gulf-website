import type { Metadata } from 'next';
import { setLocale, getT } from '@/i18n/server';
import { pageMetadata, breadcrumbLd } from '@/lib/seo';
import { JsonLd } from '@/components/seo/JsonLd';
import { SplitReveal } from '@/components/motion/SplitReveal';
import { Fade } from '@/components/motion/Fade';
import { Eyebrow } from '@/components/ui/Eyebrow';
import { GuideCard } from '@/components/sections/insights/GuideCard';
import { CtaBand } from '@/components/sections/shared/CtaBand';
import { getGuides } from '@/server/content';

type P = { params: Promise<{ lang: string }> };
export async function generateMetadata({ params }: P): Promise<Metadata> {
  const { lang } = await params;
  setLocale(lang);
  const t = await getT();
  return pageMetadata({ title: t('meta.insights.title'), description: t('meta.insights.desc'), path: '/insights' });
}

export default async function InsightsPage({ params }: P) {
  setLocale((await params).lang);
  const t = await getT();
  const guides = await getGuides();
  return (
    <>
      <JsonLd data={breadcrumbLd([{ name: t('common.home'), path: '/' }, { name: t('ins.eyebrow'), path: '/insights' }])} />
      <section className="section tone-white insights insights-page" aria-labelledby="ip-title">
        <div className="grid4 insights__head">
          <div className="insights__title">
            <Fade load y={20}>
              <Eyebrow>{t('ins.eyebrow')}</Eyebrow>
            </Fade>
            <SplitReveal as="h1" load className="h-hero" id="ip-title">
              {t('ins.title')}
              <br />
              <span className="tone-2">{t('ins.titleSoft')}</span>
            </SplitReveal>
          </div>
        </div>
        <h2 className="sr-only">{t('ins.allGuides')}</h2>
        {!guides.length && <p className="cs-head__intro" style={{ padding: '40px var(--gutter)' }}>{t('ins.empty')}</p>}
        <Fade className="insights__grid" childrenStagger load delay={0.3}>
          {guides.map((g) => (
            <GuideCard key={g.slug} guide={g} />
          ))}
        </Fade>
      </section>
      <CtaBand
        heading={t('ins.ctaHeading')}
        text={t('ins.ctaText')}
        primary={{ label: t('common.getQuote'), href: '/quote' }}
        secondary={{ label: t('common.contactUs'), href: '/contact' }}
      />
    </>
  );
}
