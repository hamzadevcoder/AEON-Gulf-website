import { asc } from 'drizzle-orm';
import { requirePermission } from '@/server/auth';
import { requireDb, schema } from '@/server/db';
import { roles, roleLabels, permissions, type Role } from '@/lib/permissions';
import { fmtDate } from '@/lib/format';
import { ActionForm, Checkbox, ConfirmActionForm, SelectField, TextField } from '@/components/admin/Form';
import { createUser, deleteUser, resetUserPassword, updateUser } from '../../_actions/users';

export const metadata = { title: 'Users & roles' };
export const dynamic = 'force-dynamic';

const roleSummary: Record<Role, string> = {
  admin: 'Everything, including users, settings and the audit log.',
  editor: 'Website content: services, page text, countries, guides, legal pages and images.',
  agent: 'Inquiries: view, update status, assign and add notes.',
  viewer: 'Read-only access to inquiries.',
};

export default async function UsersPage() {
  const me = await requirePermission('users.manage', 'page');
  const users = await requireDb().select().from(schema.users).orderBy(asc(schema.users.name));
  const roleOptions = roles.map((r) => ({ value: r, label: roleLabels[r] }));
  return (
    <>
      <div className="adm-head">
        <div>
          <h1>Users & roles</h1>
          <p>Who can sign in to the dashboard and what each person can do.</p>
        </div>
      </div>
      <div className="adm-grid" style={{ gap: 12 }}>
        {users.map((u) => (
          <section className="adm-card" key={u.id} style={{ marginTop: 0 }}>
            <div className="adm-head" style={{ marginBottom: 12 }}>
              <div>
                <h2>
                  {u.name} {u.id === me.id && <span className="adm-badge">You</span>} {!u.active && <span className="adm-badge adm-badge--off">Deactivated</span>}
                </h2>
                <p className="adm-muted">{`${u.email} · last sign-in ${u.lastLoginAt ? fmtDate(u.lastLoginAt) : 'never'}`}</p>
              </div>
            </div>
            <div className="adm-grid adm-grid--2">
              <ActionForm action={updateUser} submitLabel="Save access">
                <input type="hidden" name="id" value={u.id} />
                <SelectField name="role" label="Role" defaultValue={u.role} options={roleOptions} />
                <Checkbox name="active" label="Can sign in (active)" defaultChecked={u.active} />
              </ActionForm>
              <ActionForm action={resetUserPassword} submitLabel="Set new password" resetOnSuccess>
                <input type="hidden" name="id" value={u.id} />
                <TextField name="password" label="New password" type="password" autoComplete="new-password" help="At least 12 characters. Signs the user out everywhere." />
              </ActionForm>
            </div>
            {u.id !== me.id && (
              <div style={{ marginTop: 12 }}>
                <ConfirmActionForm action={deleteUser} confirm={`Delete ${u.name}'s account permanently?`} label="Delete user" hidden={{ id: u.id }} />
              </div>
            )}
          </section>
        ))}
      </div>

      <section className="adm-card" style={{ marginTop: 16 }}>
        <h2>Add a user</h2>
        <p className="adm-card__hint">Share the password with them securely; they can change it under My account.</p>
        <ActionForm action={createUser} submitLabel="Create user" resetOnSuccess>
          <div className="adm-row">
            <TextField name="name" label="Name" required />
            <TextField name="email" label="Email" type="email" required autoComplete="off" />
          </div>
          <div className="adm-row">
            <SelectField name="role" label="Role" defaultValue="editor" options={roleOptions} />
            <TextField name="password" label="Password" type="password" required autoComplete="new-password" help="At least 12 characters." />
          </div>
        </ActionForm>
      </section>

      <section className="adm-card">
        <h2>What each role can do</h2>
        <div className="adm-table-wrap" style={{ marginTop: 10 }}>
          <table className="adm-table">
            <thead>
              <tr>
                <th>Permission</th>
                {roles.map((r) => (
                  <th key={r}>{roleLabels[r]}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Object.entries(permissions).map(([p, allowed]) => (
                <tr key={p}>
                  <td>{p}</td>
                  {roles.map((r) => (
                    <td key={r}>{(allowed as readonly string[]).includes(r) ? '✓' : ''}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <ul className="adm-muted" style={{ marginTop: 12 }}>
          {roles.map((r) => (
            <li key={r}>{`${roleLabels[r]}: ${roleSummary[r]}`}</li>
          ))}
        </ul>
      </section>
    </>
  );
}
