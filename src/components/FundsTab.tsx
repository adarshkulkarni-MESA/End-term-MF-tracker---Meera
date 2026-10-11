'use client';

import { DashboardData, Snapshot } from '@/app/page';
import ReturnBadge from './ReturnBadge';
import Sparkline   from './Sparkline';

interface Props { data: DashboardData }

function shortName(name: string) {
  return name.length > 40 ? name.slice(0, 38) + '…' : name;
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
      <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-widest mb-2">Fund Performance vs Benchmark & Category Average</h2>
      {perf.map(f => {
        const hist = monthlyHistory(f.schemeCode);
        return (
          <div key={f.schemeCode} className="card p-5">
            <div className="flex items-start justify-between flex-wrap gap-2 mb-4">
              <div>
                <div className="text-xs text-gray-500 uppercase tracking-wide mb-0.5">{f.fundType.replace(/_/g, ' ')}</div>
                <div className="font-semibold text-gray-100">{shortName(f.schemeName)}</div>
                {f.currentNav && <div className="text-xs text-gray-500 mt-0.5">NAV: ₹{f.currentNav.toFixed(2)}</div>}
              </div>
              <Sparkline values={hist} />
            </div>
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
                  <tr><td className="py-2 text-gray-500 text-xs">1 Week</td><td className="py-2 text-right"><ReturnBadge value={f.weekReturn} /></td><td className="py-2 text-right"><ReturnBadge value={f.benchmarkWeek} /></td><td className="py-2 text-right"><ReturnBadge value={f.categoryWeek} /></td><td className="py-2 text-right">{f.weekReturn !== null && f.benchmarkWeek !== null ? <ReturnBadge value={f.weekReturn - f.benchmarkWeek} /> : <span className="text-gray-600">—</span>}</td></tr>
                  <tr><td className="py-2 text-gray-500 text-xs">1 Month</td><td className="py-2 text-right"><ReturnBadge value={f.monthReturn} /></td><td className="py-2 text-right"><ReturnBadge value={f.benchmarkMonth} /></td><td className="py-2 text-right"><ReturnBadge value={f.categoryMonth} /></td><td className="py-2 text-right">{f.monthReturn !== null && f.benchmarkMonth !== null ? <ReturnBadge value={f.monthReturn - f.benchmarkMonth} /> : <span className="text-gray-600">—</span>}</td></tr>
                  <tr><td className="py-2 text-gray-500 text-xs">Year to date</td><td className="py-2 text-right"><ReturnBadge value={f.ytdReturn} /></td><td className="py-2 text-right"><ReturnBadge value={f.benchmarkYtd} /></td><td className="py-2 text-right"><ReturnBadge value={f.categoryYtd} /></td><td className="py-2 text-right">{f.ytdReturn !== null && f.benchmarkYtd !== null ? <ReturnBadge value={f.ytdReturn - f.benchmarkYtd} /> : <span className="text-gray-600">—</span>}</td></tr>
                </tbody>
              </table>
            </div>
            {f.fundType === 'short_debt' && <div className="text-xs text-gray-600 mt-3">ℹ️ No free index for short-duration debt funds — benchmark column shows category average only.</div>}
            {f.fundType === 'international' && <div className="text-xs text-gray-600 mt-3">ℹ️ Benchmark is S&P 500 (USD returns). Currency movements affect the comparison.</div>}
          </div>
        );
      })}
    </div>
  );
}
