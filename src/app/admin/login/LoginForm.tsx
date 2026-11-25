'use client';

import { useActionState } from 'react';
import { login } from '../_actions/auth';
import { SubmitButton } from '@/components/admin/Form';

export function LoginForm({ next }: { next: string }) {
  const [state, action] = useActionState(login, { ok: false, message: '' });
  return (
    <form action={action} className="adm-form">
      <input type="hidden" name="next" value={next} />
      <label className="adm-field">
        <span>Email</span>
        <input name="email" type="email" autoComplete="username" required autoFocus />
      </label>
      <label className="adm-field">
        <span>Password</span>
        <input name="password" type="password" autoComplete="current-password" required />
      </label>
      {state.message && (
        <p className="adm-notice adm-notice--error" role="alert">
          {state.message}
        </p>
      )}
      <SubmitButton label="Sign in" className="adm-btn adm-btn--primary" />
    </form>
  );
}
