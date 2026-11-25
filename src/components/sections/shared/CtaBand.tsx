import { Stairs } from '@/components/motion/Stairs';
import { SplitReveal } from '@/components/motion/SplitReveal';
import { Fade } from '@/components/motion/Fade';
import { Eyebrow } from '@/components/ui/Eyebrow';
import { Button } from '@/components/ui/Button';

type Props = { eyebrow?: string; heading: string; text: string; primary: { label: string; href: string }; secondary?: { label: string; href: string } };

/** Closing call to action on a pale band ("Let's start" on the reference). */
export function CtaBand({ eyebrow = 'Let’s start', heading, text, primary, secondary }: Props) {
  return (
    <section className="section tone-ice cta" aria-label={heading}>
      <Stairs />
      <div className="grid4">
        <div className="cta__eyebrow">
          <Eyebrow>{eyebrow}</Eyebrow>
        </div>
        <div className="cta__main">
          <SplitReveal as="h2" className="h-big">
            {heading}
          </SplitReveal>
          <Fade as="p" className="cta__text">
            {text}
          </Fade>
          <Fade className="cta__actions" childrenStagger>
            <Button href={primary.href}>{primary.label}</Button>
            {secondary && (
              <Button href={secondary.href} variant="dark">
                {secondary.label}
              </Button>
            )}
          </Fade>
        </div>
      </div>
    </section>
  );
}
