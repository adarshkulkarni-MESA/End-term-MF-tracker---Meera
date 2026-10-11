import { NextRequest, NextResponse } from 'next/server';
import { runWeeklyReport }           from '@/lib/weekly-report';

export const maxDuration = 300;

export async function POST(req: NextRequest) {
  const passphrase = process.env.ADMIN_PASSPHRASE;
  if (passphrase && req.headers.get('x-admin-passphrase') !== passphrase) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  const body = await req.json().catch(() => ({})) as { weekDate?: string };
  const result = await runWeeklyReport(body.weekDate);
  const httpStatus = result.status === 'failed' ? 500 : result.errors.length > 0 ? 207 : 200;
  return NextResponse.json(result, { status: httpStatus });
}
