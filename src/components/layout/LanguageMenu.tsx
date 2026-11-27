'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { useLocale, useT } from '@/i18n/client';
import { switchLocalePath, type Locale } from '@/i18n/config';

const options: { code: Locale; short: string; label: string }[] = [
  { code: 'en', short: 'EN', label: 'English' },
  { code: 'ar', short: 'ع', label: 'العربية' },
];

/** Header dropdown for switching language (same look as the country dropdown). */
export function LanguageMenu({ className = '' }: { className?: string }) {
  const pathname = usePathname();
  const locale = useLocale();
  const t = useT();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const current = options.find((o) => o.code === locale) ?? options[0];

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
    <div ref={ref} className={`country-menu language-menu ${open ? 'is-open' : ''} ${className}`}>
      <button type="button" className="chip country-menu__toggle" aria-expanded={open} aria-haspopup="true" aria-controls="language-menu-list" aria-label={t('menu.language')} onClick={() => setOpen((v) => !v)}>
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.1" aria-hidden="true">
          <circle cx="9" cy="9" r="7.5" />
          <path d="M1.5 9h15M9 1.5c2 2.2 2.9 4.7 2.9 7.5S11 14.3 9 16.5C7 14.3 6.1 11.8 6.1 9S7 3.7 9 1.5Z" />
        </svg>
        <span>{current.short}</span>
        <svg className="country-menu__chev" width="10" height="10" viewBox="0 0 10 10" aria-hidden="true">
          <path d="M1.5 3.5 5 7l3.5-3.5" fill="none" stroke="currentColor" strokeWidth="1.3" />
        </svg>
      </button>
      <ul id="language-menu-list" className="country-menu__list" role="list">
        {options.map((o) => (
          <li key={o.code}>
            {/* a full page load on purpose: the page direction (left-to-right / right-to-left) changes with the language */}
            <a href={switchLocalePath(pathname, o.code)} hrefLang={o.code} lang={o.code} aria-current={o.code === locale ? 'page' : undefined} tabIndex={open ? 0 : -1}>
              <span className="language-menu__code">{o.short}</span>
              <span>{o.label}</span>
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
