'use client';

import { useRef, useState } from 'react';
import { gsap, ScrollTrigger, useGSAP, reducedMotion } from '@/lib/gsap';
import { useLenis } from '@/components/motion/MotionProvider';
import { usePageTransition } from '@/components/motion/TransitionProvider';

/**
 * In-page section navigation for long pages. It slides in once the hero has scrolled away,
 * sits level with the header chips, and highlights the section currently in view.
 */
export function SubNav({ items }: { items: { id: string; label: string }[] }) {
  const ref = useRef<HTMLElement>(null);
  const lenis = useLenis();
  const { ready } = usePageTransition();
  const [active, setActive] = useState(items[0]?.id);

  useGSAP(
    () => {
      if (!ready) return;
      const first = document.getElementById(items[0].id);
      const show = ScrollTrigger.create({
        trigger: first,
        start: 'top 60%',
        endTrigger: document.getElementById(items[items.length - 1].id),
        end: 'bottom 40%',
        onToggle: (s) =>
          gsap.to(ref.current, { autoAlpha: s.isActive ? 1 : 0, y: s.isActive ? 0 : -16, duration: reducedMotion() ? 0 : 0.5, ease: 'expo.out', overwrite: true }),
      });
      const spies = items.map((it) =>
        ScrollTrigger.create({
          trigger: document.getElementById(it.id),
          start: 'top 45%',
          end: 'bottom 45%',
          onToggle: (s) => s.isActive && setActive(it.id),
        }),
      );
      return () => {
        show.kill();
        spies.forEach((s) => s.kill());
      };
    },
    { dependencies: [ready] },
  );

  return (
    <nav ref={ref} className="subnav" aria-label="On this page">
      {items.map((it) => (
        <a
          key={it.id}
          href={`#${it.id}`}
          className={active === it.id ? 'is-active' : ''}
          aria-current={active === it.id ? 'true' : undefined}
          onClick={(e) => {
            e.preventDefault();
            const el = document.getElementById(it.id);
            if (!el) return;
            if (lenis) lenis.scrollTo(el, { offset: -10, duration: 1.4 });
            else el.scrollIntoView({ behavior: 'smooth' });
          }}
        >
          {it.label}
        </a>
      ))}
    </nav>
  );
}
