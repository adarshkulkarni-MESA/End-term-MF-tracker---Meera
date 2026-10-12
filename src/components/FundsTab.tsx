'use client';

import { DashboardData, FundPerf, Snapshot } from '@/app/page';
import ReturnBadge from './ReturnBadge';
import Sparkline   from './Sparkline';

interface Props { data: DashboardData }

const FUND_COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ec4899', '#14b8a6'];

function shortName(name: string) {
  return name.length > 40 ? name.slice(0, 38) + '…' : name;
}

interface ComparisonBarsProps {
  fund:  FundPerf;
  color: string;
}

function ComparisonBars({ fund, color }: ComparisonBarsProps) {
  const rows = [
    { label: '1W',  fund: fund.weekReturn,  bench: fund.benchmarkWeek,  cat: fund.categoryWeek },
    { label: '1M',  fund: fund.monthReturn, bench: fund.benchmarkMonth, cat: fund.categoryMonth },
    { label: 'YTD', fund: fund.ytdReturn,   bench: fund.benchmarkYtd,   cat: fund.categoryYtd },
  ];

  const allVals = rows.flatMap(r => [r.fund, r.bench, r.cat]).filter((v): v is number => v !== null);
  const maxAbs  = Math.max(...allVals.map(Math.abs), 1);

  function pct(v: number | null) {
    if (v === null) return 0;
    return (Math.abs(v) / maxAbs) * 100;
  }

  return (
    <div className="space-y-2 mt-4">
      <div className="flex items-center gap-3 mb-1 flex-wrap">
        <div className="flex items-center gap-1 text-[10px] text-gray-600">
          <div className="w-3 h-2 rounded-sm" style={{ background: color }} /> Fund
        </div>
        <div className="flex items-center gap-1 text-[10px] text-gray-600">
          <div className="w-3 h-2 rounded-sm bg-gray-600" /> Benchmark
        </div>
        <div className="flex items-center gap-1 text-[10px] text-gray-600">
          <div className="w-3 h-2 rounded-sm bg-yellow-700" /> Category
        </div>
      </div>
      {rows.map(row => (
        <div key={row.label} className="grid grid-cols-[32px_1fr_52px] items-center gap-2">
          <span className="text-[10px] text-gray-600 uppercase tracking-wide">{row.label}</span>
          <div className="space-y-0.5">
            {/* Fund bar */}
            <div className="flex items-center gap-1.5">
              <div className="flex-1 h-1.5 bg-[#1a1a2e] rounded-full overflow-hidden">
                <div className="h-full rounded-full" style={{ width: `${pct(row.fund)}%`, background: color }} />
              </div>
            </div>
            {/* Benchmark bar */}
            <div className="flex items-center gap-1.5">
              <div className="flex-1 h-1 bg-[#1a1a2e] rounded-full overflow-hidden opacity-60">
                <div className="h-full rounded-full bg-gray-500" style={{ width: `${pct(row.bench)}%` }} />
              </div>
            </div>
            {/* Category bar */}
            <div className="flex items-center gap-1.5">
              <div className="flex-1 h-1 bg-[#1a1a2e] rounded-full overflow-hidden opacity-50">
                <div className="h-full rounded-full bg-yellow-600" style={{ width: `${pct(row.cat)}%` }} />
              </div>
            </div>
          </div>
          <div className="text-right">
            {row.fund !== null ? (
              <span className={`text-xs font-semibold tabular-nums ${row.fund >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                {row.fund >= 0 ? '+' : ''}{row.fund.toFixed(2)}%
              </span>
            ) : <span className="text-gray-700 text-xs">—</span>}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function FundsTab({ data }: Props) {
  const { performance: perf, snapshots } = data;

  function monthlyHistory(schemeCode: string): (number | null)[] {
    return [...snapshots]
      .sort((a, b) => a.week_date.localeCompare(b.week_date))
      .map((s: Snapshot) => {
        const f = s.data.funds?.find(f => f.schemeCode === schemeCode);
        return f?.monthReturn ?? null;
      });
  }

  if (perf.length === 0) {
    return (
      <div className="card p-8 text-center text-gray-500">
        <div className="text-4xl mb-3">📊</div>
        <div className="font-medium">No fund data yet</div>
        <div className="text-sm mt-1">Run the daily pipeline to fetch NAV data.</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-widest mb-2">Fund Performance vs Benchmark &amp; Category Average</h2>
      {perf.map((f, fi) => {
        const hist  = monthlyHistory(f.schemeCode);
        const color = FUND_COLORS[fi % FUND_COLORS.length];
        return (
          <div key={f.schemeCode} className="card p-5" style={{ borderLeft: `3px solid ${color}` }}>
            <div className="flex items-start justify-between flex-wrap gap-2 mb-4">
              <div>
                <div className="text-xs text-gray-500 uppercase tracking-wide mb-0.5">{f.fundType.replace(/_/g, ' ')}</div>
                <div className="font-semibold text-gray-100">{shortName(f.schemeName)}</div>
                {f.currentNav && <div className="text-xs text-gray-500 mt-0.5">NAV: ₹{f.currentNav.toFixed(2)}</div>}
              </div>
              <Sparkline values={hist} />
            </div>

            {/* Visual bar comparison */}
            <ComparisonBars fund={f} color={color} />

            <div className="border-t border-[#1a1a1a] mt-4 pt-4">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-xs text-gray-600 border-b border-[#1a1a1a]">
                      <td className="pb-2 w-28">Period</td>
                      <td className="pb-2 text-right">This fund</td>
                      <td className="pb-2 text-right">{f.benchmarkName ?? '—'}</td>
                      <td className="pb-2 text-right">Category avg</td>
                      <td className="pb-2 text-right">vs Bench</td>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#111]">
                    <tr>
                      <td className="py-2 text-gray-500 text-xs">1 Week</td>
                      <td className="py-2 text-right"><ReturnBadge value={f.weekReturn} /></td>
                      <td className="py-2 text-right"><ReturnBadge value={f.benchmarkWeek} /></td>
                      <td className="py-2 text-right"><ReturnBadge value={f.categoryWeek} /></td>
                      <td className="py-2 text-right">{f.weekReturn !== null && f.benchmarkWeek !== null ? <ReturnBadge value={f.weekReturn - f.benchmarkWeek} /> : <span className="text-gray-600">—</span>}</td>
                    </tr>
                    <tr>
                      <td className="py-2 text-gray-500 text-xs">1 Month</td>
                      <td className="py-2 text-right"><ReturnBadge value={f.monthReturn} /></td>
                      <td className="py-2 text-right"><ReturnBadge value={f.benchmarkMonth} /></td>
                      <td className="py-2 text-right"><ReturnBadge value={f.categoryMonth} /></td>
                      <td className="py-2 text-right">{f.monthReturn !== null && f.benchmarkMonth !== null ? <ReturnBadge value={f.monthReturn - f.benchmarkMonth} /> : <span className="text-gray-600">—</span>}</td>
                    </tr>
                    <tr>
                      <td className="py-2 text-gray-500 text-xs">Year to date</td>
                      <td className="py-2 text-right"><ReturnBadge value={f.ytdReturn} /></td>
                      <td className="py-2 text-right"><ReturnBadge value={f.benchmarkYtd} /></td>
                      <td className="py-2 text-right"><ReturnBadge value={f.categoryYtd} /></td>
                      <td className="py-2 text-right">{f.ytdReturn !== null && f.benchmarkYtd !== null ? <ReturnBadge value={f.ytdReturn - f.benchmarkYtd} /> : <span className="text-gray-600">—</span>}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              {f.fundType === 'short_debt'    && <div className="text-xs text-gray-600 mt-3">ℹ️ No free index for short-duration debt funds — benchmark column shows category average only.</div>}
              {f.fundType === 'international' && <div className="text-xs text-gray-600 mt-3">ℹ️ Benchmark is S&amp;P 500 (USD returns). Currency movements affect the comparison.</div>}
            </div>
          </div>
        );
      })}
    </div>
  );
}
