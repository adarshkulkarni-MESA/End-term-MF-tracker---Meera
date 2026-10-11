// GET /api/dashboard → all data needed for the dashboard in one call

import { NextResponse }       from 'next/server';
import { getDb }              from '@/lib/db';
import { computePerformance } from '@/lib/performance';

export const maxDuration = 60;

export async function GET() {
  const sql   = getDb();
  const today = new Date().toISOString().slice(0, 10);

  const [perfResult, reportResult, snapshotsResult, newsResult, lastRunResult] =
    await Promise.allSettled([
      computePerformance(),
      sql`
        SELECT week_date, fund_summaries, verdict, reason, created_at
        FROM reports ORDER BY week_date DESC LIMIT 1
      `,
      sql`
        SELECT week_date, data FROM weekly_snapshots
        ORDER BY week_date DESC LIMIT 12
      `,
      sql`
        SELECT headline, source, url, published_at, week_date FROM news_items
        ORDER BY week_date DESC, published_at DESC LIMIT 20
      `,
      sql`
        SELECT run_date, run_type, status, created_at FROM pipeline_runs
        ORDER BY created_at DESC LIMIT 1
      `,
    ]);

  return NextResponse.json({
    asOf:        today,
    updatedAt:   new Date().toISOString(),
    performance:
      perfResult.status === 'fulfilled' ? perfResult.value : [],
    latestReport:
      reportResult.status === 'fulfilled' && reportResult.value.length > 0
        ? reportResult.value[0]
        : null,
    snapshots:
      snapshotsResult.status === 'fulfilled' ? snapshotsResult.value : [],
    news:
      newsResult.status === 'fulfilled' ? newsResult.value : [],
    lastRun:
      lastRunResult.status === 'fulfilled' && lastRunResult.value.length > 0
        ? lastRunResult.value[0]
        : null,
  });
}
