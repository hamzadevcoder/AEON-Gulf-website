import Link from 'next/link';
import { requirePermission } from '@/server/auth';
import { pageStarters } from '@/content/sections';
import { ActionForm, TextField } from '@/components/admin/Form';
import { createPage } from '../../../_actions/pages';

export const metadata = { title: 'New page' };

export default async function NewPage() {
  await requirePermission('content.edit', 'page');
  return (
    <>
      <div className="adm-head">
        <div>
          <nav className="adm-crumbs">
            <Link href="/admin/pages">Pages</Link> / <span>New page</span>
          </nav>
          <h1>New page</h1>
          <p>Give it a name, pick a starting layout, then add and edit sections. New pages start as drafts.</p>
        </div>
      </div>
      <div className="adm-card" style={{ maxWidth: 820 }}>
        <ActionForm action={createPage} submitLabel="Create page">
          <TextField name="title" label="Page title" required help="For example: Free Zone Setup" />
          <TextField name="slug" label="Page address (optional)" help="Becomes yourwebsite.com/your-address. Leave empty to create it from the title." />
          <fieldset className="adm-field">
            <legend>Starting layout</legend>
            <div className="adm-starters">
              {pageStarters.map((s, i) => (
                <label className="adm-starter" key={s.key}>
                  <input type="radio" name="starter" value={s.key} defaultChecked={i === 1} />
                  <span>
                    <strong>{s.name}</strong>
                    <small>{s.description}</small>
                  </span>
                </label>
              ))}
            </div>
          </fieldset>
        </ActionForm>
      </div>
    </>
  );
}
