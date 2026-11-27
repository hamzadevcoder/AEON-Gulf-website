'use client';

import { useEffect, useState, useTransition } from 'react';
import { usePathname } from 'next/navigation';
import { ArrowIcon } from '@/components/ui/Button';
import { submitContact } from '@/app/actions/forms';
import { contactSchema, fieldErrors, unshownErrors, focusFirstInvalid } from '@/lib/forms-schema';

const SHOWN = ['name', 'email', 'phone', 'message'];
import { useT, useLocale } from '@/i18n/client';
import { defaultMessages } from '@/i18n/dict';

// values are stored in English (the team reads them in the dashboard); labels follow the visitor's language
const countryOptions = [
  { value: 'Kuwait', ar: 'الكويت' },
  { value: 'Qatar', ar: 'قطر' },
  { value: 'Saudi Arabia', ar: 'المملكة العربية السعودية' },
  { value: 'Not sure yet', key: 'form.notSure' },
];
const serviceOptions = ['form.opt.formation', 'form.opt.pro', 'form.opt.compliance', 'form.opt.accounting', 'form.opt.relocation', 'form.opt.other'];

/** Contact form: validated in the browser and on the server, saved to the database, emailed to the team. */
export function ContactForm() {
  const pathname = usePathname();
  const t = useT();
  const locale = useLocale();
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
        {t(errors[name])}
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
          website: String(d.get('hp_ref') ?? ''),
          sourcePage: pathname,
          locale,
        };
        const check = contactSchema.safeParse(input);
        if (!check.success) {
          const errs = fieldErrors(check.error);
          setErrors(errs);
          setStatus({ ok: false, message: [t('form.check'), ...unshownErrors(errs, SHOWN).map((m) => t(m))].join(' ') });
          focusFirstInvalid(form);
          return;
        }
        setErrors({});
        setStatus(null);
        start(async () => {
          const res = await submitContact(input);
          setErrors(res.errors ?? {});
          setStatus({ ok: res.ok, message: res.ok ? res.message : [res.message, ...unshownErrors(res.errors ?? {}, SHOWN).map((m) => t(m))].join(' ') });
          if (!res.ok) focusFirstInvalid(form);
          if (res.ok) form.reset();
        });
      }}
    >
      <p className="eyebrow">{t('form.sendMessage')}</p>
      <div className="hp" aria-hidden="true">
        <label>
          Leave this empty
          <input name="hp_ref" tabIndex={-1} autoComplete="off" data-lpignore="true" data-1p-ignore="true" data-form-type="other" />
        </label>
      </div>
      <label className="field">
        <span>{t('form.name')}</span>
        <input name="name" required autoComplete="name" placeholder={t('form.namePh')} maxLength={120} {...aria('name')} />
        {err('name')}
      </label>
      <label className="field">
        <span>{t('form.emailShort')}</span>
        <input name="email" type="email" required autoComplete="email" placeholder="yourname@company.com" maxLength={254} {...aria('email')} />
        {err('email')}
      </label>
      <label className="field">
        <span>{t('form.phoneShort')}</span>
        <input name="phone" type="tel" autoComplete="tel" placeholder="+965 0000 0000" maxLength={40} {...aria('phone')} />
        {err('phone')}
      </label>
      <fieldset className="field">
        <legend>{t('form.countryShort')}</legend>
        <div className="pills">
          {countryOptions.map((o) => (
            <label className="pill" key={o.value}>
              <input type="checkbox" name="country" value={o.value} defaultChecked={pre?.country === o.value} />
              <span>{o.key ? t(o.key) : locale === 'ar' ? o.ar : o.value}</span>
            </label>
          ))}
        </div>
      </fieldset>
      <fieldset className="field">
        <legend>{t('form.needHelp')}</legend>
        <div className="pills">
          {serviceOptions.map((k) => (
            <label className="pill" key={k}>
              <input type="checkbox" name="service" value={defaultMessages.en[k]} />
              <span>{t(k)}</span>
            </label>
          ))}
        </div>
      </fieldset>
      <label className="field">
        <span>{t('form.details')}</span>
        <textarea
          name="details"
          rows={4}
          maxLength={4000}
          defaultValue={pre?.service ? t('form.interestedIn', { service: pre.service }) : undefined}
          placeholder={t('form.detailsPh')}
          {...aria('message')}
        />
        {err('message')}
      </label>
      <button type="submit" className="btn btn--white btn--send" disabled={pending}>
        <ArrowIcon /> <span>{pending ? t('form.sending') : t('form.send')}</span>
      </button>
      <p className={`contact-form__status ${status ? (status.ok ? 'is-ok' : 'is-error') : ''}`} aria-live="polite">
        {status?.message}
      </p>
    </form>
  );
}
