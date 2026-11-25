import Link from 'next/link';
import { requirePermission } from '@/server/auth';
import { GuideForm } from '../GuideForm';
import { guideFormData } from '../data';

export const metadata = { title: 'New guide' };

export default async function NewGuide() {
  await requirePermission('content.edit', 'page');
  return (
    <>
      <div className="adm-head">
        <div>
          <nav className="adm-crumbs">
            <Link href="/admin/guides">Guides</Link> / <span>New</span>
          </nav>
          <h1>New guide</h1>
        </div>
      </div>
      <div className="adm-card">
        <GuideForm {...await guideFormData()} />
      </div>
    </>
  );
}
