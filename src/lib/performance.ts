// Compute per-fund performance vs benchmark and category average

import { supabase } from './supabase';
import {
  NavPoint,
  navOnDate,
  weekReturn,
  monthReturn,
  ytdReturn,
  categoryAverage,
} from './returns';

export interface FundPerformance {
  schemeCode:    string;
  schemeName:    string;
  fundType:      string;
  asOf:          string;
  currentNav:    number | null;
  weekReturn:    number | null;
  monthReturn:   number | null;
  ytdReturn:     number | null;
  benchmarkName: string | null;
  benchmarkWeek:  number | null;
  benchmarkMonth: number | null;
  benchmarkYtd:   number | null;
  categoryWeek:   number | null;
  categoryMonth:  number | null;
  categoryYtd:    number | null;
}

async function loadNav(code: string): Promise<NavPoint[]> {
  const { data } = await supabase
    .from('nav_history')
    .select('nav_date, nav')
    .eq('scheme_code', code)
    .order('nav_date', { ascending: false })
    .limit(400);
  return (data ?? []).map(r => ({ date: r.nav_date as string, nav: Number(r.nav) }));
}

async function loadIndex(indexName: string): Promise<NavPoint[]> {
  const { data } = await supabase
    .from('index_history')
    .select('price_date, close_price')
    .eq('index_name', indexName)
    .order('price_date', { ascending: false })
    .limit(400);
  return (data ?? []).map(r => ({ date: r.price_date as string, nav: Number(r.close_price) }));
}

export async function computePerformance(asOf?: string): Promise<FundPerformance[]> {
  const date = asOf ?? new Date().toISOString().slice(0, 10);

  const { data: funds } = await supabase
    .from('funds')
    .select('scheme_code, scheme_name, fund_type')
    .eq('is_active', true);

  if (!funds?.length) return [];

  const { data: benchmarkRows } = await supabase
    .from('benchmark_map')
    .select('fund_type, index_name');
  const benchmarkMap = Object.fromEntries(
    (benchmarkRows ?? []).map(r => [r.fund_type, r.index_name])
  );

  const { data: peerRows } = await supabase
    .from('peer_funds')
    .select('scheme_code, fund_type');
  const peersByType: Record<string, string[]> = {};
  for (const p of peerRows ?? []) {
    if (!peersByType[p.fund_type]) peersByType[p.fund_type] = [];
    peersByType[p.fund_type].push(p.scheme_code);
  }

  const navCache: Record<string, NavPoint[]>   = {};
  const idxCache: Record<string, NavPoint[]>   = {};
  const catCache: Record<string, { w: number|null; m: number|null; y: number|null }> = {};

  async function getNav(code: string) {
    if (!navCache[code]) navCache[code] = await loadNav(code);
    return navCache[code];
  }
  async function getIdx(name: string) {
    if (!idxCache[name]) idxCache[name] = await loadIndex(name);
    return idxCache[name];
  }

  const results: FundPerformance[] = [];

  for (const fund of funds) {
    const navPts = await getNav(fund.scheme_code);

    const fWeek  = weekReturn(navPts, date);
    const fMonth = monthReturn(navPts, date);
    const fYtd   = ytdReturn(navPts, date);
    const curNav = navOnDate(navPts, date);

    const benchName = benchmarkMap[fund.fund_type] ?? null;
    let bWeek: number|null = null, bMonth: number|null = null, bYtd: number|null = null;
    if (benchName) {
      const idxPts = await getIdx(benchName);
      bWeek  = weekReturn(idxPts, date);
      bMonth = monthReturn(idxPts, date);
      bYtd   = ytdReturn(idxPts, date);
    }

    if (!catCache[fund.fund_type]) {
      const peers = peersByType[fund.fund_type] ?? [];
      const peerWeeks:  (number|null)[] = [];
      const peerMonths: (number|null)[] = [];
      const peerYtds:   (number|null)[] = [];
      for (const pc of peers) {
        const pp = await getNav(pc);
        peerWeeks.push(weekReturn(pp, date));
        peerMonths.push(monthReturn(pp, date));
        peerYtds.push(ytdReturn(pp, date));
      }
      catCache[fund.fund_type] = {
        w: categoryAverage(peerWeeks),
        m: categoryAverage(peerMonths),
        y: categoryAverage(peerYtds),
      };
    }
    const cat = catCache[fund.fund_type];

    results.push({
      schemeCode:    fund.scheme_code,
      schemeName:    fund.scheme_name,
      fundType:      fund.fund_type,
      asOf:          date,
      currentNav:    curNav,
      weekReturn:    fWeek,
      monthReturn:   fMonth,
      ytdReturn:     fYtd,
      benchmarkName: benchName,
      benchmarkWeek:  bWeek,
      benchmarkMonth: bMonth,
      benchmarkYtd:   bYtd,
      categoryWeek:   cat.w,
      categoryMonth:  cat.m,
      categoryYtd:    cat.y,
    });
  }

  return results;
}
