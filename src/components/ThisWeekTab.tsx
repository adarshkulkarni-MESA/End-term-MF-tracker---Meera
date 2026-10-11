'use client';

import { DashboardData } from '@/app/page';
import VerdictBadge      from './VerdictBadge';
import ReturnBadge       from './ReturnBadge';

interface Props { data: DashboardData }

export default function ThisWeekTab({ data }: Props) {
  const report = data.latestReport;
  const perf   = data.performance;

  if (!report && perf.length === 0) {
    return (
      <div className="card p-8 text-center text-gray-500">
        <div className="text-4xl mb-3">📭</div>
        <div className="font-medium">No report yet</div>
        <div className="text-sm mt-1">The first Saturday report will arrive after deployment. Daily data is being collected.</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {report && (
        <div className="card p-6 text-center">
          <div className="text-gray-400 text-sm mb-3">
            Week ending {new Date(report.week_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
          </div>
          <VerdictBadge verdict={report.verdict} />
          <p className="text-gray-300 mt-3 text-sm max-w-xl mx-auto">{report.reason}</p>
        </div>
      )}

      <div>
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-widest mb-3">This Week's Returns</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {perf.map(f => (
            <div key={f.schemeCode} className="card2 p-4">
              <div className="text-xs text-gray-500 mb-1 uppercase tracking-wide">{f.fundType.replace(/_/g, ' ')}</div>
              <div className="text-sm font-medium text-gray-200 mb-3 leading-tight">{f.schemeName}</div>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div><div className="text-xs text-gray-600 mb-0.5">1W</div><ReturnBadge value={f.weekReturn} /></div>
                <div><div className="text-xs text-gray-600 mb-0.5">1M</div><ReturnBadge value={f.monthReturn} /></div>
                <div><div className="text-xs text-gray-600 mb-0.5">YTD</div><ReturnBadge value={f.ytdReturn} /></div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {report && (report.fund_summaries?.length ?? 0) > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-widest mb-3">Fund Summaries</h2>
          <div className="space-y-3">
            {(report?.fund_summaries ?? []).map((fs, i) => (
              <div key={i} className="card2 p-4 border-l-2 border-indigo-500">
                <div className="text-sm font-semibold text-gray-200 mb-1">{fs.schemeName}</div>
                <div className="text-sm text-gray-400 leading-relaxed">{fs.summary}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {!report && (
        <div className="card p-5 text-center text-gray-500 text-sm">
          Saturday report not generated yet — daily data is being collected.
        </div>
      )}
    </div>
  );
}
