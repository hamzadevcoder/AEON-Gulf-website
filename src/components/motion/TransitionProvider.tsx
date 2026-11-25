'use client';

import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { gsap, ScrollTrigger, EASE_INOUT, reducedMotion, fontsReady } from '@/lib/gsap';
import { useLenis } from './MotionProvider';

type TransitionApi = {
  /** False while the column overlay covers the page; load-time reveals wait for true. */
  ready: boolean;
  navigate: (href: string) => void;
};

const TransitionContext = createContext<TransitionApi>({ ready: true, navigate: () => {} });
export const usePageTransition = () => useContext(TransitionContext);

const COLUMNS = 6;

/**
 * Preloader + page transitions: six charcoal columns. On first load they lift away one after another; on navigation they rise to cover
 * the page, the route changes behind them, then they lift away again.
 */
export function TransitionProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const lenis = useLenis();
  const overlay = useRef<HTMLDivElement>(null);
  const pending = useRef<{ hash: string } | null>(null);
  const busy = useRef(true);
  const lastPath = useRef(pathname);
  const [ready, setReady] = useState(false);

  const parts = () => {
    const root = overlay.current!;
    return { cols: root.querySelectorAll('.tr-col') };
  };

  const scrollToHash = useCallback(
    (hash: string, immediate = false) => {
      if (!hash || hash === '#') return;
      const target = document.querySelector(hash) as HTMLElement | null;
      if (!target) return;
      if (lenis) lenis.scrollTo(target, { immediate, duration: 1.4 });
      else target.scrollIntoView({ behavior: immediate ? 'auto' : 'smooth' });
    },
    [lenis],
  );

  const reveal = useCallback(
    (hash = '') => {
      const { cols } = parts();
      if (reducedMotion()) {
        gsap.set(overlay.current, { autoAlpha: 0 });
        setReady(true);
        busy.current = false;
        scrollToHash(hash, true);
        return;
      }
      gsap
        .timeline({
          onComplete: () => {
            gsap.set(overlay.current, { visibility: 'hidden' });
            busy.current = false;
          },
        })
        .to(cols, { yPercent: -100, duration: 1.05, ease: EASE_INOUT, stagger: 0.06 })
        .add(() => {
          setReady(true);
          scrollToHash(hash);
        }, '-=0.75');
    },
    [scrollToHash],
  );

  // First load: the overlay is server-rendered in its covered state, so there is no flash.
  useEffect(() => {
    let cancelled = false;
    Promise.all([fontsReady(), new Promise((r) => setTimeout(r, 450))]).then(() => {
      if (cancelled) return;
      ScrollTrigger.refresh();
      reveal(window.location.hash);
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const navigate = useCallback(
    (href: string) => {
      const url = new URL(href, window.location.href);
      if (url.origin !== window.location.origin) {
        window.location.href = href;
        return;
      }
      if (url.pathname === window.location.pathname) {
        if (url.hash) scrollToHash(url.hash);
        else if (lenis) lenis.scrollTo(0, { duration: 1.4 });
        else window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }
      if (busy.current) return;
      busy.current = true;
      pending.current = { hash: url.hash };
      setReady(false);
      lenis?.stop();
      const go = () => router.push(url.pathname + url.search, { scroll: false });
      if (reducedMotion()) return go();
      const { cols } = parts();
      gsap.set(overlay.current, { visibility: 'visible', autoAlpha: 1 });
      gsap.set(cols, { yPercent: 100 });
      gsap.timeline().to(cols, { yPercent: 0, duration: 0.9, ease: EASE_INOUT, stagger: 0.06 }).add(go, '+=0.1');
    },
    [lenis, router, scrollToHash],
  );

  // The new route has rendered behind the overlay: reset scroll, re-measure, then reveal.
  useEffect(() => {
    if (pathname === lastPath.current) return;
    lastPath.current = pathname;
    const job = pending.current;
    pending.current = null;
    lenis?.start();
    lenis?.scrollTo(0, { immediate: true, force: true });
    window.scrollTo(0, 0);
    const id = requestAnimationFrame(() => {
      ScrollTrigger.refresh();
      if (job) reveal(job.hash);
      else setReady(true); // browser back/forward: no cover, just show the page
    });
    return () => cancelAnimationFrame(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  return (
    <TransitionContext.Provider value={{ ready, navigate }}>
      {children}
      <div ref={overlay} className="transition-overlay" aria-hidden="true">
        {Array.from({ length: COLUMNS }, (_, i) => (
          <span key={i} className="tr-col" />
        ))}
      </div>
    </TransitionContext.Provider>
  );
}
