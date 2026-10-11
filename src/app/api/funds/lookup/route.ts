import { NextRequest, NextResponse } from 'next/server';
import { lookupScheme }              from '@/lib/mfapi';

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get('code');
  if (!code) return NextResponse.json({ error: 'code param required' }, { status: 400 });
  const info = await lookupScheme(code);
  if (!info) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(info);
}
