import { requireUser } from '@/server/auth';
import { roleLabels } from '@/lib/permissions';
import { ActionForm, TextField } from '@/components/admin/Form';
import { changeOwnPassword, signOutOtherSessions, updateOwnProfile } from '../../_actions/auth';

export const metadata = { title: 'My account' };

export default async function AccountPage() {
  const me = await requireUser();
  return (
    <>
      <div className="adm-head">
        <div>
          <h1>My account</h1>
          <p>{`${me.email} · ${roleLabels[me.role]}`}</p>
        </div>
      </div>
      <div className="adm-grid adm-grid--2">
        <section className="adm-card" style={{ marginTop: 0 }}>
          <h2>Profile</h2>
          <ActionForm action={updateOwnProfile}>
            <TextField name="name" label="Name" defaultValue={me.name} required />
          </ActionForm>
        </section>
        <section className="adm-card" style={{ marginTop: 0 }}>
          <h2>Change password</h2>
          <ActionForm action={changeOwnPassword} submitLabel="Change password" resetOnSuccess>
            <TextField name="current" label="Current password" type="password" autoComplete="current-password" required />
            <TextField name="password" label="New password" type="password" autoComplete="new-password" required help="At least 12 characters." />
            <TextField name="confirm" label="Repeat new password" type="password" autoComplete="new-password" required />
          </ActionForm>
        </section>
      </div>
      <section className="adm-card">
        <h2>Other devices</h2>
        <p className="adm-card__hint">Sign out of the dashboard everywhere except this browser.</p>
        <form action={signOutOtherSessions}>
          <button className="adm-btn adm-btn--ghost" type="submit">
            Sign out other sessions
          </button>
        </form>
      </section>
    </>
  );
}
