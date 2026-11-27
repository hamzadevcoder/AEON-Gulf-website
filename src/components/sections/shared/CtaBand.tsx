import { Stairs } from '@/components/motion/Stairs';
import { getT } from '@/i18n/server';
import { SplitReveal } from '@/components/motion/SplitReveal';
import { Fade } from '@/components/motion/Fade';
import { Eyebrow } from '@/components/ui/Eyebrow';
import { Button } from '@/components/ui/Button';

type Props = { eyebrow?: string; heading: string; text: string; primary: { label: string; href: string }; secondary?: { label: string; href: string } };

/** Closing call to action on a pale band ("Let's start" on the reference). */
export async function CtaBand({ eyebrow, heading, text, primary, secondary }: Props) {
  const t = await getT();
  return (
    <section className="section tone-ice cta" aria-label={heading}>
      <Stairs />
      <div className="grid4">
        <div className="cta__eyebrow">
          <Eyebrow>{eyebrow ?? t('common.letsStart')}</Eyebrow>
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
