import { ScrubText } from '@/components/motion/ScrubText';
import { Marquee } from '@/components/motion/Marquee';
import { Eyebrow } from '@/components/ui/Eyebrow';
import type { Blocks } from '@/content/blocks';

/** Centred statement + masked marquee (the reference's client-logo strip, here the authorities we work with). */
export function Authorities({ text }: { text: Blocks['home.authorities'] }) {
  return (
    <section className="section tone-white authorities" aria-labelledby="auth-title">
      <div className="authorities__inner">
        <Eyebrow className="center">{text.eyebrow}</Eyebrow>
        <h2 id="auth-title" className="sr-only">
          {text.eyebrow}
        </h2>
        <ScrubText className="h-statement center">
          {text.statement}
        </ScrubText>
      </div>
      <Marquee className="authorities__marquee" speed={45}>
        {text.items.map((a, i) => (
          <span className="authorities__item" key={i}>
            {a.name}
          </span>
        ))}
      </Marquee>
      <p className="authorities__caption">{text.caption}</p>
    </section>
  );
}
