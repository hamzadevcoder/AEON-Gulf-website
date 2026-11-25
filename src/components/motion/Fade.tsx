'use client';

import { createElement, useRef } from 'react';
import { gsap, useGSAP, EASE_OUT, reducedMotion } from '@/lib/gsap';
import { usePageTransition } from './TransitionProvider';

type Props = {
  as?: string;
  /** Animate each direct child in turn instead of the element itself. */
  childrenStagger?: boolean;
  load?: boolean;
  delay?: number;
  y?: number;
  stagger?: number;
  className?: string;
  children: React.ReactNode;
} & Record<string, unknown>;

/** Fade-up reveal (y 48 → 0, opacity 0 → 1, expo.out). */
export function Fade({ as = 'div', childrenStagger = false, load = false, delay = 0, y = 48, stagger = 0.08, className, children, ...rest }: Props) {
  const ref = useRef<HTMLElement>(null);
  const { ready } = usePageTransition();
  useGSAP(
    () => {
      const el = ref.current;
      if (!el) return;
      const targets = childrenStagger ? Array.from(el.children) : [el];
      if (reducedMotion()) {
        gsap.set(targets, { autoAlpha: 1 });
        return;
      }
      if (load && !ready) return;
      gsap.fromTo(
        targets,
        { y, autoAlpha: 0 },
        {
          y: 0,
          autoAlpha: 1,
          duration: 1.1,
          ease: EASE_OUT,
          stagger,
          delay: load ? delay + 0.3 : delay,
          scrollTrigger: load ? undefined : { trigger: el, start: 'top 90%', once: true },
        },
      );
    },
    { dependencies: [load ? ready : true], scope: ref },
  );
  return createElement(
    as,
    { ref, className, ...(childrenStagger ? { 'data-reveal-children': '' } : { 'data-reveal': '' }), ...rest },
    children,
  );
}
