// GET /api/report?week=YYYY-MM-DD → get stored report (or latest)

import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET(req: NextRequest) {
  const week = req.nextUrl.searchParams.get('week');

  try {
    const sql  = getDb();
    const rows = week
      ? await sql`
          SELECT week_date, fund_summaries, verdict, reason, created_at, status
          FROM reports WHERE week_date = ${week} LIMIT 1
        `
      : await sql`
          SELECT week_date, fund_summaries, verdict, reason, created_at, status
          FROM reports ORDER BY week_date DESC LIMIT 1
        `;

    if (rows.length === 0) {
      return NextResponse.json({ error: 'No report found' }, { status: 404 });
    }
    return NextResponse.json(rows[0]);
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
