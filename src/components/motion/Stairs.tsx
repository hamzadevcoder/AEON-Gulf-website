'use client';

import { useRef } from 'react';
import { gsap, useGSAP, reducedMotion } from '@/lib/gsap';

type Props = {
  /** 'rise-right': the right-hand column is tallest (most sections). 'rise-left': the footer. */
  direction?: 'rise-right' | 'rise-left';
};

/**
 * Staircase section edge, as on the reference: the incoming section's top edge is split into
 * the four grid columns, each one step taller than the last. The steps grow in, scrubbed to
 * scroll, as the edge moves up the screen. Place as the first child of a `.section`.
 */
export function Stairs({ direction = 'rise-right' }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  useGSAP(
    () => {
      const steps = gsap.utils.toArray<HTMLElement>('span', ref.current);
      if (reducedMotion()) {
        gsap.set(steps, { scaleY: 1 });
        return;
      }
      const ordered = direction === 'rise-right' ? steps : [...steps].reverse();
      gsap.fromTo(
        ordered,
        { scaleY: 0 },
        {
          scaleY: 1,
          ease: 'none',
          stagger: 0.05,
          // Starts only once the edge is a little way into the viewport, so nothing shows before scrolling.
          scrollTrigger: { trigger: ref.current, start: 'bottom 98%', end: 'bottom 45%', scrub: true },
        },
      );
    },
    { scope: ref },
  );
  return (
    <div ref={ref} className={`stairs stairs--${direction}`} aria-hidden="true">
      <span />
      <span />
      <span />
      <span />
    </div>
  );
}
