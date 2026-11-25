'use server';

import { after } from 'next/server';
import { and, eq, gte, sql } from 'drizzle-orm';
import { db, schema } from '@/server/db';
import { clientIp, hashIp, userAgent } from '@/server/request';
import { notifySubmission } from '@/server/email';
import { contactSchema, quoteSchema, newsletterSchema, fieldErrors, type FormResult } from '@/lib/forms-schema';
import type { FormType } from '@/server/db/schema';

const LIMIT = 5; // submissions per form type, per IP
const WINDOW_MIN = 10;
const countryNames: Record<string, string> = { kuwait: 'Kuwait', qatar: 'Qatar', 'saudi-arabia': 'Saudi Arabia' };

async function guard(type: FormType, honeypot: string | undefined): Promise<{ ipHash: string } | FormResult> {
  if (!db) return { ok: false, message: 'Our form is temporarily unavailable. Please email info@aeongulf.com.' };
  const ipHash = hashIp(await clientIp());
  if (honeypot) return { ok: true, message: 'Thank you.' }; // bots: pretend success, store nothing
  const since = new Date(Date.now() - WINDOW_MIN * 60_000);
  const [{ n }] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(schema.submissions)
    .where(and(eq(schema.submissions.type, type), eq(schema.submissions.ip, ipHash), gte(schema.submissions.createdAt, since)));
  if (n >= LIMIT) return { ok: false, message: 'You have sent several requests in a short time. Please try again in a few minutes.' };
  return { ipHash };
}

async function save(values: typeof schema.submissions.$inferInsert) {
  const [row] = await db!.insert(schema.submissions).values(values).returning();
  after(() => notifySubmission(row)); // email after the response has been sent
  return row;
}

export async function submitContact(input: unknown): Promise<FormResult> {
  const parsed = contactSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: 'Please check the highlighted fields.', errors: fieldErrors(parsed.error) };
  const d = parsed.data;
  const g = await guard('contact', d.website);
  if ('ok' in g) return g;
  try {
    await save({
      type: 'contact', name: d.name, email: d.email, phone: d.phone || null, country: d.countries.join(', ') || null,
      service: d.services.join(', ') || null, message: d.message || null, sourcePage: d.sourcePage || null,
      data: { name: d.name, email: d.email, phone: d.phone, countries: d.countries.join(', '), services: d.services.join(', '), message: d.message, sourcePage: d.sourcePage },
      ip: g.ipHash, userAgent: await userAgent(),
    });
    return { ok: true, message: 'Thank you. Your message has been sent and our team will reply within one business day.' };
  } catch (e) {
    console.error('[forms] contact', e);
    return { ok: false, message: 'Something went wrong sending your message. Please try again or email info@aeongulf.com.' };
  }
}

export async function submitQuote(input: unknown): Promise<FormResult> {
  const parsed = quoteSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: 'Please check the highlighted fields.', errors: fieldErrors(parsed.error) };
  const d = parsed.data;
  const g = await guard('quote', d.website);
  if ('ok' in g) return g;
  try {
    const country = countryNames[d.country];
    await save({
      type: 'quote', name: d.name, email: d.email, phone: d.phone, company: d.company, country, service: d.service,
      message: d.details || null, sourcePage: d.sourcePage || null,
      data: { name: d.name, email: d.email, phone: d.phone, company: d.company, country, service: d.service, projectType: d.projectType, location: d.location, budget: d.budget, details: d.details, sourcePage: d.sourcePage },
      ip: g.ipHash, userAgent: await userAgent(),
    });
    return { ok: true, message: 'Thank you. Your quote request has been received and our team will be in touch shortly.' };
  } catch (e) {
    console.error('[forms] quote', e);
    return { ok: false, message: 'Something went wrong sending your request. Please try again or email info@aeongulf.com.' };
  }
}

export async function subscribeNewsletter(input: unknown): Promise<FormResult> {
  const parsed = newsletterSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: 'Please enter a valid email address.', errors: fieldErrors(parsed.error) };
  const d = parsed.data;
  const g = await guard('newsletter', d.website);
  if ('ok' in g) return g;
  try {
    const [existing] = await db!
      .select({ id: schema.submissions.id })
      .from(schema.submissions)
      .where(and(eq(schema.submissions.type, 'newsletter'), sql`lower(${schema.submissions.email}) = ${d.email}`))
      .limit(1);
    if (!existing) {
      await save({ type: 'newsletter', email: d.email, sourcePage: d.sourcePage || null, data: { email: d.email, sourcePage: d.sourcePage }, ip: g.ipHash, userAgent: await userAgent() });
    }
    return { ok: true, message: 'Thank you for subscribing.' };
  } catch (e) {
    console.error('[forms] newsletter', e);
    return { ok: false, message: 'Something went wrong. Please try again.' };
  }
}
