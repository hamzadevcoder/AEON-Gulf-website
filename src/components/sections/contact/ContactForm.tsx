'use client';

import { useEffect, useState, useTransition } from 'react';
import { usePathname } from 'next/navigation';
import { ArrowIcon } from '@/components/ui/Button';
import { submitContact } from '@/app/actions/forms';
import { contactSchema, fieldErrors } from '@/lib/forms-schema';

const countryOptions = ['Kuwait', 'Qatar', 'Saudi Arabia', 'Not sure yet'];
const serviceOptions = ['Company formation', 'PRO / GRO services', 'Annual compliance', 'Accounting and payroll', 'Relocation', 'Other'];

/** Contact form: validated in the browser and on the server, saved to the database, emailed to the team. */
export function ContactForm() {
  const pathname = usePathname();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<{ ok: boolean; message: string } | null>(null);
  const [pending, start] = useTransition();
  const [pre, setPre] = useState<{ country?: string; service?: string } | null>(null);
  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    const names: Record<string, string> = { kuwait: 'Kuwait', qatar: 'Qatar', 'saudi-arabia': 'Saudi Arabia' };
    const country = names[q.get('country') ?? ''];
    const service = q.get('service') ?? undefined;
    if (country || service) setPre({ country, service });
  }, []);

  const err = (name: string) =>
    errors[name] ? (
      <span className="field__error" id={`${name}-error`} role="alert">
        {errors[name]}
      </span>
    ) : null;
  const aria = (name: string) => (errors[name] ? { 'aria-invalid': true, 'aria-describedby': `${name}-error` } : {});

  return (
    <form
      key={pre ? 'prefilled' : 'blank'}
      className="contact-form"
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        const form = e.currentTarget;
        const d = new FormData(form);
        const input = {
          name: String(d.get('name') ?? ''),
          email: String(d.get('email') ?? ''),
          phone: String(d.get('phone') ?? ''),
          countries: d.getAll('country').map(String),
          services: d.getAll('service').map(String),
          message: String(d.get('details') ?? ''),
          website: String(d.get('website') ?? ''),
          sourcePage: pathname,
        };
        const check = contactSchema.safeParse(input);
        if (!check.success) {
          setErrors(fieldErrors(check.error));
          setStatus({ ok: false, message: 'Please check the highlighted fields.' });
          return;
        }
        setErrors({});
        setStatus(null);
        start(async () => {
          const res = await submitContact(input);
          setErrors(res.errors ?? {});
          setStatus({ ok: res.ok, message: res.message });
          if (res.ok) form.reset();
        });
      }}
    >
      <p className="eyebrow">Send us a message</p>
      <div className="hp" aria-hidden="true">
        <label>
          Leave this empty
          <input name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>
      <label className="field">
        <span>Name*</span>
        <input name="name" required autoComplete="name" placeholder="Your name" maxLength={120} {...aria('name')} />
        {err('name')}
      </label>
      <label className="field">
        <span>Email*</span>
        <input name="email" type="email" required autoComplete="email" placeholder="yourname@company.com" maxLength={254} {...aria('email')} />
        {err('email')}
      </label>
      <label className="field">
        <span>Phone</span>
        <input name="phone" type="tel" autoComplete="tel" placeholder="+965 0000 0000" maxLength={40} {...aria('phone')} />
        {err('phone')}
      </label>
      <fieldset className="field">
        <legend>Country</legend>
        <div className="pills">
          {countryOptions.map((o) => (
            <label className="pill" key={o}>
              <input type="checkbox" name="country" value={o} defaultChecked={pre?.country === o} />
              <span>{o}</span>
            </label>
          ))}
        </div>
      </fieldset>
      <fieldset className="field">
        <legend>What do you need help with?</legend>
        <div className="pills">
          {serviceOptions.map((o) => (
            <label className="pill" key={o}>
              <input type="checkbox" name="service" value={o} />
              <span>{o}</span>
            </label>
          ))}
        </div>
      </fieldset>
      <label className="field">
        <span>Details</span>
        <textarea
          name="details"
          rows={4}
          maxLength={4000}
          defaultValue={pre?.service ? `I am interested in: ${pre.service}. ` : undefined}
          placeholder="Briefly describe your business and what you would like to set up or change."
          {...aria('message')}
        />
        {err('message')}
      </label>
      <button type="submit" className="btn btn--white btn--send" disabled={pending}>
        <ArrowIcon /> <span>{pending ? 'Sending…' : 'Send request'}</span>
      </button>
      <p className={`contact-form__status ${status ? (status.ok ? 'is-ok' : 'is-error') : ''}`} aria-live="polite">
        {status?.message}
      </p>
    </form>
  );
}
