'use client';

import { DashboardData, Snapshot, FundPerf } from '@/app/page';
import ReturnBadge from './ReturnBadge';
import VerdictBadge from './VerdictBadge';

interface Props { data: DashboardData }

export default function TrendsTab({ data }: Props) {
  const { snapshots } = data;

  if (snapshots.length === 0) {
    return (
      <div className="card p-8 text-center text-gray-500">
        <div className="text-4xl mb-3">📈</div>
        <div className="font-medium">No trend data yet</div>
        <div className="text-sm mt-1">Trends appear after 2+ weekly snapshots have been saved.</div>
      </div>
    );
  }

  const sorted = [...snapshots].sort((a, b) => b.week_date.localeCompare(a.week_date));
  const latestFunds: FundPerf[] = sorted[0]?.data?.funds ?? [];

  function fmt(d: string) {
    return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  }

  return (
    <div className="space-y-6">
      <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-widest">Multi-week Return History</h2>
      {latestFunds.map(fund => (
        <div key={fund.schemeCode} className="card p-5">
          <div className="text-xs text-gray-500 uppercase tracking-wide mb-0.5">{fund.fundType.replace(/_/g, ' ')}</div>
          <div className="font-semibold text-gray-100 mb-4">{fund.schemeName}</div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-gray-600 border-b border-[#1a1a1a]">
                  <td className="pb-2 w-28">Week</td><td className="pb-2 text-right">1W</td><td className="pb-2 text-right">1M</td><td className="pb-2 text-right">YTD</td><td className="pb-2 text-right">vs Bench (M)</td>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#111]">
                {sorted.map((snap: Snapshot) => {
                  const f = snap.data.funds?.find(x => x.schemeCode === fund.schemeCode);
                  if (!f) return null;
                  const vsBench = f.monthReturn !== null && f.benchmarkMonth !== null ? f.monthReturn - f.benchmarkMonth : null;
                  return (
                    <tr key={snap.week_date}>
                      <td className="py-2 text-gray-400 text-xs">{fmt(snap.week_date)}</td>
                      <td className="py-2 text-right"><ReturnBadge value={f.weekReturn} /></td>
                      <td className="py-2 text-right"><ReturnBadge value={f.monthReturn} /></td>
                      <td className="py-2 text-right"><ReturnBadge value={f.ytdReturn} /></td>
                      <td className="py-2 text-right"><ReturnBadge value={vsBench} /></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ))}
      <div>
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-widest mb-3">Verdict History</h2>
        <div className="space-y-2">
          {sorted.map(snap => {
            const weekReport = data.latestReport?.week_date === snap.week_date ? data.latestReport : null;
            return (
              <div key={snap.week_date} className="card2 p-3 flex items-center justify-between flex-wrap gap-2">
                <span className="text-sm text-gray-400">Week of {fmt(snap.week_date)}</span>
                {weekReport ? <VerdictBadge verdict={weekReport.verdict} /> : <span className="text-gray-600 text-xs">no report</span>}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
