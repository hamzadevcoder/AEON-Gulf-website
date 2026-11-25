/** Role-based access. Shared by the server (enforcement) and the dashboard UI (what to show). */
export const roles = ['admin', 'editor', 'agent', 'viewer'] as const;
export type Role = (typeof roles)[number];

export const roleLabels: Record<Role, string> = {
  admin: 'Administrator',
  editor: 'Content editor',
  agent: 'Inquiries agent',
  viewer: 'Viewer (read-only)',
};

export const permissions = {
  'dashboard.view': ['admin', 'editor', 'agent', 'viewer'],
  'submissions.view': ['admin', 'agent', 'viewer'],
  'submissions.update': ['admin', 'agent'],
  'submissions.delete': ['admin'],
  'submissions.export': ['admin'],
  'content.edit': ['admin', 'editor'],
  'media.manage': ['admin', 'editor'],
  'settings.manage': ['admin'],
  'users.manage': ['admin'],
  'audit.view': ['admin'],
} as const satisfies Record<string, readonly Role[]>;

export type Permission = keyof typeof permissions;

export const can = (role: Role | undefined | null, permission: Permission) => !!role && (permissions[permission] as readonly Role[]).includes(role);
