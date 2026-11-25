'use client';

import { useState, useTransition } from 'react';
import { Stairs } from '@/components/motion/Stairs';
import { TransitionLink } from '@/components/motion/TransitionLink';
import { useLenis } from '@/components/motion/MotionProvider';
import { ArrowIcon } from '@/components/ui/Button';
import { usePathname } from 'next/navigation';
import { navFor, legal, withExtraNav } from '@/content/site';
import type { ContactProps, CountryLink } from './types';
import { subscribeNewsletter } from '@/app/actions/forms';

export function Footer({ contact, countries, text, extraNav = [] }: { contact: ContactProps; countries: CountryLink[]; extraNav?: { label: string; href: string }[]; text: { blurb: string; tagline: string; newsletterLabel: string } }) {
  const lenis = useLenis();
  const [note, setNote] = useState('');
  const [pending, start] = useTransition();
  const pathname = usePathname();

  return (
    <footer className="section tone-charcoal footer" data-tone="dark">
      <Stairs direction="rise-left" />
      <div className="grid4 footer__brand">
        <TransitionLink href="/" className="footer__logo" aria-label="AEON Gulf home">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand/aeon-gulf-white.svg" alt="AEON Gulf" width={190} height={66} />
        </TransitionLink>
      </div>
      <div className="grid4 footer__grid">
        <div>
          <p className="eyebrow eyebrow--small">Navigate</p>
          <nav className="footer__nav" aria-label="Footer">
            {withExtraNav(navFor(pathname), extraNav).map((n) => (
              <TransitionLink key={n.href} href={n.href}>
                {n.label}
              </TransitionLink>
            ))}
          </nav>
        </div>
        <div>
          <p className="eyebrow eyebrow--small">Contacts</p>
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
          <p className="eyebrow eyebrow--small">Markets</p>
          <ul className="footer__links">
            {countries.map((c) => (
              <li key={c.slug}>
                <TransitionLink href={`/${c.slug}`}>{c.name}</TransitionLink>
              </li>
            ))}
            <li><TransitionLink href="/services">All services</TransitionLink></li>
          </ul>
          <p className="footer__blurb">{text.blurb}</p>
        </div>
        <div className="footer__end">
          <button type="button" className="footer__top" onClick={() => (lenis ? lenis.scrollTo(0, { duration: 1.6 }) : window.scrollTo({ top: 0, behavior: 'smooth' }))}>
            <ArrowIcon direction="up" /> Back to top
          </button>
          <p className="footer__small">{text.tagline}</p>
        </div>
      </div>
      <div className="grid4 footer__bottom">
        <p className="footer__small">© {new Date().getFullYear()} AEON Gulf</p>
        <form
          className="footer__form"
          onSubmit={(e) => {
            e.preventDefault();
            const form = e.currentTarget;
            const d = new FormData(form);
            start(async () => {
              const res = await subscribeNewsletter({ email: String(d.get('email') ?? ''), website: String(d.get('website') ?? ''), sourcePage: pathname });
              setNote(res.message);
              if (res.ok) form.reset();
            });
          }}
        >
          <label htmlFor="newsletter" className="footer__small">
            {text.newsletterLabel}
          </label>
          <input className="hp" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" />
          <div className="footer__field">
            <input id="newsletter" name="email" type="email" required maxLength={254} placeholder="Your email here" />
            <button type="submit" aria-label="Subscribe" disabled={pending}>
              <ArrowIcon />
            </button>
          </div>
          <p className="footer__note" aria-live="polite">
            {note}
          </p>
        </form>
        <span />
        <nav className="footer__legal" aria-label="Legal">
          {legal.map((l) => (
            <TransitionLink key={l.href} href={l.href}>
              {l.label}
            </TransitionLink>
          ))}
        </nav>
      </div>
    </footer>
  );
}
