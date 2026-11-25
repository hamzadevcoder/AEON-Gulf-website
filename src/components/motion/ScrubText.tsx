'use client';

import { createElement, useRef } from 'react';
import { gsap, SplitText, useGSAP, reducedMotion, fontsReady } from '@/lib/gsap';

type Props = { as?: string; from?: number; className?: string; children: React.ReactNode };

/** Scroll-scrubbed word fill: words brighten one by one, tied to scroll position. */
export function ScrubText({ as = 'p', from = 0.18, className, children }: Props) {
  const ref = useRef<HTMLElement>(null);
  useGSAP(
    (_ctx, contextSafe) => {
      const el = ref.current;
      if (!el || reducedMotion()) return;
      let split: SplitText | null = null;
      let alive = true;
      const run = contextSafe!(() => {
        if (!alive) return;
        split = SplitText.create(el, { type: 'words' });
        gsap.fromTo(
          split.words,
          { opacity: from },
          { opacity: 1, ease: 'none', stagger: 0.1, scrollTrigger: { trigger: el, start: 'top 82%', end: 'bottom 48%', scrub: true } },
        );
      });
      fontsReady().then(run);
      return () => {
        alive = false;
        split?.revert();
      };
    },
    { scope: ref },
  );
  return createElement(as, { ref, className }, children);
}
