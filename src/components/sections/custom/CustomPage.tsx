import { Stairs } from '@/components/motion/Stairs';
import { getT } from '@/i18n/server';
import { SplitReveal } from '@/components/motion/SplitReveal';
import { ScrubText } from '@/components/motion/ScrubText';
import { Fade } from '@/components/motion/Fade';
import { TransitionLink } from '@/components/motion/TransitionLink';
import { Eyebrow } from '@/components/ui/Eyebrow';
import { Button, ArrowIcon } from '@/components/ui/Button';
import { Photo } from '@/components/ui/Photo';
import { JsonLd } from '@/components/seo/JsonLd';
import { PageHero } from '@/components/sections/shared/PageHero';
import { CtaBand } from '@/components/sections/shared/CtaBand';
import { Faq } from '@/components/sections/shared/Faq';
import { Numbers } from '@/components/sections/home/Numbers';
import { Blocks } from '@/components/sections/legal/LegalPage';
import { QuoteForm } from '@/components/sections/quote/QuoteForm';
import { ContactForm } from '@/components/sections/contact/ContactForm';
import { imageFor } from '@/content/images';
import { textToBlocks } from '@/lib/legal-text';
import { breadcrumbLd, abs } from '@/lib/seo';
import { getQuoteOptions, type CustomPage as Page } from '@/server/content';

type D = Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any
const s = (v: unknown) => (typeof v === 'string' ? v : '');
const list = (v: unknown): D[] => (Array.isArray(v) ? (v as D[]) : []);
const toneOf = (d: D) => (d.tone === 'ice' ? 'tone-ice' : d.tone === 'dark' ? 'tone-charcoal' : 'tone-white');
const isDark = (d: D) => d.tone === 'dark';

