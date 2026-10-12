'use client';

import { useState } from 'react';

function fmtINR(n: number) {
  if (n >= 1e7)  return `₹${(n / 1e7).toFixed(2)} Cr`;
  if (n >= 1e5)  return `₹${(n / 1e5).toFixed(2)} L`;
  return `₹${n.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
}

function SliderField({ label, min, max, step, value, display, onChange }: {
  label: string; min: number; max: number; step: number;
  value: number; display: string; onChange: (v: number) => void;
}) {
  return (
    <div>
      <div className="flex justify-between items-baseline mb-2">
        <span className="text-sm" style={{ color: 'var(--text-moon)' }}>{label}</span>
        <span className="text-base font-bold" style={{ color: '#a78bfa' }}>{display}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value}
        onChange={e => onChange(Number(e.target.value))}
        className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
        style={{ background: 'rgba(80,60,180,0.2)', accentColor: '#8b5cf6' }} />
      <div className="flex justify-between text-xs mt-1.5" style={{ color: 'var(--text-dim)' }}>
        <span>{min >= 1000 ? fmtINR(min) : min}</span>
        <span>{max >= 1000 ? fmtINR(max) : max}</span>
      </div>
    </div>
  );
}

function SIPGrowthChart({ monthly, rate, years }: { monthly: number; rate: number; years: number }) {
  const W = 400, H = 140;
  const padL = 54, padR = 16, padT = 14, padB = 30;
  const cW = W - padL - padR;
  const cH = H - padT - padB;

  const STEPS = Math.max(years * 4, 24);

  const points: { x: number; corpus: number; invested: number }[] = [];
  for (let i = 0; i <= STEPS; i++) {
    const t      = (i / STEPS) * years;
    const months = t * 12;
    const r      = rate / 100 / 12;
    const corpus = r > 0
      ? monthly * ((Math.pow(1 + r, months) - 1) / r) * (1 + r)
      : monthly * months;
    points.push({ x: padL + (i / STEPS) * cW, corpus, invested: monthly * months });
  }

  const maxVal = Math.max(...points.map(p => p.corpus), 1);
  function py(v: number) { return padT + ((maxVal - v) / maxVal) * cH; }

  const corpusPath   = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${py(p.corpus).toFixed(1)}`).join(' ');
  const investedPath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${py(p.invested).toFixed(1)}`).join(' ');
  const areaPath     = `${corpusPath} L ${points[STEPS].x} ${py(0)} L ${padL} ${py(0)} Z`;

  const last = points[STEPS];
  const yTicks = [maxVal, maxVal * 0.5, 0];
  const xTicks = [0, Math.round(years / 2), years];

  return (
    <div>
      <div className="text-xs uppercase tracking-widest font-semibold mb-2" style={{ color: 'var(--text-dim)' }}>
        Projected Growth Curve
      </div>
      <div className="overflow-x-auto">
        <svg viewBox={`0 0 ${W} ${H}`} style={{ minWidth: 260, width: '100%', height: H }}>
          <defs>
            <linearGradient id="sipArea" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%"   stopColor="#6366f1" stopOpacity="0.28" />
              <stop offset="100%" stopColor="#6366f1" stopOpacity="0.01" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          {yTicks.map((v, i) => (
            <g key={i}>
              <line x1={padL} y1={py(v)} x2={W - padR} y2={py(v)} stroke="#1e2038" strokeWidth="1" />
              <text x={padL - 4} y={py(v) + 3} textAnchor="end" fontSize="7.5" fill="#4b5563">
                {v === 0 ? '0' : v >= 1e7 ? `${(v / 1e7).toFixed(1)}Cr` : v >= 1e5 ? `${(v / 1e5).toFixed(0)}L` : `${(v / 1000).toFixed(0)}k`}
              </text>
            </g>
          ))}

          {/* Area fill */}
          <path d={areaPath} fill="url(#sipArea)" />

          {/* Invested line (dashed) */}
          <path d={investedPath} fill="none" stroke="#3b82f6" strokeWidth="1.5" strokeDasharray="5,4" strokeOpacity="0.65" />

          {/* Corpus line */}
          <path d={corpusPath} fill="none" stroke="#6366f1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />

          {/* End dots */}
          <circle cx={last.x} cy={py(last.corpus)}   r="4.5" fill="#6366f1" />
          <circle cx={last.x} cy={py(last.invested)}  r="3"   fill="#3b82f6" opacity="0.85" />

          {/* X-axis labels */}
          {xTicks.map((yr, i) => (
            <text key={i}
              x={padL + (years > 0 ? (yr / years) * cW : 0)} y={H - 4}
              textAnchor={i === 0 ? 'start' : i === xTicks.length - 1 ? 'end' : 'middle'}
              fontSize="8" fill="#6b7280"
            >
              {yr}yr
            </text>
          ))}
        </svg>
      </div>
      <div className="flex gap-5 mt-1.5">
        <div className="flex items-center gap-1.5 text-[10px]" style={{ color: 'var(--text-dim)' }}>
          <div className="w-5 border-t-2 border-indigo-500 rounded" />
          Corpus
        </div>
        <div className="flex items-center gap-1.5 text-[10px]" style={{ color: 'var(--text-dim)' }}>
          <div className="w-5 border-t-2 border-blue-500 opacity-65 rounded" style={{ borderStyle: 'dashed' }} />
          Invested
        </div>
      </div>
    </div>
  );
}

const PRESETS = [
  { label: '₹2,500/mo · 5yr · 12%',  monthly: 2500,  years: 5,  rate: 12 },
  { label: '₹10,000/mo · 10yr · 12%', monthly: 10000, years: 10, rate: 12 },
  { label: '₹25,000/mo · 15yr · 15%', monthly: 25000, years: 15, rate: 15 },
  { label: '₹5,000/mo · 20yr · 12%',  monthly: 5000,  years: 20, rate: 12 },
];

export default function SIPCalculator() {
  const [monthly, setMonthly] = useState(10000);
  const [rate,    setRate]    = useState(12);
  const [years,   setYears]   = useState(10);

  const months   = years * 12;
  const r        = rate / 100 / 12;
  const invested = monthly * months;
  const total    = r > 0
    ? monthly * ((Math.pow(1 + r, months) - 1) / r) * (1 + r)
    : invested;
  const returns  = total - invested;
  const wealthGainPct = invested > 0 ? ((returns / invested) * 100).toFixed(0) : '0';

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-lg font-bold mb-1" style={{ color: 'var(--text-star)' }}>SIP Calculator</h1>
        <p className="text-sm" style={{ color: 'var(--text-moon)' }}>
          Estimate long-term wealth from a Systematic Investment Plan using compound interest
        </p>
      </div>

      <div>
        <div className="text-xs uppercase tracking-wide mb-2" style={{ color: 'var(--text-dim)' }}>Quick Presets</div>
        <div className="flex flex-wrap gap-2">
          {PRESETS.map(p => (
            <button key={p.label}
              onClick={() => { setMonthly(p.monthly); setYears(p.years); setRate(p.rate); }}
              className="text-xs rounded-full px-3 py-1.5 transition-colors"
              style={{ border: '1px solid rgba(80,60,180,0.22)', color: 'var(--text-moon)' }}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <div className="card p-6 space-y-7">
        <SliderField label="Monthly SIP Amount"    min={500}  max={100000} step={500} value={monthly} display={fmtINR(monthly)}                        onChange={setMonthly} />
        <SliderField label="Expected Annual Return" min={1}   max={30}     step={0.5} value={rate}    display={`${rate}% p.a.`}                          onChange={setRate}    />
        <SliderField label="Investment Duration"    min={1}   max={30}     step={1}   value={years}   display={`${years} yr${years > 1 ? 's' : ''}`}     onChange={setYears}   />
      </div>

      <div className="card p-6">
        <div className="text-xs uppercase tracking-wide font-semibold mb-5" style={{ color: 'var(--text-dim)' }}>
          Projected Wealth
        </div>

        {/* Growth chart */}
        <div className="mb-5">
          <SIPGrowthChart monthly={monthly} rate={rate} years={years} />
        </div>

        <div className="grid grid-cols-3 gap-3 mb-5">
          {[
            { label: 'Invested',     value: fmtINR(invested), color: '#60a5fa' },
            { label: 'Est. Returns', value: fmtINR(returns),  color: '#34d399' },
            { label: 'Total Value',  value: fmtINR(total),    color: '#a78bfa' },
          ].map(s => (
            <div key={s.label} className="card2 p-4 text-center">
              <div className="text-xs mb-2" style={{ color: 'var(--text-dim)' }}>{s.label}</div>
              <div className="text-sm sm:text-base font-bold" style={{ color: s.color }}>{s.value}</div>
            </div>
          ))}
        </div>
        <div className="text-center text-sm" style={{ color: 'var(--text-moon)' }}>
          Wealth gain of{' '}
          <span className="font-bold" style={{ color: '#34d399' }}>{wealthGainPct}%</span>{' '}
          over {years} year{years > 1 ? 's' : ''} at {rate}% p.a.
        </div>
      </div>

      <div className="card2 p-4 text-xs text-center" style={{ color: 'var(--text-dim)' }}>
        Calculated using standard SIP compound interest formula. Actual mutual fund returns vary with market performance.
      </div>
    </div>
  );
}
