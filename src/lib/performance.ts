// Compute per-fund performance vs benchmark and category average

import { getDb } from './db';
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

// Neon returns DATE columns as JS Date objects in runtime; convert to YYYY-MM-DD
function toDateStr(val: unknown): string {
  if (val instanceof Date) return val.toISOString().slice(0, 10);
  return String(val).slice(0, 10);
}

async function loadNav(code: string): Promise<NavPoint[]> {
  const sql = getDb();
  const rows = await sql`
    SELECT nav_date, nav FROM nav_history
    WHERE scheme_code = ${code}
    ORDER BY nav_date DESC
    LIMIT 400
  `;
  return rows.map(r => ({ date: toDateStr(r.nav_date), nav: Number(r.nav) }));
}

async function loadIndex(indexName: string): Promise<NavPoint[]> {
  const sql = getDb();
  const rows = await sql`
    SELECT price_date, close_price FROM index_history
    WHERE index_name = ${indexName}
    ORDER BY price_date DESC
    LIMIT 400
  `;
  return rows.map(r => ({ date: toDateStr(r.price_date), nav: Number(r.close_price) }));
}

export async function computePerformance(asOf?: string): Promise<FundPerformance[]> {
  const sql  = getDb();
  const date = asOf ?? new Date().toISOString().slice(0, 10);

  const funds = await sql`SELECT scheme_code, scheme_name, fund_type FROM funds WHERE is_active = true`;
  if (!funds.length) return [];

  const benchRows = await sql`SELECT fund_type, index_name FROM benchmark_map`;
  const benchmarkMap = Object.fromEntries(
    benchRows.map(r => [r.fund_type as string, r.index_name as string])
  );

  const peerRows = await sql`SELECT scheme_code, fund_type FROM peer_funds`;
  const peersByType: Record<string, string[]> = {};
  for (const p of peerRows) {
    const ft = p.fund_type as string;
    if (!peersByType[ft]) peersByType[ft] = [];
    peersByType[ft].push(p.scheme_code as string);
  }

  const navCache: Record<string, NavPoint[]> = {};
  const idxCache: Record<string, NavPoint[]> = {};
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
    const navPts = await getNav(fund.scheme_code as string);

    const fWeek  = weekReturn(navPts, date);
    const fMonth = monthReturn(navPts, date);
    const fYtd   = ytdReturn(navPts, date);
    const curNav = navOnDate(navPts, date);

    const benchName = benchmarkMap[fund.fund_type as string] ?? null;
    let bWeek: number|null = null, bMonth: number|null = null, bYtd: number|null = null;
    if (benchName) {
      const idxPts = await getIdx(benchName);
      bWeek  = weekReturn(idxPts, date);
      bMonth = monthReturn(idxPts, date);
      bYtd   = ytdReturn(idxPts, date);
    }

    const ft = fund.fund_type as string;
    if (!catCache[ft]) {
      const peers = peersByType[ft] ?? [];
      const peerWeeks:  (number|null)[] = [];
      const peerMonths: (number|null)[] = [];
      const peerYtds:   (number|null)[] = [];
      for (const pc of peers) {
        const pp = await getNav(pc);
        peerWeeks.push(weekReturn(pp, date));
        peerMonths.push(monthReturn(pp, date));
        peerYtds.push(ytdReturn(pp, date));
      }
      catCache[ft] = {
        w: categoryAverage(peerWeeks),
        m: categoryAverage(peerMonths),
        y: categoryAverage(peerYtds),
      };
    }
    const cat = catCache[ft];

    results.push({
      schemeCode:    fund.scheme_code as string,
      schemeName:    fund.scheme_name as string,
      fundType:      ft,
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
