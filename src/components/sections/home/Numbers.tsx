import { Stairs } from '@/components/motion/Stairs';
import { SplitReveal } from '@/components/motion/SplitReveal';
import { Fade } from '@/components/motion/Fade';
import { Odometer } from '@/components/motion/Odometer';
import { Eyebrow } from '@/components/ui/Eyebrow';
import type { Blocks } from '@/content/blocks';

export function Numbers({ text }: { text: Blocks['home.numbers'] }) {
  return (
    <section className="section tone-charcoal numbers" data-tone="dark" aria-labelledby="numbers-title">
      <Stairs />
      <div className="grid4">
        <div className="numbers__intro">
          <Eyebrow>{text.eyebrow}</Eyebrow>
          <SplitReveal as="h2" className="h-big" id="numbers-title">
            {text.title}
            <br />
            <span className="tone-2">{text.titleSoft}</span>
          </SplitReveal>
          <Fade as="p" className="numbers__text">
            {text.text}
          </Fade>
        </div>
        <div className="numbers__grid">
          {text.stats.map((n, i) => (
            <div className="stat" key={i}>
              <Odometer value={n.value.replace(/\D/g, '') || '0'} suffix={n.suffix} className="stat__value" />
              <p className="stat__label">{n.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
