import { z } from 'zod';

/** Validation shared by the browser (instant feedback) and the server (the real check). */
const name = z.string().trim().min(2, 'err.name').max(120, 'err.tooLong');
const email = z.string().trim().toLowerCase().max(254, 'err.tooLong').email('err.email');
/** Arabic-Indic (٠١٢٣) and Persian (۰۱۲۳) digits are accepted and converted, so Arabic keyboards work. */
export const normalizeDigits = (s: string) =>
  s
    .replace(/[٠-٩]/g, (d) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d)))
    .replace(/[۰-۹]/g, (d) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d)))
    .replace(/[٫٬،]/g, ' ');
const phone = z
  .string()
  .trim()
  .max(40, 'err.tooLong')
  .transform(normalizeDigits)
  .pipe(z.string().regex(/^[+()\d\s.-]{6,}$/, 'err.phone'));
const optional = (max: number) => z.string().trim().max(max, 'err.tooLong').optional().default('');

const locale = z.enum(['en', 'ar']).optional().default('en');

/** Error messages are dictionary keys (err.*), shown translated by the forms. */
export const contactSchema = z.object({
  locale,
  name,
  email,
  phone: z.union([phone, z.literal('')]).optional().default(''),
  countries: z.array(z.string().max(40)).max(6).optional().default([]),
  services: z.array(z.string().max(60)).max(10).optional().default([]),
  message: optional(4000),
  // Spam trap: never a validation error (a browser may autofill it). The server quietly ignores submissions where it is filled.
  website: z.string().optional().default(''),
  sourcePage: optional(300),
});

export const quoteSchema = z.object({
  locale,
  name,
  email,
  phone,
  company: z.string().trim().min(2, 'err.company').max(160),
  country: z.enum(['kuwait', 'qatar', 'saudi-arabia'], { message: 'err.country' }),
  service: z.string().trim().min(2, 'err.service').max(200),
  projectType: optional(120),
  location: optional(200),
  budget: optional(120),
  details: optional(4000),
  website: z.string().optional().default(''),
  sourcePage: optional(300),
});

export const newsletterSchema = z.object({
  locale,
  email,
  website: z.string().optional().default(''),
  sourcePage: optional(300),
});

export type ContactInput = z.input<typeof contactSchema>;
export type QuoteInput = z.input<typeof quoteSchema>;
export type FormResult = { ok: boolean; message: string; errors?: Record<string, string> };

/** Errors for fields that have no message of their own on the page (so they are still shown, in the form's status line). */
export const unshownErrors = (errors: Record<string, string>, shown: string[]) =>
  Object.entries(errors)
    .filter(([k]) => !shown.includes(k) && k !== 'website')
    .map(([, m]) => m);

/** Move the cursor to the first field with an error. */
export function focusFirstInvalid(form: HTMLFormElement) {
  setTimeout(() => {
    const el = form.querySelector<HTMLElement>('[aria-invalid="true"]');
    (el?.matches('fieldset') ? el.querySelector<HTMLElement>('input') : el)?.focus?.();
  }, 50);
}

/** Turn a Zod error into { field: firstMessage }. */
export function fieldErrors(error: z.ZodError) {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? 'form');
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}
