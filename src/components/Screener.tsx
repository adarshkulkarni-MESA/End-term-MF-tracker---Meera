'use client';

import { useState, useMemo } from 'react';

const DATA = [
  { name: 'Reliance Industries',   sym: 'RELIANCE',   sector: 'Energy',         pe: 23.4, de: 0.35, roe: 9.2,   mcap: '₹19.9L Cr', y1: 18.4,  rating: 'BUY'  },
  { name: 'TCS',                   sym: 'TCS',        sector: 'IT',             pe: 28.6, de: 0.06, roe: 46.8,  mcap: '₹15.7L Cr', y1: 12.3,  rating: 'BUY'  },
  { name: 'HDFC Bank',             sym: 'HDFCBANK',   sector: 'Banking',        pe: 19.2, de: 7.80, roe: 15.3,  mcap: '₹13.2L Cr', y1: 24.6,  rating: 'BUY'  },
  { name: 'Infosys',               sym: 'INFY',       sector: 'IT',             pe: 24.1, de: 0.05, roe: 31.2,  mcap: '₹7.8L Cr',  y1: -4.2,  rating: 'HOLD' },
  { name: 'ICICI Bank',            sym: 'ICICIBANK',  sector: 'Banking',        pe: 18.7, de: 6.90, roe: 16.8,  mcap: '₹9.0L Cr',  y1: 32.1,  rating: 'BUY'  },
  { name: 'Bharti Airtel',         sym: 'BHARTIARTL', sector: 'Telecom',        pe: 64.2, de: 1.42, roe: 18.4,  mcap: '₹10.8L Cr', y1: 41.2,  rating: 'BUY'  },
  { name: 'Kotak Mahindra Bank',   sym: 'KOTAKBANK',  sector: 'Banking',        pe: 22.5, de: 4.80, roe: 12.7,  mcap: '₹3.7L Cr',  y1: 8.7,   rating: 'HOLD' },
  { name: 'ITC',                   sym: 'ITC',        sector: 'FMCG',           pe: 28.3, de: 0.02, roe: 26.9,  mcap: '₹5.8L Cr',  y1: 7.1,   rating: 'HOLD' },
  { name: 'Hindustan Unilever',    sym: 'HINDUNILVR', sector: 'FMCG',           pe: 55.7, de: 0.12, roe: 18.3,  mcap: '₹5.8L Cr',  y1: -6.3,  rating: 'HOLD' },
  { name: 'Bajaj Finance',         sym: 'BAJFINANCE', sector: 'NBFC',           pe: 29.8, de: 3.60, roe: 22.1,  mcap: '₹5.9L Cr',  y1: -12.4, rating: 'SELL' },
  { name: 'Larsen & Toubro',       sym: 'LT',         sector: 'Infrastructure', pe: 35.2, de: 0.85, roe: 12.4,  mcap: '₹4.9L Cr',  y1: 19.8,  rating: 'BUY'  },
  { name: 'Wipro',                 sym: 'WIPRO',      sector: 'IT',             pe: 21.8, de: 0.08, roe: 17.6,  mcap: '₹2.4L Cr',  y1: -3.1,  rating: 'HOLD' },
  { name: 'Maruti Suzuki',         sym: 'MARUTI',     sector: 'Auto',           pe: 25.4, de: 0.01, roe: 18.2,  mcap: '₹3.7L Cr',  y1: 22.6,  rating: 'BUY'  },
  { name: 'Titan Company',         sym: 'TITAN',      sector: 'Consumer',       pe: 89.3, de: 0.18, roe: 32.1,  mcap: '₹3.4L Cr',  y1: 15.3,  rating: 'HOLD' },
  { name: 'Nestle India',          sym: 'NESTLEIND',  sector: 'FMCG',           pe: 71.2, de: 0.22, roe: 115.3, mcap: '₹2.2L Cr',  y1: -8.9,  rating: 'HOLD' },
  { name: 'SBI',                   sym: 'SBIN',       sector: 'Banking',        pe: 10.8, de: 15.2, roe: 14.2,  mcap: '₹7.4L Cr',  y1: 26.4,  rating: 'BUY'  },
  { name: 'Tata Motors',           sym: 'TATAMOTORS', sector: 'Auto',           pe: 8.4,  de: 1.24, roe: 28.7,  mcap: '₹3.5L Cr',  y1: -18.2, rating: 'HOLD' },
  { name: 'Sun Pharmaceutical',    sym: 'SUNPHARMA',  sector: 'Pharma',         pe: 32.7, de: 0.15, roe: 15.9,  mcap: '₹4.2L Cr',  y1: 28.1,  rating: 'BUY'  },
  { name: 'Asian Paints',          sym: 'ASIANPAINT', sector: 'Consumer',       pe: 58.4, de: 0.08, roe: 31.6,  mcap: '₹2.8L Cr',  y1: -14.7, rating: 'SELL' },
  { name: 'Adani Enterprises',     sym: 'ADANIENT',   sector: 'Conglomerate',   pe: 45.6, de: 0.98, roe: 7.8,   mcap: '₹3.6L Cr',  y1: 38.9,  rating: 'SELL' },
] as const;

const SECTORS = ['All', ...Array.from(new Set(DATA.map(s => s.sector))).sort()];

type Col = 'name' | 'pe' | 'de' | 'roe' | 'y1';

