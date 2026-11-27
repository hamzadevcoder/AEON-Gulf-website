import { SplitReveal } from '@/components/motion/SplitReveal';
import { getT } from '@/i18n/server';
import { Fade } from '@/components/motion/Fade';
import { Eyebrow } from '@/components/ui/Eyebrow';
import { TransitionLink } from '@/components/motion/TransitionLink';
import { legal } from '@/content/site';
import type { Block, Policy } from '@/content/legal';

const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

export function Blocks({ blocks }: { blocks: Block[] }) {
  return (
    <>
      {blocks.map((b, i) =>
        b.type === 'ul' ? (
          <ul key={i}>
            {b.items.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        ) : b.type === 'h4' ? (
          <h3 key={i}>{b.text}</h3>
        ) : (
          <p key={i}>{linkEmail(b.text)}</p>
        ),
      )}
    </>
  );
}

function linkEmail(text: string) {
  const parts = text.split(/(info@aeongulf\.com)/);
  return parts.map((part, i) => (part === 'info@aeongulf.com' ? <a key={i} href="mailto:info@aeongulf.com">{part}</a> : part));
}

/** Policy page: light hero, sticky contents list on the left, numbered sections on the right. */
export async function LegalPage({ policy }: { policy: Policy }) {
  const t = await getT();
  return (
    <>
      <section className="section tone-white legal-hero" aria-labelledby="legal-title">
        <div className="grid4">
          <div className="legal-hero__text">
            <Fade load y={20}>
              <Eyebrow>{t('legalPage.eyebrow')}</Eyebrow>
            </Fade>
            <SplitReveal as="h1" load className="h-hero" id="legal-title">
              {policy.title}
            </SplitReveal>
            <Fade load as="p" className="legal-hero__meta" delay={0.2}>
              {t('legalPage.effective', { date: policy.effective })}
            </Fade>
          </div>
          <Fade load as="nav" className="legal-hero__others" aria-label={t('legalPage.others')} delay={0.3}>
            {legal
              .filter((l) => l.href !== `/${policy.slug}`)
              .map((l) => (
                <TransitionLink key={l.href} href={l.href} className="arrow-link">
                  {t(l.key)}
                </TransitionLink>
              ))}
          </Fade>
        </div>
      </section>
      <section className="section tone-ice legal-body">
        <div className="grid4">
          <nav className="legal-toc" aria-label={t('common.onThisPage')}>
            <p className="eyebrow eyebrow--small">{t('common.onThisPage')}</p>
            <ol>
              {policy.sections.map((s) => (
                <li key={s.title}>
                  <TransitionLink href={`#${slugify(s.title)}`}>{s.title}</TransitionLink>
                </li>
              ))}
            </ol>
          </nav>
          <div className="legal-content">
            <Fade className="legal-intro">
              <Blocks blocks={policy.intro} />
            </Fade>
            {policy.sections.map((s, i) => (
              <Fade as="section" className="legal-section" key={s.title} id={slugify(s.title)} y={30}>
                <h2 className="h-mid">
                  <span className="legal-section__n">{String(i + 1).padStart(2, '0')}</span>
                  {s.title}
                </h2>
                <Blocks blocks={s.blocks} />
              </Fade>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
