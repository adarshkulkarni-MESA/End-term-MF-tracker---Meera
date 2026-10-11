import { NextRequest, NextResponse } from 'next/server';
import { supabase }     from '@/lib/supabase';
import { lookupScheme } from '@/lib/mfapi';

function checkAdmin(req: NextRequest): boolean {
  const passphrase = process.env.ADMIN_PASSPHRASE;
  if (!passphrase) return true;
  return req.headers.get('x-admin-passphrase') === passphrase;
}

export async function GET() {
  const { data, error } = await supabase.from('funds').select('*').eq('is_active', true).order('id');
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  if (!checkAdmin(req)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = await req.json() as { schemeCode?: string; fundType?: string };
  const { schemeCode, fundType } = body;
  if (!schemeCode || !fundType) return NextResponse.json({ error: 'schemeCode and fundType are required' }, { status: 400 });

  const validTypes = ['large_cap', 'mid_cap', 'small_cap', 'short_debt', 'international'];
  if (!validTypes.includes(fundType)) return NextResponse.json({ error: `fundType must be one of ${validTypes.join(', ')}` }, { status: 400 });

  const info = await lookupScheme(schemeCode);
  if (!info) return NextResponse.json({ error: `Scheme code ${schemeCode} not found on MFAPI` }, { status: 404 });

  const { data, error } = await supabase.from('funds').upsert(
    { scheme_code: schemeCode, scheme_name: info.schemeName, fund_type: fundType, is_active: true },
    { onConflict: 'scheme_code' }
  ).select().single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  if (!checkAdmin(req)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const code = req.nextUrl.searchParams.get('code');
  if (!code) return NextResponse.json({ error: 'code param required' }, { status: 400 });
  const { error } = await supabase.from('funds').update({ is_active: false }).eq('scheme_code', code);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
