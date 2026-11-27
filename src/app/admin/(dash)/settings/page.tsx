import { asc, desc, eq } from 'drizzle-orm';
import { requirePermission } from '@/server/auth';
import { requireDb, schema } from '@/server/db';
import { emailConfigured } from '@/server/email';
import { fmtDate } from '@/lib/format';
import { typeLabels, formKinds } from '@/lib/submissions';
import { ActionForm, Checkbox, ConfirmForm, TextField } from '@/components/admin/Form';
import { addRecipient, deleteRecipient, saveEmailSettings, testEmail, updateRecipient } from '../../_actions/settings';

export const metadata = { title: 'Settings & emails' };
export const dynamic = 'force-dynamic';

export default async function SettingsPage() {
  const me = await requirePermission('settings.manage', 'page');
  const db = requireDb();
  const [recipients, [emailRow], log] = await Promise.all([
    db.select().from(schema.notificationRecipients).orderBy(asc(schema.notificationRecipients.createdAt)),
    db.select().from(schema.settings).where(eq(schema.settings.key, 'email')),
    db.select().from(schema.emailLog).orderBy(desc(schema.emailLog.createdAt)).limit(15),
  ]);
  const sender = (emailRow?.value as { fromName?: string; fromAddress?: string }) ?? {};

  return (
    <>
      <div className="adm-head">
        <div>
          <h1>Settings & emails</h1>
          <p>Who receives inquiry notifications, the sender details, and the contact details shown on the website.</p>
        </div>
      </div>

      <section className="adm-card">
        <h2>Inquiry notification recipients</h2>
        <p className="adm-card__hint">Each address receives an email for the forms ticked. Untick “Active” to pause without deleting.</p>
        {!emailConfigured() && (
          <p className="adm-notice adm-notice--warn" style={{ marginBottom: 14 }}>
            Email sending is not configured on the server yet (SMTP_HOST, SMTP_USER, SMTP_PASS). Inquiries are still saved here.
          </p>
        )}
        <div className="adm-grid" style={{ gap: 10 }}>
          {recipients.map((r) => (
            <div key={r.id} className="adm-list__item" style={{ padding: 14 }}>
              <ActionForm action={updateRecipient} submitLabel="Save">
                <input type="hidden" name="id" value={r.id} />
                <div>
                  <strong>{r.email}</strong>
                  {r.name && <span className="adm-muted">{` · ${r.name}`}</span>}
                </div>
                <div className="adm-checks">
                  {formKinds.map((k) => (
                    <Checkbox key={k} name="formTypes" value={k} label={typeLabels[k]} defaultChecked={r.formTypes.includes(k)} />
                  ))}
                  <Checkbox name="active" label="Active" defaultChecked={r.active} />
                </div>
              </ActionForm>
              <ConfirmForm action={deleteRecipient} confirm={`Stop sending notifications to ${r.email}?`} hidden={{ id: r.id }}>
                <button className="adm-btn adm-btn--danger adm-btn--sm" type="submit" style={{ marginTop: 8 }}>
                  Remove
                </button>
              </ConfirmForm>
            </div>
          ))}
          {!recipients.length && <p className="adm-notice adm-notice--warn">No recipients yet: nobody is emailed about new inquiries.</p>}
        </div>
        <h3 className="adm-section-title" style={{ marginTop: 18 }}>
          Add a recipient
        </h3>
        <ActionForm action={addRecipient} submitLabel="Add recipient" resetOnSuccess>
          <div className="adm-row">
            <TextField name="email" label="Email address" type="email" required />
            <TextField name="name" label="Name (optional)" />
          </div>
          <fieldset className="adm-field">
            <legend>Notify about</legend>
            <div className="adm-checks">
              {formKinds.map((k) => (
                <Checkbox key={k} name="formTypes" value={k} label={typeLabels[k]} defaultChecked={k !== 'newsletter'} />
              ))}
            </div>
          </fieldset>
        </ActionForm>
      </section>

      <div className="adm-grid adm-grid--2" style={{ marginTop: 16 }}>
        <section className="adm-card">
          <h2>Sender details</h2>
          <p className="adm-card__hint">How notification emails appear in the inbox. Replies go to the person who filled in the form.</p>
          <ActionForm action={saveEmailSettings}>
            <TextField name="fromName" label="Sender name" defaultValue={sender.fromName ?? 'AEON Gulf website'} required />
            <TextField name="fromAddress" label="Sender address" type="email" defaultValue={sender.fromAddress ?? ''} help="Must be allowed by your email provider. Leave empty to use the server default." />
          </ActionForm>
        </section>
        <section className="adm-card">
          <h2>Send a test email</h2>
          <p className="adm-card__hint">Checks that the server can send email.</p>
          <ActionForm action={testEmail} submitLabel="Send test">
            <TextField name="to" label="Send to" type="email" defaultValue={me.email} required />
          </ActionForm>
        </section>
      </div>

      <section className="adm-card" style={{ marginTop: 16 }}>
        <h2>Website contact details</h2>
        <p className="adm-card__hint">
          The public email and phone number now live with the header and footer: <a className="adm-link" href="/admin/site?open=contact">Header &amp; Footer, Contact details</a>.
        </p>
      </section>

      <section className="adm-card">
        <h2>Recent emails</h2>
        {log.length ? (
          <div className="adm-table-wrap" style={{ marginTop: 10 }}>
            <table className="adm-table adm-table--stack">
              <thead>
                <tr>
                  <th>To</th>
                  <th>Subject</th>
                  <th>Result</th>
                  <th>When</th>
                </tr>
              </thead>
              <tbody>
                {log.map((l) => (
                  <tr key={l.id}>
                    <td>{l.to}</td>
                    <td data-label="Subject">{l.subject}</td>
                    <td data-label="Result">
                      <span className={`adm-badge adm-badge--${l.status}`}>{l.status}</span>
                      {l.error && <span className="adm-muted" style={{ display: 'block' }}>{l.error}</span>}
                    </td>
                    <td className="adm-muted" data-label="When">
                      {fmtDate(l.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="adm-empty">No emails sent yet.</p>
        )}
      </section>
    </>
  );
}
