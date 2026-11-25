import Link from 'next/link';
import { requirePermission } from '@/server/auth';
import { getPolicies } from '@/server/content';

export const metadata = { title: 'Legal pages' };
export const dynamic = 'force-dynamic';

export default async function LegalAdmin() {
  await requirePermission('content.edit', 'page');
  const policies = await getPolicies();
  return (
    <>
      <div className="adm-head">
        <div>
          <h1>Legal pages</h1>
          <p>Privacy policy, terms and conditions, and cookies policy.</p>
        </div>
      </div>
      <div className="adm-grid adm-grid--3">
        {Object.values(policies).map((p) => (
          <Link key={p.slug} href={`/admin/legal/${p.slug}`} className="adm-card adm-stat">
            <div className="adm-stat__n" style={{ fontSize: 20 }}>
              {p.title}
            </div>
            <div className="adm-stat__l">{`${p.sections.length} sections · effective ${p.effective}`}</div>
          </Link>
        ))}
      </div>
    </>
  );
}
