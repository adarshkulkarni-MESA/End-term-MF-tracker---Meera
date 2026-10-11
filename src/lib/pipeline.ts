// Daily pipeline: fetch NAVs + index prices, store in Neon PostgreSQL

import { getDb }           from './db';
import { fetchNavHistory } from './mfapi';

export async function runDailyPipeline(): Promise<{
  status: 'success' | 'partial' | 'failed';
  navUpdated: number;
  indexUpdated: number;
  errors: string[];
}> {
  const sql = getDb();
  const errors: string[] = [];
  let navUpdated   = 0;
  let indexUpdated = 0;

  const oneYearAgo = (() => {
    const d = new Date();
    d.setFullYear(d.getFullYear() - 1);
    return d.toISOString().slice(0, 10);
  })();
  const today = new Date().toISOString().slice(0, 10);

  // ── 1. Fetch NAVs (batch insert via unnest) ────────────────────────────────
  const funds = await sql`SELECT scheme_code FROM funds WHERE is_active = true`;
  const peers = await sql`SELECT scheme_code FROM peer_funds`;

  const allCodes = Array.from(
    new Set([
      ...funds.map(f => f.scheme_code as string),
      ...peers.map(p => p.scheme_code as string),
    ])
  );

  for (const code of allCodes) {
    try {
      const rows   = await fetchNavHistory(code);
      const recent = rows.filter(r => r.date >= oneYearAgo);
      if (recent.length === 0) continue;

      const schemeCodes = recent.map(() => code);
      const navDates    = recent.map(r => r.date);
      const navValues   = recent.map(r => r.nav);

      await sql`
        INSERT INTO nav_history (scheme_code, nav_date, nav)
        SELECT * FROM unnest(
          ${schemeCodes}::text[],
          ${navDates}::date[],
          ${navValues}::numeric[]
        ) AS t(scheme_code, nav_date, nav)
        ON CONFLICT (scheme_code, nav_date) DO UPDATE SET nav = EXCLUDED.nav
      `;
      navUpdated += recent.length;
    } catch (err) {
      errors.push(`NAV fetch ${code}: ${String(err)}`);
    }
  }

  // ── 2. Fetch index prices via MFAPI proxy funds ────────────────────────────
  const indices = await sql`
    SELECT name, mfapi_scheme_code
    FROM market_indices
    WHERE is_active = true AND mfapi_scheme_code IS NOT NULL
  `;

  for (const idx of indices) {
    const indexName  = idx.name as string;
    const schemeCode = idx.mfapi_scheme_code as string;
    try {
      const rows   = await fetchNavHistory(schemeCode);
      const recent = rows.filter(r => r.date >= oneYearAgo);
      if (recent.length === 0) {
        errors.push(`Index no data: ${indexName} (mfapi ${schemeCode})`);
        continue;
      }

      const indexNames  = recent.map(() => indexName);
      const priceDates  = recent.map(r => r.date);
      const closePrices = recent.map(r => r.nav);

      await sql`
        INSERT INTO index_history (index_name, price_date, close_price)
        SELECT * FROM unnest(
          ${indexNames}::text[],
          ${priceDates}::date[],
          ${closePrices}::numeric[]
        ) AS t(index_name, price_date, close_price)
        ON CONFLICT (index_name, price_date) DO UPDATE SET close_price = EXCLUDED.close_price
      `;
      indexUpdated += recent.length;
    } catch (err) {
      errors.push(`Index fetch ${indexName}: ${String(err)}`);
    }
  }

  const status = errors.length === 0 ? 'success'
    : navUpdated + indexUpdated > 0   ? 'partial'
    : 'failed';

  // ── 3. Record the run ──────────────────────────────────────────────────────
  await sql`
    INSERT INTO pipeline_runs (run_date, run_type, status, detail)
    VALUES (${today}, 'daily', ${status}, ${JSON.stringify({ navUpdated, indexUpdated, errors })})
  `;

  return { status, navUpdated, indexUpdated, errors };
}
