import type { Metadata } from 'next';
import { pageMetadata, breadcrumbLd } from '@/lib/seo';
import { JsonLd } from '@/components/seo/JsonLd';
import { SplitReveal } from '@/components/motion/SplitReveal';
import { Fade } from '@/components/motion/Fade';
import { Eyebrow } from '@/components/ui/Eyebrow';
import { GuideCard } from '@/components/sections/insights/GuideCard';
import { CtaBand } from '@/components/sections/shared/CtaBand';
import { getGuides } from '@/server/content';

export const metadata: Metadata = pageMetadata({
  title: 'Insights: Guides to Doing Business in the Gulf',
  description: 'Practical guides to setting up and running a company in Kuwait, Qatar and Saudi Arabia, from choosing a structure to banking and compliance.',
  path: '/insights',
});

export default async function InsightsPage() {
  const guides = await getGuides();
  return (
    <>
      <JsonLd data={breadcrumbLd([{ name: 'Home', path: '/' }, { name: 'Insights', path: '/insights' }])} />
      <section className="section tone-white insights insights-page" aria-labelledby="ip-title">
        <div className="grid4 insights__head">
          <div className="insights__title">
            <Fade load y={20}>
              <Eyebrow>Insights</Eyebrow>
            </Fade>
            <SplitReveal as="h1" load className="h-hero" id="ip-title">
              Practical guides
              <br />
              <span className="tone-2">to doing business in the Gulf.</span>
            </SplitReveal>
          </div>
        </div>
        <h2 className="sr-only">All guides</h2>
        <Fade className="insights__grid" childrenStagger load delay={0.3}>
          {guides.map((g) => (
            <GuideCard key={g.slug} guide={g} />
          ))}
        </Fade>
      </section>
      <CtaBand
        heading="Have a question about your own situation?"
        text="Tell us what you are planning and our team will come back with the steps, timeline and cost."
        primary={{ label: 'Get a quote', href: '/quote' }}
        secondary={{ label: 'Contact us', href: '/contact' }}
      />
    </>
  );
}
