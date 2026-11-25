import { z } from 'zod';

/** Validation shared by the browser (instant feedback) and the server (the real check). */
const name = z.string().trim().min(2, 'Please enter your name.').max(120, 'Name is too long.');
const email = z.string().trim().toLowerCase().max(254).email('Please enter a valid email address.');
const phone = z
  .string()
  .trim()
  .max(40)
  .regex(/^[+()\d\s.-]{6,}$/, 'Please enter a valid phone number.');
const optional = (max: number) => z.string().trim().max(max, `Please keep this under ${max} characters.`).optional().default('');

export const contactSchema = z.object({
  name,
  email,
  phone: z.union([phone, z.literal('')]).optional().default(''),
  countries: z.array(z.string().max(40)).max(6).optional().default([]),
  services: z.array(z.string().max(60)).max(10).optional().default([]),
  message: optional(4000),
  website: z.string().max(0).optional().default(''), // honeypot: must stay empty
  sourcePage: optional(300),
});

export const quoteSchema = z.object({
  name,
  email,
  phone,
  company: z.string().trim().min(2, 'Please enter your company name.').max(160),
  country: z.enum(['kuwait', 'qatar', 'saudi-arabia'], { message: 'Please choose a country.' }),
  service: z.string().trim().min(2, 'Please choose a service.').max(200),
  projectType: optional(120),
  location: optional(200),
  budget: optional(120),
  details: optional(4000),
  website: z.string().max(0).optional().default(''),
  sourcePage: optional(300),
});

export const newsletterSchema = z.object({
  email,
  website: z.string().max(0).optional().default(''),
  sourcePage: optional(300),
});

export type ContactInput = z.input<typeof contactSchema>;
export type QuoteInput = z.input<typeof quoteSchema>;
export type FormResult = { ok: boolean; message: string; errors?: Record<string, string> };

/** Turn a Zod error into { field: firstMessage }. */
export function fieldErrors(error: z.ZodError) {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? 'form');
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}
