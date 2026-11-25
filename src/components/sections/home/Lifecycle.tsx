'use client';

import { useRef } from 'react';
import { gsap, useGSAP, reducedMotion } from '@/lib/gsap';
import { Stairs } from '@/components/motion/Stairs';
import { SplitReveal } from '@/components/motion/SplitReveal';
import { ScrubText } from '@/components/motion/ScrubText';
import { Fade } from '@/components/motion/Fade';
import { Button } from '@/components/ui/Button';
import { StageIcon, ServiceIcon } from '@/components/ui/Icons';
import { Photo } from '@/components/ui/Photo';
import { image } from '@/content/images';
import type { Blocks } from '@/content/blocks';

const icons = ['formation', 'visa', 'renewal', 'closure'];

/** The reference's dark video band: statement, rising stage cards, a word-fill quote, then zigzag service cards. */
export function Lifecycle({ text }: { text: Blocks['home.lifecycle'] }) {
  const ref = useRef<HTMLElement>(null);
  useGSAP(
    () => {
      if (reducedMotion()) return;
      // Stage cards rise into place at slightly different heights and brighten from grey to white.
      gsap.fromTo(
        '.stage-card',
        { y: (i: number) => 140 + i * 30, opacity: 0.35 },
        {
          y: (i: number) => i * 10,
          opacity: 1,
          ease: 'none',
          stagger: 0.06,
          scrollTrigger: { trigger: '.stages', start: 'top bottom', end: 'top 35%', scrub: true },
        },
      );
    },
    { scope: ref },
  );

  return (
    <section ref={ref} className="section tone-black lifecycle" data-tone="dark" aria-labelledby="life-title">
      <Stairs />
      <div className="lifecycle__media" aria-hidden="true">
        <Photo {...image('boardroom')} alt="" parallax={0.15} tone="dark" className="lifecycle__photo" />
      </div>
      <div className="grid4">
        <SplitReveal as="h2" className="h-big lifecycle__title" id="life-title">
          {text.title1}
          <br />
          <span className="tone-2">{text.title2}</span>
          <br />
          {text.title3}
        </SplitReveal>
      </div>
      <div className="grid4">
        <Fade className="lifecycle__aside">
          <h3 className="h-mid">{text.asideHeading}</h3>
          <p>{text.asideText}</p>
          <Button href="/services" variant="light">
            {text.buttonLabel}
          </Button>
        </Fade>
      </div>
      <div className="stages">
        {text.stages.map((s, i) => (
          <article className="stage-card" key={i}>
            <StageIcon index={i} />
            <h3 className="h-card">{s.title}</h3>
            <p>{s.text}</p>
          </article>
        ))}
      </div>
      <div className="lifecycle__quote">
        <ScrubText className="h-mid center" from={0.25}>{text.quote}</ScrubText>
      </div>
      <div className="zigzag">
        {text.highlights.map((s, i) => (
          <Fade className={`zig-card zig-card--${i % 2 ? 'left' : 'right'}`} style={{ gridRow: i + 1 }} key={i}>
            <ServiceIcon name={icons[i % icons.length]} />
            <h3 className="h-6">{s.title}</h3>
            <p>{s.text}</p>
          </Fade>
        ))}
      </div>
    </section>
  );
}
