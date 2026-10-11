'use client';

import { DashboardData } from '@/app/page';
import ReturnBadge       from './ReturnBadge';

interface Props { data: DashboardData }

const INDEX_TYPES = [
  { type: 'large_cap',    label: 'Nifty 50' },
  { type: 'mid_cap',      label: 'Nifty Midcap 150' },
  { type: 'small_cap',    label: 'Nifty Smallcap 100' },
  { type: 'international',label: 'S&P 500' },
];

export default function MarketTab({ data }: Props) {
  const { performance: perf, news } = data;

  const indexData = INDEX_TYPES.map(idx => {
    const fund = perf.find(f => f.fundType === idx.type);
    return { label: idx.label, week: fund?.benchmarkWeek ?? null, month: fund?.benchmarkMonth ?? null, ytd: fund?.benchmarkYtd ?? null };
  });

  function fmt(d: string) {
    return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-widest mb-3">Index Performance</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {indexData.map(idx => (
            <div key={idx.label} className="card2 p-4">
              <div className="text-xs text-gray-500 mb-2 font-medium">{idx.label}</div>
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-sm"><span className="text-gray-600 text-xs">1W</span><ReturnBadge value={idx.week} /></div>
                <div className="flex justify-between items-center text-sm"><span className="text-gray-600 text-xs">1M</span><ReturnBadge value={idx.month} /></div>
                <div className="flex justify-between items-center text-sm"><span className="text-gray-600 text-xs">YTD</span><ReturnBadge value={idx.ytd} /></div>
              </div>
            </div>
          ))}
        </div>
        <p className="text-xs text-gray-600 mt-2">Data from Yahoo Finance via MFAPI benchmarks. Figures are percentage returns.</p>
      </div>
      <div>
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-widest mb-3">Market Headlines</h2>
        {news.length === 0 ? (
          <div className="card p-6 text-center text-gray-500 text-sm">No headlines available yet — fetched every Saturday.</div>
        ) : (
          <div className="space-y-2">
            {news.map((item, i) => (
              <div key={i} className="card2 p-3 flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  {item.url ? (
                    <a href={item.url} target="_blank" rel="noopener noreferrer" className="text-sm text-gray-200 hover:text-red-300 transition-colors leading-snug">{item.headline}</a>
                  ) : (
                    <div className="text-sm text-gray-200 leading-snug">{item.headline}</div>
                  )}
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-gray-600">{item.source}</span>
                    {item.published_at && <span className="text-xs text-gray-700">· {fmt(item.published_at)}</span>}
                  </div>
                </div>
                {item.url && <a href={item.url} target="_blank" rel="noopener noreferrer" className="text-gray-600 hover:text-gray-400 shrink-0 text-xs mt-0.5" aria-label="open article">↗</a>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
