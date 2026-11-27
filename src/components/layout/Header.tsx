'use client';

import { useEffect, useRef, useState } from 'react';
import { useT, useLocale } from '@/i18n/client';
import { stripLocale, switchLocalePath } from '@/i18n/config';
import { usePathname } from 'next/navigation';
import { gsap, ScrollTrigger, useGSAP, EASE_INOUT, EASE_OUT, reducedMotion } from '@/lib/gsap';
import { TransitionLink } from '@/components/motion/TransitionLink';
import { usePageTransition } from '@/components/motion/TransitionProvider';
import { useLenis } from '@/components/motion/MotionProvider';
import { ArrowIcon } from '@/components/ui/Button';
import { navFor, countryFromPath, withExtraNav } from '@/content/site';
import type { ContactProps, CountryLink } from './types';
import { CountryMenu } from './CountryMenu';
import { LanguageMenu } from './LanguageMenu';
import type { ResolvedNav } from '@/content/navigation';

export function Header({ contact, countries, extraNav = [], nav }: { contact: ContactProps; countries: CountryLink[]; extraNav?: { label: string; href: string }[]; nav: ResolvedNav }) {
  const pathname = usePathname();
  const t = useT();
  const locale = useLocale();
  const path = stripLocale(pathname);
  const otherLocale = locale === 'ar' ? 'en' : 'ar';
  const { ready } = usePageTransition();
  const lenis = useLenis();
  const headerRef = useRef<HTMLElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const tl = useRef<gsap.core.Timeline | null>(null);
  const [open, setOpen] = useState(false);
  const [compact, setCompact] = useState(false);
  const [dark, setDark] = useState(true);
  const menuItems = withExtraNav(navFor(path, nav.menu), extraNav);
  const country = countryFromPath(path);
  const ctaHref = nav.header.ctaHref.replace('{country}', country ?? 'kuwait');
  const quoteHref = ctaHref === '/quote' && country ? `/quote?country=${country}` : ctaHref;

  // Compact state + light/dark tone from whichever section sits under the header.
  useGSAP(
    () => {
      if (!ready) return;
      const active = new Set<Element>();
      const update = () => setDark(active.size > 0);
      const triggers = gsap.utils.toArray<HTMLElement>('[data-tone="dark"]').map((el) =>
        ScrollTrigger.create({
          trigger: el,
          start: 'top 40px',
          end: 'bottom 40px',
          onToggle: (s) => {
            if (s.isActive) active.add(el);
            else active.delete(el);
            update();
          },
        }),
      );
      update();
      const compactTrigger = ScrollTrigger.create({
        start: 0,
        end: 'max',
        onUpdate: (s) => setCompact(s.scroll() > 80),
      });
      setCompact(window.scrollY > 80);
      return () => {
        triggers.forEach((t) => t.kill());
        compactTrigger.kill();
      };
    },
    { dependencies: [pathname, ready] },
  );

  // Menu timeline: dim + blur the page, panel slides in from the right, links rise in.
  useGSAP(
    () => {
      const root = menuRef.current!;
      const quick = reducedMotion();
      tl.current = gsap
        .timeline({ paused: true, defaults: { ease: EASE_INOUT } })
        .set(root, { visibility: 'visible' })
        .fromTo('.menu__dim', { opacity: 0 }, { opacity: 1, duration: quick ? 0.01 : 0.7 }, 0)
        .fromTo('.menu__panel', { xPercent: document.documentElement.dir === 'rtl' ? -104 : 104 }, { xPercent: 0, duration: quick ? 0.01 : 0.9 }, 0)
        .fromTo('.menu__link', { yPercent: 110 }, { yPercent: 0, duration: quick ? 0.01 : 0.9, ease: EASE_OUT, stagger: 0.05 }, quick ? 0 : 0.35)
        .fromTo('.menu__foot', { autoAlpha: 0, y: 20 }, { autoAlpha: 1, y: 0, duration: quick ? 0.01 : 0.8, ease: EASE_OUT }, quick ? 0 : 0.6);
    },
    { scope: menuRef },
  );

  useEffect(() => {
    const html = document.documentElement;
    html.classList.toggle('menu-open', open);
    if (open) {
      lenis?.stop();
      tl.current?.timeScale(1).play();
      const first = menuRef.current?.querySelector<HTMLElement>('.menu__link a');
      setTimeout(() => first?.focus(), 400);
    } else {
      tl.current?.timeScale(1.6).reverse();
      lenis?.start();
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open) {
        setOpen(false);
        toggleRef.current?.focus();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, lenis]);

  // A menu link starts a page transition; close the menu once the new page is in place.
  useEffect(() => {
    setOpen(false);
    tl.current?.progress(0).pause();
    document.documentElement.classList.remove('menu-open');
  }, [pathname]);

  return (
    <>
      <header ref={headerRef} className={`header ${compact ? 'is-compact' : ''} ${dark ? 'is-dark' : 'is-light'} ${open ? 'is-open' : ''}`}>
        <TransitionLink href="/" className="header__logo hide-on-compact" aria-label={t('header.home')}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="logo-white" src="/brand/aeon-gulf-white.svg" alt="" width={132} height={46} />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="logo-color" src="/brand/aeon-gulf-color.svg" alt="" width={132} height={46} />
        </TransitionLink>
        <div className="header__right">
          {nav.header.showCountries && <CountryMenu className="hide-on-compact" countries={countries} />}
          {nav.header.showLanguage && <LanguageMenu className="hide-on-compact" />}
          {nav.header.showCta && (
            <TransitionLink href={quoteHref} className="chip chip--cta hide-on-compact">
              <span className="chip__square" aria-hidden="true" />
              {nav.header.ctaLabel}
            </TransitionLink>
          )}
          <button
            ref={toggleRef}
            type="button"
            className="chip chip--menu"
            aria-expanded={open}
            aria-controls="site-menu"
            onClick={() => setOpen((v) => !v)}
          >
            <span className={`menu-icon ${open ? 'is-x' : ''}`} aria-hidden="true" />
            <span>{open ? t('header.close') : t('header.menu')}</span>
          </button>
        </div>
      </header>

      <div ref={menuRef} className="menu" id="site-menu" aria-hidden={!open} role="dialog" aria-label={t('header.siteMenu')}>
        <div className="menu__dim" onClick={() => setOpen(false)} />
        <div className="menu__panel">
          <div>
            <p className="eyebrow eyebrow--small">{t('menu.navigate')}</p>
            <nav className="menu__links" aria-label="Main">
              {menuItems.map((item) => {
                const current = item.href.split('?')[0] === path;
                return (
                  <span className="menu__link" key={item.href}>
                    <TransitionLink href={item.href} aria-current={current ? 'page' : undefined} tabIndex={open ? 0 : -1} onClick={() => item.href.includes('#') && setOpen(false)}>
                      {item.label}
                    </TransitionLink>
                  </span>
                );
              })}
            </nav>
          </div>
          <div className="menu__foot">
            <div>
              <p className="eyebrow eyebrow--small">{t('menu.contactUs')}</p>
              <a className="menu__contact" href={`mailto:${contact.email}`} tabIndex={open ? 0 : -1}>
                <ArrowIcon /> {contact.email}
              </a>
              <a className="menu__contact" href={contact.phoneHref} tabIndex={open ? 0 : -1}>
                <ArrowIcon /> {contact.phone}
              </a>
            </div>
            {nav.popular.length > 0 && (
            <div>
              <p className="eyebrow eyebrow--small">{t('menu.popular')}</p>
              <ul className="menu__list">
                {nav.popular.map((p) => (
                  <li key={p.href + p.label}>
                    <TransitionLink href={p.href.replace('{country}', country ?? 'kuwait')} tabIndex={open ? 0 : -1}>
                      {p.label}
                    </TransitionLink>
                  </li>
                ))}
              </ul>
            </div>
            )}
            {nav.header.showLanguage && (
            <div className="menu__lang">
              <p className="eyebrow eyebrow--small">{t('menu.language')}</p>
              <div className="menu__lang-options" role="group" aria-label={t('menu.language')}>
                <span className="menu__lang-option is-active" aria-current="true">
                  {locale === 'ar' ? 'ع' : 'EN'} <span>{t('lang.current')}</span>
                </span>
                <a className="menu__lang-option" href={switchLocalePath(pathname, otherLocale)} hrefLang={otherLocale}>
                  {locale === 'ar' ? 'EN' : 'ع'} <span>{t('lang.other')}</span>
                </a>
              </div>
            </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
