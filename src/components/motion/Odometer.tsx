'use client';

import { useRef } from 'react';
import { gsap, useGSAP, reducedMotion } from '@/lib/gsap';

type Props = { value: string; prefix?: string; suffix?: string; className?: string };

/** Odometer counter: each digit is a 0–9 reel that spins to its value; digits land right to left. */
export function Odometer({ value, prefix = '', suffix = '', className }: Props) {
  const ref = useRef<HTMLSpanElement>(null);
  let reelIndex = 0;
  const chars = value.split('').map((ch) => {
    if (!/\d/.test(ch)) return { ch, total: 0, digit: false };
    const total = 10 * (1 + (reelIndex++ % 2)) + Number(ch); // one or two full spins
    return { ch, total, digit: true };
  });

  useGSAP(
    () => {
      const reels = gsap.utils.toArray<HTMLElement>('.odo-reel', ref.current);
      const end = (el: HTMLElement) => {
        const total = Number(el.dataset.total);
        return (-100 * total) / (total + 1);
      };
      if (reducedMotion()) {
        reels.forEach((r) => gsap.set(r, { yPercent: end(r) }));
        return;
      }
      gsap.to(reels, {
        yPercent: (i: number) => end(reels[i]),
        duration: 2.4,
        ease: 'expo.inOut',
        stagger: { each: 0.09, from: 'end' },
        scrollTrigger: { trigger: ref.current, start: 'top 88%', once: true },
      });
    },
    { scope: ref },
  );

  return (
    <span ref={ref} className={`odo ${className ?? ''}`} role="text" aria-label={`${prefix}${value}${suffix}`}>
      {prefix && <span className="odo-sep" aria-hidden="true">{prefix}</span>}
      {chars.map((c, i) =>
        c.digit ? (
          <span className="odo-col" aria-hidden="true" key={i}>
            <span className="odo-reel" data-total={c.total}>
              {Array.from({ length: c.total + 1 }, (_, n) => (
                <span key={n}>{n % 10}</span>
              ))}
            </span>
          </span>
        ) : (
          <span className="odo-sep" aria-hidden="true" key={i}>
            {c.ch}
          </span>
        ),
      )}
      {suffix && <span className="odo-sep odo-suffix" aria-hidden="true">{suffix}</span>}
    </span>
  );
}
