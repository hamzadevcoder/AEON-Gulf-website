'use client';

import { useRef, useState } from 'react';
import { gsap, useGSAP, reducedMotion } from '@/lib/gsap';

/** FAQ accordion: one open at a time, height animated with expo easing. */
export function Faq({ items, idPrefix = 'faq' }: { items: { q: string; a: string }[]; idPrefix?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(0);

  useGSAP(
    () => {
      const panels = gsap.utils.toArray<HTMLElement>('.faq__panel', ref.current);
      panels.forEach((p, i) =>
        gsap.to(p, { height: i === open ? 'auto' : 0, duration: reducedMotion() ? 0 : 0.7, ease: 'expo.out', overwrite: true }),
      );
    },
    { dependencies: [open], scope: ref },
  );

  return (
    <div ref={ref} className="faq">
      {items.map((f, i) => {
        const id = `${idPrefix}-${i}`;
        const isOpen = i === open;
        return (
          <div className={`faq__item ${isOpen ? 'is-open' : ''}`} key={i}>
            <h3>
              <button type="button" className="faq__q" aria-expanded={isOpen} aria-controls={id} onClick={() => setOpen(isOpen ? -1 : i)}>
                <span>{f.q}</span>
                <span className="faq__icon" aria-hidden="true" />
              </button>
            </h3>
            <div className="faq__panel" id={id} role="region" style={{ height: i === 0 ? 'auto' : 0 }}>
              <p>{f.a}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
