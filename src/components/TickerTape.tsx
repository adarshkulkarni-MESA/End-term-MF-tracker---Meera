'use client';

import { FundPerf } from '@/app/page';

const FALLBACK_TICKERS = [
  { sym: 'NIFTY 50',   price: '—',     change: '—',      up: true  },
  { sym: 'SENSEX',     price: '—',     change: '—',      up: true  },
  { sym: 'NIFTY BANK', price: '—',     change: '—',      up: true  },
];

interface TickerItem {
  sym:    string;
  price:  string;
  change: string;
  up:     boolean;
}

function perfToTickers(performance: FundPerf[]): TickerItem[] {
  const items: TickerItem[] = [];

  // Add benchmark index items (deduplicated by name)
  const seenBenchmarks = new Set<string>();
  for (const f of performance) {
    if (f.benchmarkName && !seenBenchmarks.has(f.benchmarkName)) {
      seenBenchmarks.add(f.benchmarkName);
      const ret = f.benchmarkWeek ?? f.benchmarkMonth ?? null;
      items.push({
        sym:    f.benchmarkName.toUpperCase(),
        price:  '—',
        change: ret !== null ? `${ret >= 0 ? '+' : ''}${ret.toFixed(2)}% 1W` : '—',
        up:     (ret ?? 0) >= 0,
      });
    }
  }

  // Add each tracked fund
  for (const f of performance) {
    const name = f.schemeName.length > 28
      ? f.schemeName.slice(0, 26) + '…'
      : f.schemeName;
    const nav = f.currentNav !== null
      ? `₹${f.currentNav.toFixed(2)}`
      : '—';
    const ret = f.weekReturn;
    items.push({
      sym:    name.toUpperCase(),
      price:  nav,
      change: ret !== null ? `${ret >= 0 ? '+' : ''}${ret.toFixed(2)}% 1W` : '—',
      up:     (ret ?? 0) >= 0,
    });
  }

  return items.length > 0 ? items : FALLBACK_TICKERS;
}

interface Props {
  performance?: FundPerf[];
}

export default function TickerTape({ performance }: Props) {
  const tickers = performance && performance.length > 0
    ? perfToTickers(performance)
    : FALLBACK_TICKERS;

  const doubled = [...tickers, ...tickers];

  return (
    <div className="overflow-hidden bg-[#050508] border-b border-[#1a1a2e] py-2 shrink-0">
      <div className="ticker-track gap-0">
        {doubled.map((t, i) => (
          <span key={i} className="flex items-center gap-2 text-xs px-4 whitespace-nowrap">
            <span className="text-gray-300 font-semibold tracking-wide">{t.sym}</span>
            {t.price !== '—' && <span className="text-gray-500">{t.price}</span>}
            <span className={`font-medium flex items-center gap-0.5 ${t.up ? 'text-emerald-400' : 'text-red-400'}`}>
              {t.change !== '—' && <span className="text-[10px]">{t.up ? '▲' : '▼'}</span>}
              {t.change}
            </span>
            <span className="text-[#1a1a2e] ml-3 select-none">·</span>
          </span>
        ))}
      </div>
    </div>
  );
}
