import 'server-only';
import nodemailer, { type Transporter } from 'nodemailer';
import { and, eq, sql } from 'drizzle-orm';
import { requireDb, schema } from './db';
import type { Submission } from './db/schema';
import { SITE_URL } from '@/lib/seo';

/**
 * SMTP credentials are secrets and stay in environment variables (SMTP_HOST, SMTP_PORT, SMTP_USER,
 * SMTP_PASS, SMTP_SECURE). The sender name/address and the recipients are managed in the dashboard.
 */
let transport: Transporter | null | undefined;
function getTransport() {
  if (transport !== undefined) return transport;
  const host = process.env.SMTP_HOST;
  transport = host
    ? nodemailer.createTransport({
        host,
        port: Number(process.env.SMTP_PORT ?? 587),
        secure: process.env.SMTP_SECURE === 'true',
        auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined,
      })
    : null;
  return transport;
}

export const emailConfigured = () => Boolean(process.env.SMTP_HOST);

async function sender() {
  const db = requireDb();
  const [row] = await db.select().from(schema.settings).where(eq(schema.settings.key, 'email'));
  const v = (row?.value ?? {}) as { fromName?: string; fromAddress?: string };
  const address = v.fromAddress || process.env.SMTP_FROM || process.env.SMTP_USER || 'no-reply@aeongulf.com';
  return `"${(v.fromName || 'AEON Gulf website').replace(/"/g, '')}" <${address}>`;
}

const esc = (s: unknown) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

const labels: Record<string, string> = {
  name: 'Name', email: 'Email', phone: 'Phone', company: 'Company', country: 'Country', countries: 'Countries', service: 'Service',
  services: 'Services', projectType: 'Project type', location: 'Location', budget: 'Budget', details: 'Details', message: 'Message', sourcePage: 'Sent from',
};
const typeNames = { contact: 'Contact message', quote: 'Quote request', newsletter: 'Newsletter sign-up' } as const;

function render(sub: Submission) {
  const link = `${SITE_URL}/admin/submissions/${sub.id}`;
  const rows = Object.entries(sub.data).filter(([k, v]) => v && k !== 'website');
  const subject = `New ${typeNames[sub.type].toLowerCase()}${sub.name ? ` from ${sub.name}` : ''}${sub.service ? `: ${sub.service}` : ''}`;
  const text = [`${typeNames[sub.type]} received on the AEON Gulf website.`, '', ...rows.map(([k, v]) => `${labels[k] ?? k}: ${v}`), '', `Open in the dashboard: ${link}`].join('\n');
  const html = `<div style="font-family:Arial,sans-serif;font-size:14px;color:#34353f">
<p style="font-size:16px"><strong>${esc(typeNames[sub.type])}</strong> received on the AEON Gulf website.</p>
<table cellpadding="6" style="border-collapse:collapse">${rows
    .map(([k, v]) => `<tr><td style="color:#53565a;vertical-align:top;white-space:nowrap">${esc(labels[k] ?? k)}</td><td style="white-space:pre-wrap">${esc(v)}</td></tr>`)
    .join('')}</table>
<p><a href="${esc(link)}" style="background:#cb333b;color:#fff;padding:10px 16px;border-radius:5px;text-decoration:none;display:inline-block">Open in the dashboard</a></p></div>`;
  return { subject, text, html };
}

/** Email every active recipient subscribed to this form type. Every attempt is logged; failures never throw. */
export async function notifySubmission(sub: Submission) {
  const db = requireDb();
  try {
    const recipients = await db
      .select()
      .from(schema.notificationRecipients)
      .where(and(eq(schema.notificationRecipients.active, true), sql`${sub.type} = ANY(${schema.notificationRecipients.formTypes})`));
    if (!recipients.length) return;
    const { subject, text, html } = render(sub);
    const t = getTransport();
    const from = await sender();
    for (const r of recipients) {
      let status: 'sent' | 'failed' | 'skipped' = 'skipped';
      let error: string | null = t ? null : 'SMTP is not configured (set SMTP_HOST etc.)';
      if (t) {
        try {
          await t.sendMail({ from, to: r.email, subject, text, html, replyTo: sub.email });
          status = 'sent';
        } catch (e) {
          status = 'failed';
          error = e instanceof Error ? e.message.slice(0, 500) : 'Unknown error';
        }
      }
      await db.insert(schema.emailLog).values({ submissionId: sub.id, to: r.email, subject, status, error });
    }
  } catch (e) {
    console.error('[email] notification failed', e);
  }
}

/** Used by the "Send test email" button in Settings. */
export async function sendTestEmail(to: string) {
  const db = requireDb();
  const t = getTransport();
  const subject = 'AEON Gulf website: test email';
  if (!t) {
    await db.insert(schema.emailLog).values({ to, subject, status: 'skipped', error: 'SMTP is not configured' });
    return { ok: false, message: 'SMTP is not configured on the server (SMTP_HOST, SMTP_USER, SMTP_PASS).' };
  }
  try {
    await t.sendMail({ from: await sender(), to, subject, text: 'Email notifications from the AEON Gulf website are working.' });
    await db.insert(schema.emailLog).values({ to, subject, status: 'sent' });
    return { ok: true, message: `Test email sent to ${to}.` };
  } catch (e) {
    const error = e instanceof Error ? e.message.slice(0, 500) : 'Unknown error';
    await db.insert(schema.emailLog).values({ to, subject, status: 'failed', error });
    return { ok: false, message: `Sending failed: ${error}` };
  }
}
