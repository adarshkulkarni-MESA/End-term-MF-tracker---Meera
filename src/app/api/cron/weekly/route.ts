import { NextRequest, NextResponse } from 'next/server';
import { runWeeklyReport }           from '@/lib/weekly-report';

export const maxDuration = 300;

export async function GET(req: NextRequest) {
  const secret = req.headers.get('authorization');
  if (process.env.CRON_SECRET && secret !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const result = await runWeeklyReport();
  return NextResponse.json(result, { status: result.status === 'failed' ? 500 : 200 });
}
