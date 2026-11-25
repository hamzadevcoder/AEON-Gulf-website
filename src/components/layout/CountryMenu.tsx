'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { TransitionLink } from '@/components/motion/TransitionLink';
import { Flag } from '@/components/ui/Flag';
import { countryFromPath } from '@/content/site';
import type { CountryLink } from './types';

/** Header dropdown for switching country, shown with flags (like the language chip). */
export function CountryMenu({ className = '', countries }: { className?: string; countries: CountryLink[] }) {
  const pathname = usePathname();
  const current = countries.find((c) => c.slug === countryFromPath(pathname));
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false);
        ref.current?.querySelector('button')?.focus();
      }
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className={`country-menu ${open ? 'is-open' : ''} ${className}`}>
      <button type="button" className="chip country-menu__toggle" aria-expanded={open} aria-haspopup="true" aria-controls="country-menu-list" onClick={() => setOpen((v) => !v)}>
        {current ? <Flag country={current.slug} /> : <GlobeIcon />}
        <span className="country-menu__label">{current ? current.name : 'Countries'}</span>
        <svg className="country-menu__chev" width="10" height="10" viewBox="0 0 10 10" aria-hidden="true">
          <path d="M1.5 3.5 5 7l3.5-3.5" fill="none" stroke="currentColor" strokeWidth="1.3" />
        </svg>
      </button>
      <ul id="country-menu-list" className="country-menu__list" role="list">
        {countries.map((c) => (
          <li key={c.slug}>
            <TransitionLink href={`/${c.slug}`} aria-current={current?.slug === c.slug ? 'page' : undefined} tabIndex={open ? 0 : -1}>
              <Flag country={c.slug} />
              <span>{c.name}</span>
            </TransitionLink>
          </li>
        ))}
      </ul>
    </div>
  );
}

function GlobeIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.1" aria-hidden="true">
      <circle cx="9" cy="9" r="7.5" />
      <path d="M1.5 9h15M9 1.5c2 2.2 2.9 4.7 2.9 7.5S11 14.3 9 16.5C7 14.3 6.1 11.8 6.1 9S7 3.7 9 1.5Z" />
    </svg>
  );
}
