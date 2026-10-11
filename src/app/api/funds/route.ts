// GET  /api/funds  → list active funds
// POST /api/funds  → add a fund (requires ADMIN_PASSPHRASE header)
// DELETE /api/funds?code=XXXXX → remove a fund

import { NextRequest, NextResponse } from 'next/server';
import { getDb }        from '@/lib/db';
import { lookupScheme } from '@/lib/mfapi';

function checkAdmin(req: NextRequest): boolean {
  const passphrase = process.env.ADMIN_PASSPHRASE;
  if (!passphrase) return true;
  return req.headers.get('x-admin-passphrase') === passphrase;
}

export async function GET() {
  try {
    const sql  = getDb();
    const data = await sql`SELECT * FROM funds WHERE is_active = true ORDER BY id`;
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  if (!checkAdmin(req)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await req.json() as { schemeCode?: string; fundType?: string };
  const { schemeCode, fundType } = body;

  if (!schemeCode || !fundType) {
    return NextResponse.json({ error: 'schemeCode and fundType are required' }, { status: 400 });
  }

  const validTypes = ['large_cap', 'mid_cap', 'small_cap', 'short_debt', 'international'];
  if (!validTypes.includes(fundType)) {
    return NextResponse.json({ error: `fundType must be one of ${validTypes.join(', ')}` }, { status: 400 });
  }

  const info = await lookupScheme(schemeCode);
  if (!info) {
    return NextResponse.json({ error: `Scheme code ${schemeCode} not found on MFAPI` }, { status: 404 });
  }

  try {
    const sql  = getDb();
    const rows = await sql`
      INSERT INTO funds (scheme_code, scheme_name, fund_type, is_active)
      VALUES (${schemeCode}, ${info.schemeName}, ${fundType}, true)
      ON CONFLICT (scheme_code) DO UPDATE
        SET scheme_name = EXCLUDED.scheme_name,
            fund_type   = EXCLUDED.fund_type,
            is_active   = true
      RETURNING *
    `;
    return NextResponse.json(rows[0], { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  if (!checkAdmin(req)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const code = req.nextUrl.searchParams.get('code');
  if (!code) return NextResponse.json({ error: 'code param required' }, { status: 400 });

  try {
    const sql = getDb();
    await sql`UPDATE funds SET is_active = false WHERE scheme_code = ${code}`;
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
