import { eq } from 'drizzle-orm';
import { requirePermission } from '@/server/auth';
import { requireDb, schema } from '@/server/db';
import { defaultMessages, messageKeys as allKeys } from '@/i18n/dict';

// menu and footer links are edited under Header & Footer
const hidden = new Set(['menu.formation', 'menu.visa', 'menu.compliance', 'lang.switch', 'lang.switchAria']);
const messageKeys = allKeys.filter((k) => !k.startsWith('nav.') && !hidden.has(k));
import { ActionForm } from '@/components/admin/Form';
import { saveUiText } from '../../_actions/i18n';

export const metadata = { title: 'Interface text' };
export const dynamic = 'force-dynamic';

const groupNames: Record<string, string> = {
  nav: 'Menu links', legal: 'Legal links', header: 'Header', lang: 'Language switch', menu: 'Menu panel', footer: 'Footer', common: 'Shared labels and buttons',
  group: 'Service groups', hub: 'Services page', country: 'Country pages', svc: 'Service pages', ins: 'Insights', guide: 'Guides', legalPage: 'Legal pages',
  form: 'Forms', err: 'Form errors', msg: 'Form messages', meta: 'Search engine titles and descriptions',
};

export default async function TranslationsPage() {
  await requirePermission('content.edit', 'page');
  const [row] = await requireDb().select().from(schema.settings).where(eq(schema.settings.key, 'ui_text'));
  const custom = (row?.value as Record<'en' | 'ar', Record<string, string>>) ?? { en: {}, ar: {} };
  const groups = [...new Set(messageKeys.map((k) => k.split('.')[0]))];
  return (
    <>
      <div className="adm-head">
        <div>
          <h1>Interface text</h1>
          <p>
            Buttons, labels, form messages and other small text around the page content, in English and Arabic. Leave a box empty to use the built-in text
            (shown faintly). Changed boxes are highlighted. Menu links, footer links and contact details are under Header & Footer.
          </p>
        </div>
      </div>
      <div className="adm-card">
        <ActionForm action={saveUiText} sticky submitLabel="Save interface text">
          {groups.map((g) => (
            <details key={g} className="adm-sec" style={{ marginBottom: 8 }} open={g === 'common'}>
              <summary style={{ padding: '12px 14px', cursor: 'pointer', fontWeight: 500 }}>
                {groupNames[g] ?? g} <span className="adm-muted">{`(${messageKeys.filter((k) => k.startsWith(g + '.')).length})`}</span>
              </summary>
              <div className="adm-table-wrap" style={{ margin: '0 14px 14px' }}>
                <table className="adm-table adm-uitext">
                  <thead>
                    <tr>
                      <th>Key</th>
                      <th>English</th>
                      <th>العربية</th>
                    </tr>
                  </thead>
                  <tbody>
                    {messageKeys
                      .filter((k) => k.startsWith(g + '.'))
                      .map((k) => (
                        <tr key={k}>
                          <td>{k}</td>
                          <td>
                            <input name={`en:${k}`} defaultValue={custom.en?.[k] ?? ''} placeholder={defaultMessages.en[k]} className={custom.en?.[k] ? 'is-custom' : ''} aria-label={`${k} English`} />
                          </td>
                          <td>
                            <input name={`ar:${k}`} dir="rtl" lang="ar" defaultValue={custom.ar?.[k] ?? ''} placeholder={defaultMessages.ar[k]} className={custom.ar?.[k] ? 'is-custom' : ''} aria-label={`${k} Arabic`} />
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </details>
          ))}
        </ActionForm>
      </div>
    </>
  );
}
