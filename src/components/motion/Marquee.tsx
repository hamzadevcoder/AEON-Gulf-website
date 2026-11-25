'use client';

import { useRef } from 'react';
import { gsap, ScrollTrigger, useGSAP, reducedMotion } from '@/lib/gsap';

type Props = { speed?: number; direction?: 'left' | 'right'; className?: string; children: React.ReactNode };

/** Velocity marquee: constant drift that speeds up with scroll velocity, then eases back. */
export function Marquee({ speed = 60, direction = 'left', className, children }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const track = useRef<HTMLDivElement>(null);
  useGSAP(
    () => {
      if (reducedMotion()) return;
      const unit = track.current!.firstElementChild as HTMLElement;
      const dir = direction === 'right' ? 1 : -1;
      let x = 0;
      let boost = 0;
      const tick = (_t: number, dt: number) => {
        const w = unit.offsetWidth;
        if (!w) return;
        x += dir * speed * (dt / 1000) * (1 + boost);
        x = gsap.utils.wrap(-w, 0, x);
        boost *= 0.94;
        track.current!.style.transform = `translate3d(${x}px,0,0)`;
      };
      gsap.ticker.add(tick);
      const st = ScrollTrigger.create({
        trigger: ref.current,
        start: 'top bottom',
        end: 'bottom top',
        onUpdate: (s) => {
          boost = Math.min(Math.abs(s.getVelocity()) / 250, 8);
        },
      });
      return () => {
        gsap.ticker.remove(tick);
        st.kill();
      };
    },
    { scope: ref },
  );
  return (
    <div ref={ref} className={`marquee ${className ?? ''}`}>
      <div ref={track} className="marquee-track">
        {[0, 1, 2, 3].map((n) => (
          <div className="marquee-unit" key={n} aria-hidden={n > 0 ? 'true' : undefined}>
            {children}
          </div>
        ))}
      </div>
    </div>
  );
}
