import { NextResponse }  from 'next/server';
import { supabase }      from '@/lib/supabase';
import { computePerformance } from '@/lib/performance';

export const maxDuration = 60;

export async function GET() {
  const today = new Date().toISOString().slice(0, 10);

  const [perfResult, reportResult, snapshotsResult, newsResult, lastRunResult] =
    await Promise.allSettled([
      computePerformance(),
      supabase.from('reports').select('week_date, fund_summaries, verdict, reason, created_at').order('week_date', { ascending: false }).limit(1).maybeSingle(),
      supabase.from('weekly_snapshots').select('week_date, data').order('week_date', { ascending: false }).limit(12),
      supabase.from('news_items').select('headline, source, url, published_at, week_date').order('week_date', { ascending: false }).order('published_at', { ascending: false }).limit(20),
      supabase.from('pipeline_runs').select('run_date, run_type, status, created_at').order('created_at', { ascending: false }).limit(1).maybeSingle(),
    ]);

  return NextResponse.json({
    asOf:       today,
    updatedAt:  new Date().toISOString(),
    performance:   perfResult.status === 'fulfilled' ? perfResult.value : [],
    latestReport:  reportResult.status === 'fulfilled' ? reportResult.value?.data : null,
    snapshots:     snapshotsResult.status === 'fulfilled' ? snapshotsResult.value?.data ?? [] : [],
    news:          newsResult.status === 'fulfilled' ? newsResult.value?.data ?? [] : [],
    lastRun:       lastRunResult.status === 'fulfilled' ? lastRunResult.value?.data : null,
  });
}
