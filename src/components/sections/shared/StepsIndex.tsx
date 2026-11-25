'use client';

import { useRef } from 'react';
import { gsap, ScrollTrigger, useGSAP, reducedMotion } from '@/lib/gsap';

/** Numbered process with the reference's giant sticky index rolling 01 → 0N as each step passes. */
export function StepsIndex({ items }: { items: { title: string; text: string }[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const reel = useRef<HTMLSpanElement>(null);
  useGSAP(
    () => {
      const rows = gsap.utils.toArray<HTMLElement>('.step-row', ref.current);
      rows.forEach((row, i) =>
        ScrollTrigger.create({
          trigger: row,
          start: 'top 55%',
          end: 'bottom 55%',
          onToggle: (s) => {
            if (!s.isActive) return;
            gsap.to(reel.current, { yPercent: (-100 * i) / rows.length, duration: reducedMotion() ? 0 : 0.9, ease: 'expo.out', overwrite: true });
            rows.forEach((x) => x.classList.toggle('is-active', x === row));
          },
        }),
      );
    },
    { scope: ref },
  );
  return (
    <div ref={ref} className="grid4 steps">
      <ol className="steps__list">
        {items.map((s, i) => (
          <li className="step-row" key={i}>
            <span className="step-row__n">{String(i + 1).padStart(2, '0')}.</span>
            <h3 className="h-card">{s.title}</h3>
            <p>{s.text}</p>
          </li>
        ))}
      </ol>
      <div className="steps__index" aria-hidden="true">
        <span className="idx">
          <span ref={reel} className="idx-reel">
            {items.map((_, i) => (
              <span key={i}>{String(i + 1).padStart(2, '0')}</span>
            ))}
          </span>
        </span>
      </div>
    </div>
  );
}
