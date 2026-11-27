import type { Metadata } from 'next';
import { setLocale, getT } from '@/i18n/server';
import { pageMetadata } from '@/lib/seo';
import { SplitReveal } from '@/components/motion/SplitReveal';
import { Fade } from '@/components/motion/Fade';
import { Eyebrow } from '@/components/ui/Eyebrow';
import { ArrowIcon } from '@/components/ui/Button';
import { QuoteForm } from '@/components/sections/quote/QuoteForm';
import { getBlock, getContact, getQuoteOptions } from '@/server/content';

type P = { params: Promise<{ lang: string }> };
export async function generateMetadata({ params }: P): Promise<Metadata> {
  const { lang } = await params;
  setLocale(lang);
  const tr = await getT();
  return pageMetadata({ title: tr('meta.quote.title'), description: tr('meta.quote.desc'), path: '/quote' });
}


export default async function QuotePage({ params }: P) {
  setLocale((await params).lang);
  const tr = await getT();
  const [t, contact, options] = await Promise.all([getBlock('quote.page'), getContact(), getQuoteOptions()]);
  return (
    <section className="section tone-white quote-page" aria-labelledby="quote-title">
      <div className="grid4">
        <div className="quote-page__intro">
          <Fade load y={20}>
            <Eyebrow>{t.eyebrow}</Eyebrow>
          </Fade>
          <SplitReveal as="h1" load className="h-big" id="quote-title">
            {t.title}
            <br />
            <span className="tone-2">{t.titleSoft}</span>
          </SplitReveal>
          <Fade load as="p" className="quote-page__lead" delay={0.2}>
            {t.lead}
          </Fade>
          <Fade load as="ol" className="quote-steps" childrenStagger delay={0.3}>
            {t.steps.map((s, i) => (
              <li key={i}>
                <span className="quote-steps__n">{String(i + 1).padStart(2, '0')}</span>
                <span>
                  <strong>{s.title}</strong>
                  {s.text}
                </span>
              </li>
            ))}
          </Fade>
          <Fade load className="quote-page__contact" delay={0.45}>
            <p className="eyebrow eyebrow--small">{tr('common.preferToTalk')}</p>
            <a href={contact.phoneHref}>
              <ArrowIcon /> {contact.phone}
            </a>
            <a href={`mailto:${contact.email}`}>
              <ArrowIcon /> {contact.email}
            </a>
          </Fade>
        </div>
        <Fade load className="quote-page__form" delay={0.25}>
          <QuoteForm options={options} />
        </Fade>
      </div>
    </section>
  );
}
