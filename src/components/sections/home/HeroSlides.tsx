'use client';

import { useRef, useState } from 'react';
import { gsap, useGSAP, reducedMotion } from '@/lib/gsap';
import { image, type ImageKey } from '@/content/images';

const slides: { key: ImageKey; label: string }[] = [
  { key: 'landingBanner', label: 'AEON Gulf' },
  { key: 'kuwaitBanner', label: 'Kuwait' },
  { key: 'qatarBanner', label: 'Qatar' },
  { key: 'riyadhNight', label: 'Saudi Arabia' },
];
const HOLD = 6;

/**
 * Homepage banner: the current site's main banner image, followed by the three markets, cross-fading
 * with a slow zoom (standing in for the reference's background video) and scroll parallax.
 * Swap for a <video> here if AEON supplies footage.
 */
export function HeroSlides() {
  const ref = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);

  useGSAP(
    () => {
      const els = gsap.utils.toArray<HTMLElement>('.hero-slide', ref.current);
      gsap.set(els, { autoAlpha: 0 });
      gsap.set(els[0], { autoAlpha: 1 });
      if (reducedMotion()) return;
      gsap.to(ref.current!.querySelector('.hero-slides__inner'), {
        yPercent: 12,
        ease: 'none',
        scrollTrigger: { trigger: ref.current, start: 'top top', end: 'bottom top', scrub: true },
      });
      const tl = gsap.timeline({ repeat: -1 });
      els.forEach((el, i) => {
        const next = els[(i + 1) % els.length];
        const img = el.querySelector('img');
        tl.fromTo(img, { scale: 1.12 }, { scale: 1, duration: HOLD + 1.6, ease: 'none' }, i * HOLD)
          .add(() => setActive((i + 1) % els.length), i * HOLD + HOLD)
          .to(el, { autoAlpha: 0, duration: 1.6, ease: 'power2.inOut' }, i * HOLD + HOLD)
          .to(next, { autoAlpha: 1, duration: 1.6, ease: 'power2.inOut' }, i * HOLD + HOLD);
      });
    },
    { scope: ref },
  );

  return (
    <div ref={ref} className="hero-slides" aria-hidden="true">
      <div className="hero-slides__inner">
        {slides.map((s, i) => {
          const img = image(s.key);
          return (
            <div className="hero-slide ph ph--dark" key={s.key}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={img.src} alt="" loading={i === 0 ? 'eager' : 'lazy'} fetchPriority={i === 0 ? 'high' : undefined} />
            </div>
          );
        })}
      </div>
      <div className="hero-slides__dots">
        {slides.map((s, i) => (
          <span key={s.key} className={i === active ? 'is-active' : ''}>
            <i style={{ animationDuration: `${HOLD}s` }} />
          </span>
        ))}
      </div>
    </div>
  );
}