function RatingBadge({ r }: { r: string }) {
  const cls = r === 'BUY'  ? 'bg-emerald-400/10 text-emerald-400 border border-emerald-400/30'
            : r === 'SELL' ? 'bg-red-400/10 text-red-400 border border-red-400/30'
            :                'bg-amber-400/10 text-amber-400 border border-amber-400/30';
  return <span className={`text-[11px] font-bold px-2 py-0.5 rounded ${cls}`}>{r}</span>;
}

export default function Screener() {
  const [query,  setQuery]  = useState('');
  const [sector, setSector] = useState('All');
  const [sort,   setSort]   = useState<{ col: Col; asc: boolean }>({ col: 'name', asc: true });

  function toggleSort(col: Col) {
    setSort(s => s.col === col ? { col, asc: !s.asc } : { col, asc: true });
  }

  const rows = useMemo(() => {
    const q = query.toLowerCase();
    return [...DATA]
      .filter(s => sector === 'All' || s.sector === sector)
      .filter(s => !q || s.name.toLowerCase().includes(q) || s.sym.toLowerCase().includes(q))
      .sort((a, b) => {
        const va = a[sort.col], vb = b[sort.col];
        const cmp = typeof va === 'string' ? (va as string).localeCompare(vb as string) : (va as number) - (vb as number);
        return sort.asc ? cmp : -cmp;
      });
  }, [query, sector, sort]);

  const COLS: { key: Col; label: string }[] = [
    { key: 'name', label: 'Company'     },
    { key: 'pe',   label: 'P/E Ratio'   },
    { key: 'de',   label: 'Debt/Equity' },
    { key: 'roe',  label: 'ROE %'       },
    { key: 'y1',   label: '1Y Return'   },
  ];

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-lg font-bold text-gray-100 mb-1">Stock Screener</h1>
        <p className="text-sm text-gray-500">Fundamental metrics — P/E, Debt/Equity, ROE — for large-cap Indian equities</p>
      </div>

      <div className="grid grid-cols-3 gap-3 text-xs">
        {[
          { label: 'P/E Ratio',    desc: 'Price ÷ Earnings. Lower = cheaper relative to earnings. <20 is generally value territory for banks.' },
          { label: 'Debt/Equity',  desc: 'Total debt ÷ equity. Under 1 is conservative. Ignore for banks (high D/E is normal for lenders).' },
          { label: 'ROE %',        desc: 'Return on equity — how efficiently profits are generated. >15% is healthy for most sectors.' },
        ].map(m => (
          <div key={m.label} className="card2 p-3">
            <div className="font-semibold text-indigo-300 mb-1">{m.label}</div>
            <div className="text-gray-500 leading-relaxed">{m.desc}</div>
          </div>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <input value={query} onChange={e => setQuery(e.target.value)}
          placeholder="Search company or symbol…"
          className="flex-1 bg-[#111] border border-[#222] rounded-lg px-4 py-2.5 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-indigo-500" />
        <select value={sector} onChange={e => setSector(e.target.value)}
          className="bg-[#111] border border-[#222] rounded-lg px-4 py-2.5 text-sm text-gray-200 focus:outline-none focus:border-indigo-500">
          {SECTORS.map(s => <option key={s}>{s}</option>)}
        </select>
      </div>

      <div className="overflow-x-auto rounded-xl border border-[#1a1a1a]">
        <table className="w-full text-sm">
          <thead className="bg-[#0d0d0d]">
            <tr>
              {COLS.map(c => (
                <th key={c.key} onClick={() => toggleSort(c.key)}
                  className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wide cursor-pointer hover:text-gray-300 select-none whitespace-nowrap">
                  {c.label}{' '}
                  <span className={sort.col === c.key ? 'text-indigo-400' : 'text-gray-700'}>
                    {sort.col === c.key ? (sort.asc ? '↑' : '↓') : '↕'}
                  </span>
                </th>
              ))}
              <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">Rating</th>
              <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">Sector</th>
              <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">Mkt Cap</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(s => (
              <tr key={s.sym} className="border-t border-[#1a1a1a] hover:bg-[#0f0f0f] transition-colors">
                <td className="py-3 px-4">
                  <div className="font-medium text-gray-200">{s.name}</div>
                  <div className="text-xs text-gray-600">{s.sym}</div>
                </td>
                <td className="py-3 px-4 text-gray-300 tabular-nums">{s.pe.toFixed(1)}</td>
                <td className="py-3 px-4 text-gray-300 tabular-nums">{s.de.toFixed(2)}</td>
                <td className="py-3 px-4 text-gray-300 tabular-nums">{s.roe.toFixed(1)}%</td>
                <td className={`py-3 px-4 font-semibold tabular-nums ${s.y1 >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {s.y1 >= 0 ? '+' : ''}{s.y1.toFixed(1)}%
                </td>
                <td className="py-3 px-4"><RatingBadge r={s.rating} /></td>
                <td className="py-3 px-4 text-gray-600 text-xs">{s.sector}</td>
                <td className="py-3 px-4 text-gray-500 text-xs">{s.mcap}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length === 0 && (
          <div className="py-12 text-center text-gray-600 text-sm">No stocks match your filter.</div>
        )}
      </div>

      <div className="card2 p-3 text-xs text-gray-600 text-center">
        Data is illustrative and for educational purposes only. Not investment advice. Consult a SEBI-registered advisor before investing.
      </div>
    </div>
  );
}
