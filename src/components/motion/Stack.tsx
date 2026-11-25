'use client';

import { useRef } from 'react';
import { gsap, useGSAP, reducedMotion } from '@/lib/gsap';

/** Sticky stacking cards: each card sticks, then shrinks and dims as the next one slides over it. */
export function Stack({ className, children }: { className?: string; children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  useGSAP(
    () => {
      const cards = gsap.utils.toArray<HTMLElement>('[data-stack-card]', ref.current);
      cards.forEach((c, i) => c.style.setProperty('--i', String(i)));
      if (reducedMotion()) return;
      cards.slice(0, -1).forEach((c, i) => {
        gsap.to(c, {
          scale: 0.9 + i * 0.012,
          '--dim': 0.45,
          ease: 'none',
          scrollTrigger: { trigger: cards[i + 1], start: 'top bottom', end: 'top 15%', scrub: true },
        });
      });
    },
    { scope: ref },
  );
  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}