/** A page built in the dashboard: its sections, in order, drawn with the site's existing design. */
export async function CustomPage({ page }: { page: Page }) {
  const t = await getT();
  const sections = page.sections.filter((x) => !x.hidden);
  const needsForm = sections.some((x) => x.type === 'form' && x.data.formType !== 'contact');
  const options = needsForm ? await getQuoteOptions() : null;
  const firstIsHero = sections[0]?.type === 'hero';
  const faqs = sections.filter((x) => x.type === 'faq').flatMap((x) => list(x.data.items)).filter((f) => s(f.q) && s(f.a));

  return (
    <>
      <JsonLd
        data={[
          { '@context': 'https://schema.org', '@type': 'WebPage', name: page.title, url: abs(`/${page.slug}`), isPartOf: { '@id': abs('/#website') } },
          breadcrumbLd([{ name: 'Home', path: '/' }, { name: page.title, path: `/${page.slug}` }]),
          ...(faqs.length ? [{ '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: faqs.map((f) => ({ '@type': 'Question', name: s(f.q), acceptedAnswer: { '@type': 'Answer', text: s(f.a) } })) }] : []),
        ]}
      />
      {!firstIsHero && <h1 className="sr-only">{page.title}</h1>}
      {!sections.length && (
        <section className="section tone-white cs cs-first">
          <div className="grid4">
            <div style={{ gridColumn: '1 / 4' }}>
              <h1 className="h-hero">{page.title}</h1>
            </div>
          </div>
        </section>
      )}
      {sections.map((sec, i) => {
        const d = sec.data as D;
        const first = i === 0 && !firstIsHero;
        const key = sec.id;
        const lead = first ? 'cs-first' : '';
        switch (sec.type) {
          case 'hero': {
            const img = s(d.image) ? imageFor(s(d.image), s(d.title)) : undefined;
            return (
              <PageHero key={key} eyebrow={s(d.eyebrow)} title={s(d.title)} titleSoft={s(d.titleSoft) || undefined} subtitle={s(d.subtitle) || undefined} image={img}
                crumbs={[{ label: t('common.home'), href: '/' }, { label: page.title }]}>
                {s(d.buttonLabel) && s(d.buttonLink) ? <Button href={s(d.buttonLink)} variant="light">{s(d.buttonLabel)}</Button> : null}
              </PageHero>
            );
          }
          case 'statement': {
            const img = s(d.image) ? imageFor(s(d.image), '') : null;
            return (
              <section key={key} className={`section ${toneOf(d)} who cs ${lead}`} data-tone={isDark(d) ? 'dark' : undefined}>
                {!first && <Stairs />}
                <div className="grid4">
                  <div className="who__side">
                    <Eyebrow>{s(d.eyebrow)}</Eyebrow>
                    {img && <Photo {...img} reveal className="who__photo" />}
                  </div>
                  <div className="who__main">
                    <ScrubText className="h-statement">{s(d.statement)}</ScrubText>
                    {(s(d.body) || s(d.buttonLabel)) && (
                      <Fade className="who__body">
                        {s(d.body) && <p>{s(d.body)}</p>}
                        {s(d.buttonLabel) && s(d.buttonLink) && <Button href={s(d.buttonLink)}>{s(d.buttonLabel)}</Button>}
                      </Fade>
                    )}
                  </div>
                </div>
              </section>
            );
          }
          case 'text':
            return (
              <section key={key} className={`section ${toneOf(d)} cs cs-text ${lead}`} data-tone={isDark(d) ? 'dark' : undefined}>
                {!first && <Stairs />}
                <div className="grid4">
                  <div className="cs-text__side">
                    <Eyebrow>{s(d.eyebrow)}</Eyebrow>
                  </div>
                  <Fade className="legal-content cs-text__main">
                    {s(d.heading) && <h2 className="h-mid">{s(d.heading)}</h2>}
                    <Blocks blocks={textToBlocks(s(d.body))} />
                  </Fade>
                </div>
              </section>
            );
          case 'cards': {
            const cols = ['2', '3', '4'].includes(s(d.columns)) ? s(d.columns) : '3';
            return (
              <section key={key} className={`section ${toneOf(d)} cs cs-cards ${lead}`} data-tone={isDark(d) ? 'dark' : undefined}>
                {!first && <Stairs />}
                <div className="grid4 cs-head">
                  <div className="cs-head__main">
                    <Eyebrow>{s(d.eyebrow)}</Eyebrow>
                    <SplitReveal as="h2" className="h-big">{s(d.heading)}</SplitReveal>
                    {s(d.intro) && <Fade as="p" className="cs-head__intro">{s(d.intro)}</Fade>}
                  </div>
                </div>
                <Fade className="cs-cards__grid" childrenStagger style={{ ['--cols' as string]: cols }}>
                  {list(d.cards).map((c, n) => {
                    const inner = (
                      <>
                        <h3 className="h-card">{s(c.title)}</h3>
                        <p>{s(c.text)}</p>
                        {s(c.link) && (
                          <span className="related-card__go">
                            <ArrowIcon /> {s(c.linkLabel) || t('common.learnMore')}
                          </span>
                        )}
                      </>
                    );
                    return s(c.link) ? (
                      <TransitionLink key={n} href={s(c.link)} className="benefit-card cs-card cs-card--link">{inner}</TransitionLink>
                    ) : (
                      <article key={n} className="benefit-card cs-card">{inner}</article>
                    );
                  })}
                </Fade>
              </section>
            );
          }
          case 'list':
            return (
              <section key={key} className={`section ${toneOf(d)} country-promises cs ${lead}`} data-tone={isDark(d) ? 'dark' : undefined}>
                {!first && <Stairs />}
                <div className="grid4">
                  <div className="country-promises__head">
                    <Eyebrow>{s(d.eyebrow)}</Eyebrow>
                    <SplitReveal as="h2" className="h-big">{s(d.heading)}</SplitReveal>
                  </div>
                  <Fade as="ol" className="promises" childrenStagger>
                    {list(d.items).map((it, n) => (
                      <li key={n}>
                        <span className="promises__n">{String(n + 1).padStart(2, '0')}</span>
                        <h3 className="h-card">{s(it.title)}</h3>
                        <p>{s(it.text)}</p>
                      </li>
                    ))}
                  </Fade>
                </div>
              </section>
            );
          case 'faq':
            return (
              <section key={key} className={`section ${toneOf(d)} svc-faq cs ${lead}`} data-tone={isDark(d) ? 'dark' : undefined}>
                {!first && <Stairs />}
                <div className="grid4">
                  <div className="svc-faq__intro">
                    <Eyebrow>{s(d.eyebrow)}</Eyebrow>
                    <SplitReveal as="h2" className="h-big">{s(d.heading)}</SplitReveal>
                  </div>
                  <div className="svc-faq__list">
                    <Faq items={list(d.items).map((f) => ({ q: s(f.q), a: s(f.a) }))} idPrefix={`faq-${i}`} />
                  </div>
                </div>
              </section>
            );
          case 'banner': {
            const img = imageFor(s(d.image) || 'kuwaitBanner', '');
            return (
              <section key={key} className={`section tone-black svc-band cs ${lead}`} data-tone="dark">
                {!first && <Stairs />}
                <div className="svc-band__media" aria-hidden="true">
                  <Photo {...img} alt="" parallax={0.22} tone="dark" />
                </div>
                <div className="svc-band__inner">
                  <Eyebrow className="center">{s(d.eyebrow)}</Eyebrow>
                  <ScrubText className="h-statement center" from={0.25}>{s(d.text)}</ScrubText>
                  {s(d.buttonLabel) && s(d.buttonLink) && (
                    <Fade className="center svc-band__cta">
                      <Button href={s(d.buttonLink)} variant="light">{s(d.buttonLabel)}</Button>
                    </Fade>
                  )}
                </div>
              </section>
            );
          }
          case 'stats':
            return <Numbers key={key} text={{ eyebrow: s(d.eyebrow), title: s(d.title), titleSoft: s(d.titleSoft), text: s(d.text), stats: list(d.stats).map((x) => ({ value: s(x.value), suffix: s(x.suffix), label: s(x.label) })) }} />;
          case 'form':
            return (
              <section key={key} className={`section tone-ice svc-quote cs ${lead}`}>
                {!first && <Stairs />}
                <div className="grid4">
                  <div className="svc-quote__intro">
                    <Eyebrow>{s(d.eyebrow)}</Eyebrow>
                    <SplitReveal as="h2" className="h-big">{s(d.heading)}</SplitReveal>
                    <Fade as="p" className="cta__text">{s(d.text)}</Fade>
                  </div>
                  <Fade className="svc-quote__form">
                    {d.formType === 'contact' || !options ? <ContactForm /> : <QuoteForm options={options} compact title={t('form.requestQuote')} />}
                  </Fade>
                </div>
              </section>
            );
          case 'cta':
            return (
              <CtaBand key={key} eyebrow={s(d.eyebrow) || undefined} heading={s(d.heading)} text={s(d.text)}
                primary={{ label: s(d.primaryLabel) || t('common.getQuote'), href: s(d.primaryLink) || '/quote' }}
                secondary={s(d.secondaryLabel) && s(d.secondaryLink) ? { label: s(d.secondaryLabel), href: s(d.secondaryLink) } : undefined} />
            );
          default:
            return null;
        }
      })}
    </>
  );
}
