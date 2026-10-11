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
        <span className="text-sm text-gray-400">{label}</span>
        <span className="text-base font-bold text-indigo-300">{display}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value}
        onChange={e => onChange(Number(e.target.value))}
        className="w-full h-1.5 rounded-full appearance-none bg-[#222] accent-indigo-500 cursor-pointer" />
      <div className="flex justify-between text-xs text-gray-700 mt-1.5">
        <span>{min >= 1000 ? fmtINR(min) : min}</span>
        <span>{max >= 1000 ? fmtINR(max) : max}</span>
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
  const invPct   = Math.round((invested / total) * 100);
  const retPct   = 100 - invPct;

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-lg font-bold text-gray-100 mb-1">SIP Calculator</h1>
        <p className="text-sm text-gray-500">Estimate long-term wealth from a Systematic Investment Plan using compound interest</p>
      </div>

      <div>
        <div className="text-xs text-gray-500 uppercase tracking-wide mb-2">Quick Presets</div>
        <div className="flex flex-wrap gap-2">
          {PRESETS.map(p => (
            <button key={p.label}
              onClick={() => { setMonthly(p.monthly); setYears(p.years); setRate(p.rate); }}
              className="text-xs border border-[#222] rounded-full px-3 py-1.5 text-gray-400 hover:border-indigo-500/50 hover:text-indigo-300 transition-colors">
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <div className="card p-6 space-y-7">
        <SliderField label="Monthly SIP Amount"    min={500}  max={100000} step={500} value={monthly} display={fmtINR(monthly)}            onChange={setMonthly} />
        <SliderField label="Expected Annual Return" min={1}   max={30}     step={0.5} value={rate}    display={`${rate}% p.a.`}             onChange={setRate}    />
        <SliderField label="Investment Duration"    min={1}   max={30}     step={1}   value={years}   display={`${years} yr${years > 1 ? 's' : ''}`} onChange={setYears}   />
      </div>

      <div className="card p-6">
        <div className="text-xs text-gray-500 uppercase tracking-wide font-semibold mb-5">Projected Wealth</div>
        <div className="flex h-7 rounded-lg overflow-hidden mb-5 text-xs font-semibold">
          <div className="flex items-center justify-center text-blue-200 bg-blue-700 transition-all duration-500"
            style={{ width: `${invPct}%` }}>
            {invPct > 15 ? 'Invested' : ''}
          </div>
          <div className="flex items-center justify-center text-emerald-100 bg-emerald-600 transition-all duration-500"
            style={{ width: `${retPct}%` }}>
            {retPct > 8 ? 'Returns' : ''}
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3 mb-5">
          {[
            { label: 'Invested',     value: fmtINR(invested), color: 'text-blue-400'    },
            { label: 'Est. Returns', value: fmtINR(returns),  color: 'text-emerald-400' },
            { label: 'Total Value',  value: fmtINR(total),    color: 'text-indigo-300'  },
          ].map(s => (
            <div key={s.label} className="card2 p-4 text-center">
              <div className="text-xs text-gray-500 mb-2">{s.label}</div>
              <div className={`text-sm sm:text-base font-bold ${s.color}`}>{s.value}</div>
            </div>
          ))}
        </div>
        <div className="text-center text-sm text-gray-400">
          Wealth gain of{' '}
          <span className="text-emerald-400 font-bold">{((returns / invested) * 100).toFixed(0)}%</span>{' '}
          over {years} year{years > 1 ? 's' : ''} at {rate}% p.a.
        </div>
      </div>

      <div className="card2 p-4 text-xs text-gray-600 text-center">
        Calculated using standard SIP compound interest formula. Actual mutual fund returns vary with market performance.
      </div>
    </div>
  );
}
