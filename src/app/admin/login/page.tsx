import { redirect } from 'next/navigation';
import { getSessionUser } from '@/server/auth';
import { hasDatabase } from '@/server/db';
import { LoginForm } from './LoginForm';

export const metadata = { title: 'Sign in' };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  if (await getSessionUser()) redirect('/admin');
  const { next } = await searchParams;
  return (
    <div className="adm-login">
      <div className="adm-login__card">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/brand/aeon-gulf-color.svg" alt="AEON Gulf" />
        <h1>Sign in</h1>
        <p className="adm-muted" style={{ margin: '0 0 20px' }}>
          Website dashboard
        </p>
        {!hasDatabase && <p className="adm-notice adm-notice--warn">The database is not configured on this server (DATABASE_URL).</p>}
        <LoginForm next={next ?? ''} />
      </div>
    </div>
  );
}
