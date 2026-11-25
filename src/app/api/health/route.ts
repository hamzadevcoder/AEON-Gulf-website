import { sql } from 'drizzle-orm';
import { db } from '@/server/db';

export const dynamic = 'force-dynamic';

/** Load-balancer / uptime check: 200 when the app and database respond. */
export async function GET() {
  if (!db) return Response.json({ status: 'ok', database: 'not configured' });
  try {
    await db.execute(sql`select 1`);
    return Response.json({ status: 'ok', database: 'ok' });
  } catch {
    return Response.json({ status: 'error', database: 'unreachable' }, { status: 503 });
  }
}
