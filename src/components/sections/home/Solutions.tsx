'use client';

import { useRef } from 'react';
import { gsap, ScrollTrigger, useGSAP, reducedMotion } from '@/lib/gsap';
import { Stairs } from '@/components/motion/Stairs';
import { ScrubText } from '@/components/motion/ScrubText';
import { Eyebrow } from '@/components/ui/Eyebrow';
import { Button } from '@/components/ui/Button';
import type { Blocks } from '@/content/blocks';

/** Service groups list with the giant sticky index that rolls 01 → 04 as each row passes. */
export function Solutions({ text }: { text: Blocks['home.services'] }) {
  const serviceGroups = text.groups;
  const ref = useRef<HTMLElement>(null);
  const reel = useRef<HTMLSpanElement>(null);

  useGSAP(
    () => {
      const items = gsap.utils.toArray<HTMLElement>('[data-index-item]', ref.current);
      items.forEach((item, i) =>
        ScrollTrigger.create({
          trigger: item,
          start: 'top 55%',
          end: 'bottom 55%',
          onToggle: (s) => {
            if (!s.isActive) return;
            gsap.to(reel.current, { yPercent: (-100 * i) / items.length, duration: reducedMotion() ? 0 : 0.9, ease: 'expo.out', overwrite: true });
            items.forEach((x) => x.classList.toggle('is-active', x === item));
          },
        }),
      );
    },
    { scope: ref },
  );

  return (
    <section ref={ref} id="services" className="section tone-ice solutions" aria-labelledby="solutions-title">
      <Stairs />
      <div className="grid4 solutions__head">
        <Eyebrow className="solutions__eyebrow">{text.eyebrow}</Eyebrow>
        <div className="solutions__statement">
          <h2 id="solutions-title" className="sr-only">{text.eyebrow}</h2>
          <ScrubText className="h-mid">
            {text.statement}
          </ScrubText>
        </div>
      </div>
      <div className="grid4 solutions__body">
        <div className="solutions__list">
          {serviceGroups.map((g, i) => (
            <article className="solutions__row" data-index-item key={i}>
              <h3 className="h-6 bullet">{g.title}</h3>
              <div className="solutions__text">
                <p>{g.lead}</p>
                <p>{g.body}</p>
              </div>
            </article>
          ))}
          <div className="solutions__cta">
            <Button href="/services">{text.buttonLabel}</Button>
          </div>
        </div>
        <div className="solutions__index" aria-hidden="true">
          <span className="idx">
            <span ref={reel} className="idx-reel">
              {serviceGroups.map((_, i) => (
                <span key={i}>{String(i + 1).padStart(2, '0')}</span>
              ))}
            </span>
          </span>
        </div>
      </div>
    </section>
  );
}
