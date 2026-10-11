// Daily pipeline: fetch NAVs + index prices, store in Supabase

import { supabase } from './supabase';
import { fetchNavHistory } from './mfapi';
import { fetchIndexHistory } from './yahoo';

export async function runDailyPipeline(): Promise<{
  status: 'success' | 'partial' | 'failed';
  navUpdated: number;
  indexUpdated: number;
  errors: string[];
}> {
  const errors: string[] = [];
  let navUpdated   = 0;
  let indexUpdated = 0;

  const today     = new Date().toISOString().slice(0, 10);
  const oneYearAgo = (() => {
    const d = new Date();
    d.setFullYear(d.getFullYear() - 1);
    return d.toISOString().slice(0, 10);
  })();

  const { data: funds } = await supabase.from('funds').select('scheme_code').eq('is_active', true);
  const { data: peers } = await supabase.from('peer_funds').select('scheme_code');

  const allCodes = Array.from(
    new Set([
      ...(funds ?? []).map(f => f.scheme_code),
      ...(peers ?? []).map(p => p.scheme_code),
    ])
  );

  for (const code of allCodes) {
    try {
      const rows = await fetchNavHistory(code);
      const recent = rows.filter(r => r.date >= oneYearAgo);
      if (recent.length === 0) continue;

      const upsertRows = recent.map(r => ({
        scheme_code: code,
        nav_date:    r.date,
        nav:         r.nav,
      }));
      const { error } = await supabase
        .from('nav_history')
        .upsert(upsertRows, { onConflict: 'scheme_code,nav_date' });

      if (error) errors.push(`NAV upsert ${code}: ${error.message}`);
      else navUpdated += upsertRows.length;
    } catch (err) {
      errors.push(`NAV fetch ${code}: ${String(err)}`);
    }
  }

  const { data: indices } = await supabase
    .from('market_indices')
    .select('name, ticker')
    .eq('is_active', true);

  for (const idx of indices ?? []) {
    try {
      const rows = await fetchIndexHistory(idx.ticker, oneYearAgo, today);
      if (rows.length === 0) {
        errors.push(`Index no data: ${idx.name} (${idx.ticker})`);
        continue;
      }
      const upsertRows = rows.map(r => ({
        index_name:  idx.name,
        price_date:  r.date,
        close_price: r.close,
      }));
      const { error } = await supabase
        .from('index_history')
        .upsert(upsertRows, { onConflict: 'index_name,price_date' });

      if (error) errors.push(`Index upsert ${idx.name}: ${error.message}`);
      else indexUpdated += upsertRows.length;
    } catch (err) {
      errors.push(`Index fetch ${idx.name}: ${String(err)}`);
    }
  }

  const status = errors.length === 0 ? 'success'
    : navUpdated + indexUpdated > 0   ? 'partial'
    : 'failed';

  await supabase.from('pipeline_runs').insert({
    run_date: today,
    run_type: 'daily',
    status,
    detail:   { navUpdated, indexUpdated, errors },
  });

  return { status, navUpdated, indexUpdated, errors };
}
