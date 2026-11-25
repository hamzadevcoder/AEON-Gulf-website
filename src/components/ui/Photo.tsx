'use client';

import { useRef, useState } from 'react';
import { gsap, useGSAP, reducedMotion } from '@/lib/gsap';

type Props = {
  src: string;
  alt: string;
  className?: string;
  /** Scroll parallax strength (0.1–0.3). The image is made taller than its frame. */
  parallax?: number;
  /** Clip-path reveal from the bottom as the frame scrolls into view. */
  reveal?: boolean;
  priority?: boolean;
  tone?: 'light' | 'dark' | 'mid';
};

/** Photo inside a frame, with a gradient fallback while loading (or if the image fails). */
export function Photo({ src, alt, className = '', parallax = 0, reveal = false, priority = false, tone = 'mid' }: Props) {
  const frame = useRef<HTMLDivElement>(null);
  const img = useRef<HTMLImageElement>(null);
  const [failed, setFailed] = useState(false);

  useGSAP(
    () => {
      // An image that failed before hydration never fires onError, so check on mount.
      const el = img.current;
      if (el && el.complete && el.naturalWidth === 0) setFailed(true);
      if (reducedMotion()) return;
      if (parallax) {
        gsap.fromTo(
          img.current,
          { yPercent: -parallax * 40 },
          { yPercent: parallax * 40, ease: 'none', scrollTrigger: { trigger: frame.current, start: 'top bottom', end: 'bottom top', scrub: true } },
        );
      }
      if (reveal) {
        const tl = gsap.timeline({ scrollTrigger: { trigger: frame.current, start: 'top 85%', once: true } });
        tl.fromTo(frame.current, { clipPath: 'inset(100% 0% 0% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.5, ease: 'expo.inOut' });
        tl.from(img.current, { scale: 1.3, duration: 2, ease: 'expo.out' }, 0.1);
      }
    },
    { scope: frame },
  );

  return (
    <div ref={frame} className={`photo ph ph--${tone} ${parallax ? 'photo--parallax' : ''} ${className}`}>
      {!failed && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          ref={img}
          src={src}
          alt={alt}
          loading={priority ? 'eager' : 'lazy'}
          decoding="async"
          fetchPriority={priority ? 'high' : undefined}
          onError={() => setFailed(true)}
          style={parallax ? { height: `${100 + parallax * 120}%`, top: `${-parallax * 60}%` } : undefined}
        />
      )}
    </div>
  );
}
