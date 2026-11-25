'use client';

import { useEffect, useMemo, useState, useTransition } from 'react';
import { usePathname } from 'next/navigation';
import { ArrowIcon } from '@/components/ui/Button';
import { Flag } from '@/components/ui/Flag';
import { submitQuote } from '@/app/actions/forms';
import { quoteSchema, fieldErrors } from '@/lib/forms-schema';

const projectTypes = [
  'New company or branch setup',
  'Ongoing PRO / GRO and compliance support',
  'Changes to an existing company',
  'Relocation of staff or offices',
  'Closing a company or branch',
  'Other',
];

/** What the server passes in: the countries and each country's services, grouped. */
export type QuoteOptions = {
  countries: { slug: string; name: string }[];
  groups: { label: string; services: { name: string; country: string }[] }[];
};

type Props = {
  options: QuoteOptions;
  /** Country slug to pre-select (otherwise read from ?country=). */
  country?: string;
  /** Service name to pre-select (otherwise read from ?service=). */
  service?: string;
  compact?: boolean;
  title?: string;
};

/** "Get a quote" form: validated in the browser and on the server, saved to the database, emailed to the team. */
export function QuoteForm({ options, country: initialCountry, service: initialService, compact = false, title = 'Request a quote' }: Props) {
  const pathname = usePathname();
  const [country, setCountry] = useState(initialCountry ?? '');
  const [service, setService] = useState(initialService ?? '');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<{ ok: boolean; message: string } | null>(null);
  const [pending, start] = useTransition();

  useEffect(() => {
    if (initialCountry || initialService) return;
    const q = new URLSearchParams(window.location.search);
    const c = q.get('country');
    if (c && options.countries.some((x) => x.slug === c)) setCountry(c);
    const s = q.get('service');
    if (s) setService(s);
  }, [initialCountry, initialService, options.countries]);

  // Services for the chosen country (or every distinct service before a country is chosen).
  const groups = useMemo(
    () =>
      options.groups.map((g) => ({
        label: g.label,
        items: [...new Set(g.services.filter((s) => !country || s.country === country).map((s) => s.name))],
      })),
    [country, options.groups],
  );

  const err = (name: string) =>
    errors[name] ? (
      <span className="field__error" id={`q-${name}-error`} role="alert">
        {errors[name]}
      </span>
    ) : null;
  const aria = (name: string) => (errors[name] ? { 'aria-invalid': true, 'aria-describedby': `q-${name}-error` } : {});

  return (
    <form
      className={`quote-form ${compact ? 'quote-form--compact' : ''}`}
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        const form = e.currentTarget;
        const d = new FormData(form);
        const input = {
          name: String(d.get('name') ?? ''),
          email: String(d.get('email') ?? ''),
          phone: String(d.get('phone') ?? ''),
          company: String(d.get('company') ?? ''),
          country,
          service: String(d.get('service') ?? ''),
          projectType: String(d.get('type') ?? ''),
          location: String(d.get('location') ?? ''),
          budget: String(d.get('budget') ?? ''),
          details: String(d.get('details') ?? ''),
          website: String(d.get('website') ?? ''),
          sourcePage: pathname,
        };
        const check = quoteSchema.safeParse(input);
        if (!check.success) {
          setErrors(fieldErrors(check.error));
          setStatus({ ok: false, message: 'Please check the highlighted fields.' });
          return;
        }
        setErrors({});
        setStatus(null);
        start(async () => {
          const res = await submitQuote(input);
          setErrors(res.errors ?? {});
          setStatus({ ok: res.ok, message: res.message });
          if (res.ok) {
            form.reset();
            if (!initialService) setService('');
          }
        });
      }}
    >
      <p className="eyebrow">{title}</p>
      <div className="hp" aria-hidden="true">
        <label>
          Leave this empty
          <input name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>
      <div className="quote-form__grid">
        <label className="field">
          <span>Full name*</span>
          <input name="name" required autoComplete="name" placeholder="Enter your full name" maxLength={120} {...aria('name')} />
          {err('name')}
        </label>
        <label className="field">
          <span>Email address*</span>
          <input name="email" type="email" required autoComplete="email" placeholder="Enter your email" maxLength={254} {...aria('email')} />
          {err('email')}
        </label>
        <label className="field">
          <span>Phone number*</span>
          <input name="phone" type="tel" required autoComplete="tel" placeholder="Enter your phone number" maxLength={40} {...aria('phone')} />
          {err('phone')}
        </label>
        <label className="field">
          <span>Company name*</span>
          <input name="company" required autoComplete="organization" placeholder="Enter your company name" maxLength={160} {...aria('company')} />
          {err('company')}
        </label>
      </div>
      <fieldset className="field" {...aria('country')}>
        <legend>Country*</legend>
        <div className="pills">
          {options.countries.map((c) => (
            <label className="pill pill--radio" key={c.slug}>
              <input type="radio" name="country" value={c.slug} required checked={country === c.slug} onChange={() => setCountry(c.slug)} />
              <Flag country={c.slug} size={18} />
              <span>{c.name}</span>
            </label>
          ))}
        </div>
        {err('country')}
      </fieldset>
      <div className="quote-form__grid">
        <label className="field field--select">
          <span>Service required*</span>
          <select name="service" required value={service} onChange={(e) => setService(e.target.value)} {...aria('service')}>
            <option value="">Select a service</option>
            {groups.map((g) =>
              g.items.length ? (
                <optgroup key={g.label} label={g.label}>
                  {g.items.map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </optgroup>
              ) : null,
            )}
            {service && !groups.some((g) => g.items.includes(service)) && <option value={service}>{service}</option>}
          </select>
          {err('service')}
        </label>
        <label className="field field--select">
          <span>Project type</span>
          <select name="type" defaultValue="">
            <option value="">Select a project type</option>
            {projectTypes.map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
        </label>
        {!compact && (
          <>
            <label className="field">
              <span>Location</span>
              <input name="location" placeholder="City or address" maxLength={200} />
            </label>
            <label className="field">
              <span>Project budget</span>
              <input name="budget" placeholder="Approximate budget, if known" maxLength={120} />
            </label>
          </>
        )}
      </div>
      <label className="field">
        <span>Project description</span>
        <textarea name="details" rows={compact ? 3 : 4} maxLength={4000} placeholder="Briefly describe your business and what you need." {...aria('details')} />
        {err('details')}
      </label>
      <div className="quote-form__foot">
        <button type="submit" className="btn btn--white btn--send" disabled={pending}>
          <ArrowIcon /> <span>{pending ? 'Sending…' : 'Send request'}</span>
        </button>
        <p className="quote-form__note">
          By sending this request you agree to our <a href="/privacy-policy">Privacy Policy</a>.
        </p>
      </div>
      <p className={`contact-form__status ${status ? (status.ok ? 'is-ok' : 'is-error') : ''}`} aria-live="polite">
        {status?.message}
      </p>
    </form>
  );
}
