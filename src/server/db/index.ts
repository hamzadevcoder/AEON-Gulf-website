import 'server-only';
import { Pool } from 'pg';
import { drizzle, type NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from './schema';

/**
 * One connection pool per server process (reused across hot reloads in development).
 * Without DATABASE_URL the app still runs: the website falls back to its built-in content
 * and the admin dashboard reports that the database is not configured.
 */
const globalForDb = globalThis as unknown as { __aeonPool?: Pool };

export const hasDatabase = Boolean(process.env.DATABASE_URL);

function createPool() {
  return new Pool({
    connectionString: process.env.DATABASE_URL,
    max: Number(process.env.DATABASE_POOL_SIZE ?? 10),
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 5_000,
    ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: process.env.DATABASE_SSL_REJECT_UNAUTHORIZED !== 'false' } : undefined,
  });
}

const pool = hasDatabase ? (globalForDb.__aeonPool ??= createPool()) : undefined;

export const db: NodePgDatabase<typeof schema> | null = pool ? drizzle(pool, { schema }) : null;

/** Use in code paths that cannot work without a database (admin, forms). */
export function requireDb() {
  if (!db) throw new Error('DATABASE_URL is not configured');
  return db;
}

export { schema };
