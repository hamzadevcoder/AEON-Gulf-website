'use client';

import { useState, useTransition } from 'react';
import { useT, useLocale } from '@/i18n/client';
import { stripLocale } from '@/i18n/config';
import { Stairs } from '@/components/motion/Stairs';
import { TransitionLink } from '@/components/motion/TransitionLink';
import { useLenis } from '@/components/motion/MotionProvider';
import { ArrowIcon } from '@/components/ui/Button';
import { usePathname } from 'next/navigation';
import { navFor, withExtraNav } from '@/content/site';
import type { ResolvedNav } from '@/content/navigation';
import type { ContactProps, CountryLink } from './types';
import { subscribeNewsletter } from '@/app/actions/forms';

export function Footer({ contact, countries, text, extraNav = [], nav }: { contact: ContactProps; countries: CountryLink[]; extraNav?: { label: string; href: string }[]; nav: ResolvedNav; text: { blurb: string; tagline: string; newsletterLabel: string } }) {
  const lenis = useLenis();
  const [note, setNote] = useState('');
  const [pending, start] = useTransition();
  const pathname = usePathname();
  const t = useT();
  const locale = useLocale();

  return (
    <footer className="section tone-charcoal footer" data-tone="dark">
      <Stairs direction="rise-left" />
      <div className="grid4 footer__brand">
        <TransitionLink href="/" className="footer__logo" aria-label={t('header.home')}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand/aeon-gulf-white.svg" alt="AEON Gulf" width={190} height={66} />
        </TransitionLink>
      </div>
      <div className="grid4 footer__grid">
        <div>
          <p className="eyebrow eyebrow--small">{t('footer.navigate')}</p>
          <nav className="footer__nav" aria-label="Footer">
            {withExtraNav(navFor(stripLocale(pathname), nav.footer.links), extraNav).map((n) => (
              <TransitionLink key={n.href} href={n.href}>
                {n.label}
              </TransitionLink>
            ))}
          </nav>
        </div>
        <div>
          <p className="eyebrow eyebrow--small">{t('footer.contacts')}</p>
          <ul className="footer__list">
            <li>
              <a href={`mailto:${contact.email}`}>
                <ArrowIcon /> {contact.email}
              </a>
            </li>
            <li>
              <a href={contact.phoneHref}>
                <ArrowIcon /> {contact.phone}
              </a>
            </li>
          </ul>
          <address className="footer__address">
            {contact.offices.map((o) => (
              <span key={o.country}>
                {o.country}: {o.detail}
              </span>
            ))}
          </address>
        </div>
        <div>
          {nav.footer.showMarkets && (
            <>
              <p className="eyebrow eyebrow--small">{t('footer.markets')}</p>
              <ul className="footer__links">
                {countries.map((c) => (
                  <li key={c.slug}>
                    <TransitionLink href={`/${c.slug}`}>{c.name}</TransitionLink>
                  </li>
                ))}
                <li><TransitionLink href="/services">{t('common.allServices')}</TransitionLink></li>
              </ul>
            </>
          )}
          <p className="footer__blurb">{text.blurb}</p>
        </div>
        <div className="footer__end">
          <button type="button" className="footer__top" onClick={() => (lenis ? lenis.scrollTo(0, { duration: 1.6 }) : window.scrollTo({ top: 0, behavior: 'smooth' }))}>
            <ArrowIcon direction="up" /> {t('footer.backToTop')}
          </button>
          <p className="footer__small">{text.tagline}</p>
          {nav.footer.social.length > 0 && (
            <ul className="footer__social">
              {nav.footer.social.map((s) => (
                <li key={s.href}>
                  <a href={s.href} target="_blank" rel="noopener noreferrer">
                    {s.label}
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
      <div className="grid4 footer__bottom">
        <p className="footer__small">{nav.footer.copyright}</p>
        {nav.footer.showNewsletter ? (
        <form
          className="footer__form"
          onSubmit={(e) => {
            e.preventDefault();
            const form = e.currentTarget;
            const d = new FormData(form);
            start(async () => {
              const res = await subscribeNewsletter({ email: String(d.get('email') ?? ''), website: String(d.get('hp_ref') ?? ''), sourcePage: pathname, locale });
              setNote(res.message);
              if (res.ok) form.reset();
            });
          }}
        >
          <label htmlFor="newsletter" className="footer__small">
            {text.newsletterLabel}
          </label>
          <input className="hp" name="hp_ref" tabIndex={-1} autoComplete="off" data-lpignore="true" data-1p-ignore="true" data-form-type="other" aria-hidden="true" />
          <div className="footer__field">
            <input id="newsletter" name="email" type="email" required maxLength={254} placeholder={t('footer.email')} />
            <button type="submit" aria-label={t('footer.subscribe')} disabled={pending}>
              <ArrowIcon />
            </button>
          </div>
          <p className="footer__note" aria-live="polite">
            {note}
          </p>
        </form>
        ) : (
          <span />
        )}
        <span />
        <nav className="footer__legal" aria-label={t('footer.legal')}>
          {nav.footer.legal.map((l) => (
            <TransitionLink key={l.href} href={l.href}>
              {l.label}
            </TransitionLink>
          ))}
        </nav>
      </div>
    </footer>
  );
}
