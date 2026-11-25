import { Stairs } from '@/components/motion/Stairs';
import { SplitReveal } from '@/components/motion/SplitReveal';
import { Fade } from '@/components/motion/Fade';
import { Eyebrow } from '@/components/ui/Eyebrow';
import { Button, ArrowIcon } from '@/components/ui/Button';
import { Photo } from '@/components/ui/Photo';
import { TransitionLink } from '@/components/motion/TransitionLink';
import { image, countryImages } from '@/content/images';
import type { Blocks } from '@/content/blocks';
import type { Country } from '@/server/content';

/** Sticky intro on the left, tall country cards scrolling past on the right (the reference's case studies). */
export function Countries({ text, countries }: { text: Blocks['home.countries']; countries: Country[] }) {
  return (
    <section id="countries" className="section tone-white countries" aria-labelledby="countries-title">
      <Stairs />
      <div className="grid4">
        <div className="countries__intro">
          <Eyebrow>{text.eyebrow}</Eyebrow>
          <SplitReveal as="h2" className="h-statement" id="countries-title">
            {text.heading}
          </SplitReveal>
          <Fade className="countries__text">
            <p>{text.text}</p>
            <Button href="/contact">{text.buttonLabel}</Button>
          </Fade>
          <Photo {...image('conference')} reveal className="countries__photo" />
        </div>
        <div className="countries__cards">
          {countries.map((c) => (
            <TransitionLink href={`/${c.slug}`} className="country-card" key={c.code}>
              <Photo {...image(countryImages[c.slug as keyof typeof countryImages].card)} className="country-card__media" />
              <div className="country-card__shade" aria-hidden="true" />
              <span className="country-card__badge" aria-hidden="true">
                {c.code}
              </span>
              <span className="country-card__link arrow-link">
                <ArrowIcon /> View services
              </span>
              <div className="country-card__body">
                <h3 className="h-card">{c.name}</h3>
                <p>{c.line}</p>
                <p className="country-card__meta">{c.authorities}</p>
              </div>
            </TransitionLink>
          ))}
        </div>
      </div>
    </section>
  );
}
