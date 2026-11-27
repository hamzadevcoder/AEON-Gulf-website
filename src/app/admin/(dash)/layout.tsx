import { and, eq, sql } from 'drizzle-orm';
import { requireUser } from '@/server/auth';
import { db, schema } from '@/server/db';
import { can } from '@/lib/permissions';
import { roleLabels } from '@/lib/permissions';
import { Shell, type NavItem } from '@/components/admin/Shell';
import { logout } from '../_actions/auth';

export const dynamic = 'force-dynamic';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  let newCount = 0;
  if (db && can(user.role, 'submissions.view')) {
    const [{ n }] = await db.select({ n: sql<number>`count(*)::int` }).from(schema.submissions).where(and(eq(schema.submissions.status, 'new')));
    newCount = n;
  }
  const all: (NavItem & { show: boolean })[] = [
    { href: '/admin', label: 'Overview', show: true },
    { href: '/admin/submissions', label: 'Inquiries', count: newCount, show: can(user.role, 'submissions.view') },
    { href: '/admin/pages', label: 'Pages', group: 'Content', show: can(user.role, 'content.edit') },
    { href: '/admin/services', label: 'Services', group: 'Content', show: can(user.role, 'content.edit') },
    { href: '/admin/guides', label: 'Guides', group: 'Content', show: can(user.role, 'content.edit') },
    { href: '/admin/media', label: 'Images', group: 'Content', show: can(user.role, 'media.manage') },
    { href: '/admin/site', label: 'Header & Footer', group: 'Site', show: can(user.role, 'content.edit') },
    { href: '/admin/translations', label: 'Interface text', group: 'Site', show: can(user.role, 'content.edit') },
    { href: '/admin/settings', label: 'Settings & emails', group: 'Administration', show: can(user.role, 'settings.manage') },
    { href: '/admin/users', label: 'Users & roles', group: 'Administration', show: can(user.role, 'users.manage') },
    { href: '/admin/audit', label: 'Audit log', group: 'Administration', show: can(user.role, 'audit.view') },
    { href: '/admin/account', label: 'My account', group: 'Account', show: true },
  ];
  return (
    <Shell
      nav={all.filter((n) => n.show).map(({ show: _s, ...n }) => n)}
      side={
        <div className="adm-side__user">
          <strong>{user.name}</strong>
          {roleLabels[user.role]}
          <form action={logout}>
            <button type="submit" className="adm-btn adm-btn--ghost adm-btn--sm">
              Sign out
            </button>
          </form>
          <a className="adm-muted" href="/" target="_blank" rel="noreferrer" style={{ display: 'inline-block', marginTop: 10, color: 'rgba(255,255,255,.6)' }}>
            View website ↗
          </a>
        </div>
      }
    >
      {children}
    </Shell>
  );
}
