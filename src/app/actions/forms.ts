'use server';

import { after } from 'next/server';
import { and, eq, gte, sql } from 'drizzle-orm';
import { db, schema } from '@/server/db';
import { clientIp, hashIp, userAgent } from '@/server/request';
import { notifySubmission } from '@/server/email';
import { contactSchema, quoteSchema, newsletterSchema, fieldErrors, type FormResult } from '@/lib/forms-schema';
import type { FormType } from '@/server/db/schema';
import { getMessages } from '@/server/content';
import { translate } from '@/i18n/dict';

const msg = async (locale: unknown, key: string) => translate(await getMessages(locale === 'ar' ? 'ar' : 'en'), key);
const lang = (input: unknown) => (input && typeof input === 'object' && (input as { locale?: string }).locale === 'ar' ? 'ar' : 'en');

const LIMIT = 5; // submissions per form type, per IP
const WINDOW_MIN = 10;
const countryNames: Record<string, string> = { kuwait: 'Kuwait', qatar: 'Qatar', 'saudi-arabia': 'Saudi Arabia' };

async function guard(type: FormType, honeypot: string | undefined, locale: string): Promise<{ ipHash: string; spam: boolean } | FormResult> {
  if (!db) return { ok: false, message: await msg(locale, 'msg.unavailable') };
  const ipHash = hashIp(await clientIp());
  // A filled trap field usually means a bot, but a browser can autofill it. Keep the inquiry (marked as spam, no email) so nothing real is ever lost.
  const spam = Boolean(honeypot);
  const since = new Date(Date.now() - WINDOW_MIN * 60_000);
  const [{ n }] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(schema.submissions)
    .where(and(eq(schema.submissions.type, type), eq(schema.submissions.ip, ipHash), gte(schema.submissions.createdAt, since)));
  if (n >= LIMIT) return { ok: false, message: await msg(locale, 'msg.rate') };
  return { ipHash, spam };
}

async function save(values: typeof schema.submissions.$inferInsert) {
  const [row] = await db!.insert(schema.submissions).values(values).returning();
  if (row.status !== 'spam') after(() => notifySubmission(row)); // email after the response has been sent
  return row;
}

export async function submitContact(input: unknown): Promise<FormResult> {
  const parsed = contactSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: await msg(lang(input), 'form.check'), errors: fieldErrors(parsed.error) };
  const d = parsed.data;
  const g = await guard('contact', d.website, d.locale);
  if ('ok' in g) return g;
  try {
    await save({
      type: 'contact', name: d.name, email: d.email, phone: d.phone || null, country: d.countries.join(', ') || null,
      service: d.services.join(', ') || null, message: d.message || null, sourcePage: d.sourcePage || null,
      data: { name: d.name, email: d.email, phone: d.phone, countries: d.countries.join(', '), services: d.services.join(', '), message: d.message, sourcePage: d.sourcePage, language: d.locale === 'ar' ? 'Arabic' : 'English' },
      status: g.spam ? 'spam' : 'new', ip: g.ipHash, userAgent: await userAgent(),
    });
    return { ok: true, message: await msg(d.locale, 'msg.contactOk') };
  } catch (e) {
    console.error('[forms] contact', e);
    return { ok: false, message: await msg(d.locale, 'msg.contactFail') };
  }
}

export async function submitQuote(input: unknown): Promise<FormResult> {
  const parsed = quoteSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: await msg(lang(input), 'form.check'), errors: fieldErrors(parsed.error) };
  const d = parsed.data;
  const g = await guard('quote', d.website, d.locale);
  if ('ok' in g) return g;
  try {
    const country = countryNames[d.country];
    await save({
      type: 'quote', name: d.name, email: d.email, phone: d.phone, company: d.company, country, service: d.service,
      message: d.details || null, sourcePage: d.sourcePage || null,
      data: { name: d.name, email: d.email, phone: d.phone, company: d.company, country, service: d.service, projectType: d.projectType, location: d.location, budget: d.budget, details: d.details, sourcePage: d.sourcePage, language: d.locale === 'ar' ? 'Arabic' : 'English' },
      status: g.spam ? 'spam' : 'new', ip: g.ipHash, userAgent: await userAgent(),
    });
    return { ok: true, message: await msg(d.locale, 'msg.quoteOk') };
  } catch (e) {
    console.error('[forms] quote', e);
    return { ok: false, message: await msg(d.locale, 'msg.quoteFail') };
  }
}

export async function subscribeNewsletter(input: unknown): Promise<FormResult> {
  const parsed = newsletterSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: await msg(lang(input), 'err.email'), errors: fieldErrors(parsed.error) };
  const d = parsed.data;
  const g = await guard('newsletter', d.website, d.locale);
  if ('ok' in g) return g;
  try {
    const [existing] = await db!
      .select({ id: schema.submissions.id })
      .from(schema.submissions)
      .where(and(eq(schema.submissions.type, 'newsletter'), sql`lower(${schema.submissions.email}) = ${d.email}`))
      .limit(1);
    if (!existing) {
      await save({ type: 'newsletter', email: d.email, sourcePage: d.sourcePage || null, data: { email: d.email, sourcePage: d.sourcePage }, status: g.spam ? 'spam' : 'new', ip: g.ipHash, userAgent: await userAgent() });
    }
    return { ok: true, message: await msg(d.locale, 'msg.newsOk') };
  } catch (e) {
    console.error('[forms] newsletter', e);
    return { ok: false, message: await msg(d.locale, 'msg.fail') };
  }
}
