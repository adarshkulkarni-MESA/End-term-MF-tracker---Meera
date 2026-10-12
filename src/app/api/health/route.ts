import { NextResponse } from 'next/server';
import { getDb }        from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  const start = Date.now();
  try {
    const sql = getDb();

    const [[counts], [lastRun]] = await Promise.all([
      sql`
        SELECT
          (SELECT COUNT(*) FROM funds       WHERE is_active = true)::int AS active_funds,
          (SELECT COUNT(*) FROM nav_history)::int                        AS nav_rows,
          (SELECT COUNT(*) FROM index_history)::int                      AS index_rows,
          (SELECT COUNT(*) FROM reports)::int                            AS reports
      `,
      sql`
        SELECT run_date, run_type, status
        FROM   pipeline_runs
        ORDER  BY created_at DESC
        LIMIT  1
      `,
    ]);

    return NextResponse.json({
      ok:          true,
      db:          'connected',
      latency_ms:  Date.now() - start,
      active_funds: counts.active_funds,
      nav_rows:     counts.nav_rows,
      index_rows:   counts.index_rows,
      reports:      counts.reports,
      last_run:     lastRun ?? null,
    });
  } catch (err) {
    return NextResponse.json(
      { ok: false, db: 'error', error: String(err), latency_ms: Date.now() - start },
      { status: 503 }
    );
  }
}
