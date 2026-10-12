'use client';

import { DashboardData } from '@/app/page';
import ReturnBadge       from './ReturnBadge';

interface Props { data: DashboardData }

const SOURCE_COLORS: Record<string, string> = {
  'Economic Times': '#f59e0b',
  'Moneycontrol':   '#10b981',
  'Livemint':       '#6366f1',
};

const INDEX_META = [
  { type: 'large_cap',     label: 'Nifty 50',           sub: 'India Large Cap',     icon: '🇮🇳' },
  { type: 'mid_cap',       label: 'Nifty Midcap 150',   sub: 'India Mid Cap',       icon: '📊' },
  { type: 'small_cap',     label: 'Nifty Smallcap 100', sub: 'India Small Cap',     icon: '📈' },
  { type: 'international', label: 'S&P 500',             sub: 'US Large Cap (USD)',  icon: '🇺🇸' },
];

function ReturnBar({ value, max }: { value: number | null; max: number }) {
  if (value === null) return <div className="text-gray-700 text-xs">—</div>;
  const pct = (Math.abs(value) / max) * 100;
  const pos = value >= 0;
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-[#1a1a2e] rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full ${pos ? 'bg-emerald-500' : 'bg-red-500'}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className={`text-xs font-semibold tabular-nums w-14 text-right ${pos ? 'text-emerald-400' : 'text-red-400'}`}>
        {pos ? '+' : ''}{value.toFixed(2)}%
      </span>
    </div>
  );
}

function IndexCard({ label, sub, icon, week, month, ytd, allVals }:
  { label: string; sub: string; icon: string; week: number | null; month: number | null; ytd: number | null; allVals: number[] }) {
  const maxAbs = Math.max(...allVals.map(Math.abs), 1);
  const primary = week ?? month;
  const pos = (primary ?? 0) >= 0;

  return (
    <div className="card p-4 flex flex-col gap-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="text-xs text-gray-500 mb-0.5">{icon} {sub}</div>
          <div className="font-semibold text-gray-100 leading-tight">{label}</div>
        </div>
        {primary !== null && (
          <div className={`text-base font-bold tabular-nums ${pos ? 'text-emerald-400' : 'text-red-400'}`}>
            {pos ? '+' : ''}{primary.toFixed(2)}%
            <div className="text-[10px] font-normal text-gray-600 text-right">1W</div>
          </div>
        )}
      </div>
      <div className="space-y-2">
        <div>
          <div className="text-[10px] text-gray-600 mb-0.5 uppercase tracking-wide">1 Week</div>
          <ReturnBar value={week} max={maxAbs} />
        </div>
        <div>
          <div className="text-[10px] text-gray-600 mb-0.5 uppercase tracking-wide">1 Month</div>
          <ReturnBar value={month} max={maxAbs} />
        </div>
        <div>
          <div className="text-[10px] text-gray-600 mb-0.5 uppercase tracking-wide">YTD</div>
          <ReturnBar value={ytd} max={maxAbs} />
        </div>
      </div>
    </div>
  );
}

function NewsCard({ item, index }: { item: DashboardData['news'][number]; index: number }) {
  const sourceColor = SOURCE_COLORS[item.source] ?? '#6b7280';
  const age = item.published_at
    ? (() => {
        const h = Math.floor((Date.now() - new Date(item.published_at).getTime()) / 36e5);
        if (h < 1)  return 'Just now';
        if (h < 24) return `${h}h ago`;
        return `${Math.floor(h / 24)}d ago`;
      })()
    : null;

  return (
    <div className="card2 p-4 flex gap-4 group hover:border-gray-600 transition-colors">
      {/* left accent with number */}
      <div className="shrink-0 flex flex-col items-center gap-1 pt-0.5">
        <div
          className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold"
          style={{ background: `${sourceColor}22`, color: sourceColor }}
        >
          {index + 1}
        </div>
        <div className="flex-1 w-px" style={{ background: `${sourceColor}22` }} />
      </div>

      {/* content */}
      <div className="flex-1 min-w-0">
        {item.url ? (
          <a href={item.url} target="_blank" rel="noopener noreferrer"
            className="text-sm text-gray-200 group-hover:text-white transition-colors leading-snug font-medium line-clamp-2">
            {item.headline}
          </a>
        ) : (
          <div className="text-sm text-gray-200 leading-snug font-medium">{item.headline}</div>
        )}

        <div className="flex items-center gap-2 mt-2 flex-wrap">
          <span
            className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
            style={{ background: `${sourceColor}20`, color: sourceColor }}
          >
            {item.source}
          </span>
          {age && <span className="text-[10px] text-gray-600">{age}</span>}
          {item.url && (
            <a href={item.url} target="_blank" rel="noopener noreferrer"
              className="text-[10px] text-gray-600 hover:text-gray-400 ml-auto transition-colors">
              Read ↗
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

export default function MarketTab({ data }: Props) {
  const { performance: perf, news } = data;

  const indexData = INDEX_META.map(idx => {
    const fund = perf.find(f => f.fundType === idx.type);
    return {
      ...idx,
      week:  fund?.benchmarkWeek  ?? null,
      month: fund?.benchmarkMonth ?? null,
      ytd:   fund?.benchmarkYtd   ?? null,
    };
  });

  const allVals = indexData.flatMap(i => [i.week, i.month, i.ytd]).filter(v => v !== null) as number[];

  return (
    <div className="space-y-8">

      {/* ── Index performance ─────────────────────────────────────────── */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-widest">Market Indices</h2>
          <span className="text-xs text-gray-600">% returns</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {indexData.map(idx => (
            <IndexCard key={idx.label} {...idx} allVals={allVals} />
          ))}
        </div>
        <p className="text-xs text-gray-700 mt-2">
          Index returns via MFAPI benchmark proxy funds. Percentage returns only — no absolute index level shown.
        </p>
      </div>

      {/* ── Market headlines ──────────────────────────────────────────── */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-widest">Market Headlines</h2>
          {news.length > 0 && (
            <span className="text-xs text-gray-600">{news.length} article{news.length !== 1 ? 's' : ''}</span>
          )}
        </div>

        {/* source legend */}
        {news.length > 0 && (
          <div className="flex gap-3 flex-wrap mb-3">
            {Object.entries(SOURCE_COLORS).map(([src, color]) => (
              <div key={src} className="flex items-center gap-1 text-[10px] text-gray-600">
                <div className="w-2 h-2 rounded-full" style={{ background: color }} />
                {src}
              </div>
            ))}
          </div>
        )}

        {news.length === 0 ? (
          <div className="card p-8 text-center text-gray-500">
            <div className="text-3xl mb-3">📰</div>
            <div className="font-medium text-sm">No headlines yet</div>
            <div className="text-xs mt-1">Fetched every Saturday with the weekly report.</div>
          </div>
        ) : (
          <div className="space-y-2">
            {news.map((item, i) => (
              <NewsCard key={i} item={item} index={i} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
