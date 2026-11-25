'use client';

import { createElement, useRef } from 'react';
import { gsap, SplitText, useGSAP, EASE_OUT, reducedMotion, fontsReady } from '@/lib/gsap';
import { usePageTransition } from './TransitionProvider';

type Props = {
  as?: string;
  type?: 'lines' | 'words' | 'chars';
  /** Play when the page is revealed (after the preloader/transition) instead of on scroll. */
  load?: boolean;
  delay?: number;
  className?: string;
  id?: string;
  children: React.ReactNode;
};

/** Masked split-text reveal: lines/words/chars slide up from behind a line mask. */
export function SplitReveal({ as = 'div', type = 'lines', load = false, delay = 0, className, id, children }: Props) {
  const ref = useRef<HTMLElement>(null);
  const { ready } = usePageTransition();

  useGSAP(
    (_ctx, contextSafe) => {
      const el = ref.current;
      if (!el) return;
      if (reducedMotion()) {
        gsap.set(el, { visibility: 'visible' });
        return;
      }
      if (load && !ready) return;
      let split: SplitText | null = null;
      let alive = true;
      const run = contextSafe!(() => {
        if (!alive) return;
        const types = type === 'chars' ? 'chars,words,lines' : type === 'words' ? 'words,lines' : 'lines';
        split = SplitText.create(el, { type: types, mask: 'lines', linesClass: 'mk-line' });
        const targets = split[type];
        gsap.set(targets, { yPercent: 115, rotate: type === 'lines' ? 0 : 6 });
        gsap.set(el, { visibility: 'visible' });
        gsap.to(targets, {
          yPercent: 0,
          rotate: 0,
          duration: 1.15,
          ease: EASE_OUT,
          delay,
          stagger: type === 'chars' ? 0.022 : type === 'words' ? 0.045 : 0.09,
          scrollTrigger: load ? undefined : { trigger: el, start: 'top 88%', once: true },
          onComplete: () => {
            split?.revert();
            split = null;
          },
        });
      });
      fontsReady().then(run);
      return () => {
        alive = false;
        split?.revert();
      };
    },
    { dependencies: [load ? ready : true], scope: ref },
  );

  return createElement(as, { ref, className, id, 'data-reveal': '' }, children);
}
