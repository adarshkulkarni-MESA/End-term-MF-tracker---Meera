import { NextRequest, NextResponse } from 'next/server';
import { supabase }                  from '@/lib/supabase';

export async function GET(req: NextRequest) {
  const week = req.nextUrl.searchParams.get('week');
  let query = supabase.from('reports').select('week_date, fund_summaries, verdict, reason, created_at, status').order('week_date', { ascending: false });
  if (week) query = query.eq('week_date', week);
  const { data, error } = await query.limit(1).maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data)  return NextResponse.json({ error: 'No report found' }, { status: 404 });
  return NextResponse.json(data);
}
