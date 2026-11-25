'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export type NavItem = { href: string; label: string; count?: number; group?: string };

/** Sidebar navigation with the current page highlighted; collapses to a drawer on small screens. */
export function Shell({ nav, side, children }: { nav: NavItem[]; side: React.ReactNode; children: React.ReactNode }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  useEffect(() => setOpen(false), [pathname]);
  const isCurrent = (href: string) => (href === '/admin' ? pathname === '/admin' : pathname === href || pathname.startsWith(href + '/'));
  let lastGroup: string | undefined;
  return (
    <div className={`adm-shell ${open ? 'is-open' : ''}`}>
      <div className="adm-topbar">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/brand/aeon-gulf-white.svg" alt="AEON Gulf" />
        <button type="button" className="adm-btn adm-btn--ghost adm-btn--sm" onClick={() => setOpen((v) => !v)} aria-expanded={open} aria-controls="adm-side">
          {open ? 'Close' : 'Menu'}
        </button>
      </div>
      <aside className="adm-side" id="adm-side" onClick={(e) => e.target === e.currentTarget && setOpen(false)}>
        <Link href="/admin" className="adm-side__logo">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand/aeon-gulf-white.svg" alt="AEON Gulf" />
          <span>Admin</span>
        </Link>
        <nav className="adm-nav" aria-label="Dashboard">
          {nav.map((n) => {
            const heading = n.group && n.group !== lastGroup ? n.group : null;
            lastGroup = n.group;
            return (
              <div key={n.href} style={{ display: 'contents' }}>
                {heading && <p className="adm-nav__group">{heading}</p>}
                <Link href={n.href} aria-current={isCurrent(n.href) ? 'page' : undefined}>
                  <span>{n.label}</span>
                  {n.count ? <span className="adm-nav__count">{n.count}</span> : null}
                </Link>
              </div>
            );
          })}
        </nav>
        {side}
      </aside>
      <main className="adm-main" id="main">
        {children}
      </main>
    </div>
  );
}
