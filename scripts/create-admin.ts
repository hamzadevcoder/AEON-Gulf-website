/**
 * Creates (or resets) an administrator account.
 *   npm run admin:create -- --email you@company.com --name "Your Name"
 * The password is read from ADMIN_PASSWORD, or asked for interactively.
 */
import { Pool } from 'pg';
import bcrypt from 'bcryptjs';
import { createInterface } from 'node:readline/promises';

const arg = (name: string) => {
  const i = process.argv.indexOf(`--${name}`);
  return i > -1 ? process.argv[i + 1] : undefined;
};

async function main() {
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is not set.');
  const email = (arg('email') ?? process.env.ADMIN_EMAIL ?? '').trim().toLowerCase();
  const name = (arg('name') ?? process.env.ADMIN_NAME ?? 'Administrator').trim();
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) throw new Error('Pass a valid --email.');
  let password = process.env.ADMIN_PASSWORD ?? '';
  if (!password) {
    const rl = createInterface({ input: process.stdin, output: process.stdout });
    password = await rl.question('Password (12+ characters): ');
    rl.close();
  }
  if (password.length < 12) throw new Error('The password must be at least 12 characters.');
  const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: process.env.DATABASE_SSL_REJECT_UNAUTHORIZED !== 'false' } : undefined });
  const hash = await bcrypt.hash(password, 12);
  const res = await pool.query(
    `INSERT INTO users (email, name, password_hash, role, active) VALUES ($1, $2, $3, 'admin', true)
     ON CONFLICT (lower(email)) DO UPDATE SET password_hash = EXCLUDED.password_hash, role = 'admin', active = true, updated_at = now()
     RETURNING (xmax = 0) AS created`,
    [email, name, hash],
  );
  console.log(res.rows[0].created ? `Administrator ${email} created.` : `Administrator ${email} updated (password reset, role admin).`);
  await pool.end();
}

main().catch((e) => {
  console.error(e.message ?? e);
  process.exitCode = 1;
});
