'use client';

import { useState } from 'react';

function fmtINR(n: number) {
  if (n >= 1e7)  return `₹${(n / 1e7).toFixed(2)} Cr`;
  if (n >= 1e5)  return `₹${(n / 1e5).toFixed(2)} L`;
  return `₹${n.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
}

const EXAMPLES = [
  { label: 'PPFAS Flexi Cap (Jan 2022)',   amount: 100000, buyNav: 42.50,  curNav: 78.30,  date: '2022-01-03' },
  { label: 'Mirae Asset Large Cap (2021)', amount: 50000,  buyNav: 72.14,  curNav: 98.60,  date: '2021-06-01' },
  { label: 'SBI Small Cap (Mar 2020)',     amount: 25000,  buyNav: 55.20,  curNav: 155.40, date: '2020-03-23' },
];

const INPUT = 'w-full bg-[#0a0a0a] border border-[#333] rounded-lg px-3 py-2.5 text-sm text-gray-200 focus:outline-none focus:border-indigo-500 tabular-nums';

interface GrowthChartProps {
  amount:  number;
  curVal:  number;
  cagr:    number;
  yrs:     number;
  buyDate: string;
}

function GrowthChart({ amount, curVal, cagr, yrs, buyDate }: GrowthChartProps) {
  if (yrs < 0.083) return null;

  const STEPS = 60;
  const W = 400, H = 160;
  const padL = 48, padR = 16, padT = 14, padB = 28;
  const cW = W - padL - padR;
  const cH = H - padT - padB;

  const points: { x: number; y: number; val: number }[] = [];
  for (let i = 0; i <= STEPS; i++) {
    const t   = (i / STEPS) * yrs;
    const val = amount * Math.pow(1 + cagr / 100, t);
    points.push({ x: padL + (i / STEPS) * cW, y: 0, val });
  }

  const minV = amount;
  const maxV = Math.max(curVal, amount * 1.01);
  const range = maxV - minV || 1;

  function py(v: number) { return padT + ((maxV - v) / range) * cH; }

  for (const p of points) p.y = py(p.val);

  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');
  const areaPath = `${linePath} L ${points[points.length - 1].x} ${py(minV)} L ${points[0].x} ${py(minV)} Z`;

  const positive = curVal >= amount;
  const lineColor = positive ? '#10b981' : '#ef4444';

  // Y-axis ticks
  const yTicks = [maxV, (maxV + minV) / 2, minV];

  // X-axis labels: start, middle, end
  const xLabels: { label: string; x: number }[] = [
    { label: new Date(buyDate).toLocaleDateString('en-IN', { month: 'short', year: '2-digit' }), x: padL },
    { label: new Date(Date.now() - (yrs / 2) * 365.25 * 86400000).toLocaleDateString('en-IN', { month: 'short', year: '2-digit' }), x: padL + cW / 2 },
    { label: 'Today', x: padL + cW },
  ];

  return (
    <div>
      <div className="text-xs text-gray-500 uppercase tracking-widest font-semibold mb-2">Investment Growth Curve</div>
      <div className="overflow-x-auto">
        <svg viewBox={`0 0 ${W} ${H}`} style={{ minWidth: 280, width: '100%', height: H }}>
          <defs>
            <linearGradient id="growthFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%"   stopColor={lineColor} stopOpacity="0.25" />
              <stop offset="100%" stopColor={lineColor} stopOpacity="0.01" />
            </linearGradient>
          </defs>

          {/* grid lines */}
          {yTicks.map((v, i) => (
            <g key={i}>
              <line x1={padL} y1={py(v)} x2={W - padR} y2={py(v)} stroke="#1e2038" strokeWidth="1" />
              <text x={padL - 4} y={py(v) + 3} textAnchor="end" fontSize="7.5" fill="#4b5563">
                {v >= 1e7 ? `${(v / 1e7).toFixed(1)}Cr` : v >= 1e5 ? `${(v / 1e5).toFixed(0)}L` : `${(v / 1000).toFixed(0)}k`}
              </text>
            </g>
          ))}

          {/* area fill */}
          <path d={areaPath} fill="url(#growthFill)" />

          {/* line */}
          <path d={linePath} fill="none" stroke={lineColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />

          {/* start dot */}
          <circle cx={points[0].x} cy={points[0].y} r="3.5" fill="#6366f1" />

          {/* end dot with pulse */}
          <circle cx={points[STEPS].x} cy={points[STEPS].y} r="5" fill={lineColor} opacity="0.15" />
          <circle cx={points[STEPS].x} cy={points[STEPS].y} r="3" fill={lineColor} />

          {/* x-axis labels */}
          {xLabels.map((lbl, i) => (
            <text key={i} x={lbl.x} y={H - 4}
              textAnchor={i === 0 ? 'start' : i === 2 ? 'end' : 'middle'}
              fontSize="8" fill="#6b7280">
              {lbl.label}
            </text>
          ))}
        </svg>
      </div>
    </div>
  );
}

export default function PerformanceCalculator() {
  const [amount,  setAmount]  = useState(100000);
  const [buyNav,  setBuyNav]  = useState(42.50);
  const [curNav,  setCurNav]  = useState(78.30);
  const [buyDate, setBuyDate] = useState('2022-01-03');

  const units      = amount / buyNav;
  const curVal     = units * curNav;
  const absRet     = curVal - amount;
  const absRetPct  = ((curNav - buyNav) / buyNav) * 100;
  const days       = Math.max(1, (Date.now() - new Date(buyDate).getTime()) / 86400000);
  const yrs        = days / 365.25;
  const cagr       = yrs >= 0.083 ? (Math.pow(curVal / amount, 1 / yrs) - 1) * 100 : absRetPct;
  const pos        = absRet >= 0;
  const meterPct   = Math.min(Math.abs(absRetPct), 100);

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-lg font-bold text-gray-100 mb-1">Performance Tracker</h1>
        <p className="text-sm text-gray-500">Enter your purchase NAV and current NAV to calculate absolute return, CAGR, and wealth gain</p>
      </div>

      <div>
        <div className="text-xs text-gray-500 uppercase tracking-wide mb-2">Load an example</div>
        <div className="flex flex-wrap gap-2">
          {EXAMPLES.map(ex => (
            <button key={ex.label}
              onClick={() => { setAmount(ex.amount); setBuyNav(ex.buyNav); setCurNav(ex.curNav); setBuyDate(ex.date); }}
              className="text-xs border border-[#222] rounded-full px-3 py-1.5 text-gray-400 hover:border-indigo-500/50 hover:text-indigo-300 transition-colors">
              {ex.label}
            </button>
          ))}
        </div>
      </div>

      <div className="card p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Investment Amount (₹)</label>
            <div className="text-xs text-gray-700 mb-1.5">Total lump-sum amount invested</div>
            <input type="number" value={amount} min={1000} step={1000}
              onChange={e => setAmount(Number(e.target.value))} className={INPUT} />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Purchase Date</label>
            <div className="text-xs text-gray-700 mb-1.5">Date you bought the fund units</div>
            <input type="date" value={buyDate} onChange={e => setBuyDate(e.target.value)} className={INPUT} />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Purchase NAV (₹)</label>
            <div className="text-xs text-gray-700 mb-1.5">NAV on the day you invested</div>
            <input type="number" value={buyNav} min={0.01} step={0.01}
              onChange={e => setBuyNav(Number(e.target.value))} className={INPUT} />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Current NAV (₹)</label>
            <div className="text-xs text-gray-700 mb-1.5">Today's NAV from AMC factsheet</div>
            <input type="number" value={curNav} min={0.01} step={0.01}
              onChange={e => setCurNav(Number(e.target.value))} className={INPUT} />
          </div>
        </div>
      </div>

      <div className="card p-6">
        <div className="text-xs text-gray-500 uppercase tracking-wide font-semibold mb-5">Your Investment Summary</div>

        {/* Growth chart */}
        <div className="mb-5">
          <GrowthChart amount={amount} curVal={curVal} cagr={cagr} yrs={yrs} buyDate={buyDate} />
        </div>

        {/* Return meter */}
        <div className="mb-5">
          <div className="flex justify-between text-xs text-gray-500 mb-1.5">
            <span>Absolute Return</span>
            <span className={`font-bold ${pos ? 'text-emerald-400' : 'text-red-400'}`}>
              {pos ? '+' : ''}{absRetPct.toFixed(2)}%
            </span>
          </div>
          <div className="h-2.5 bg-[#1a1a1a] rounded-full overflow-hidden">
            <div className={`h-full rounded-full transition-all duration-700 ${pos ? 'bg-emerald-500' : 'bg-red-500'}`}
              style={{ width: `${meterPct}%` }} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-4">
          {[
            { label: 'Units Purchased', value: units.toFixed(4),                                                              color: 'text-gray-200'  },
            { label: 'Current Value',   value: fmtINR(curVal),                                                                color: 'text-gray-200'  },
            { label: 'Gain / Loss',     value: (pos ? '+' : '') + fmtINR(absRet),                                             color: pos ? 'text-emerald-400' : 'text-red-400' },
            { label: 'CAGR',            value: (cagr >= 0 ? '+' : '') + cagr.toFixed(2) + '% p.a.',                          color: cagr >= 0 ? 'text-emerald-400' : 'text-red-400' },
          ].map(s => (
            <div key={s.label} className="card2 p-4">
              <div className="text-xs text-gray-500 mb-1.5">{s.label}</div>
              <div className={`text-base font-bold ${s.color}`}>{s.value}</div>
            </div>
          ))}
        </div>
        <div className="text-center text-xs text-gray-500">
          Holding period: {Math.floor(yrs)} yr{Math.floor(yrs) !== 1 ? 's' : ''}{' '}
          {Math.round((yrs % 1) * 12)} mo
        </div>
      </div>

      <div className="card2 p-4 text-xs text-gray-600 text-center">
        Enter NAV values from your fund's AMC website or Kuvera / Coin / MFCentral. CAGR requires an accurate purchase date.
      </div>
    </div>
  );
}
