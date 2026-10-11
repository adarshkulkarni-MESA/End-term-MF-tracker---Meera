import { NextRequest, NextResponse } from 'next/server';
import { computePerformance }         from '@/lib/performance';

export const maxDuration = 60;

export async function GET(req: NextRequest) {
  const date = req.nextUrl.searchParams.get('date') ?? undefined;
  try {
    const data = await computePerformance(date);
    return NextResponse.json({ data, asOf: date ?? 'today', updatedAt: new Date().toISOString() });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
