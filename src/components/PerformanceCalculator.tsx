'use client';

import { useState } from 'react';

function fmtINR(n: number) {
  if (n >= 1e7)  return `₹${(n / 1e7).toFixed(2)} Cr`;
  if (n >= 1e5)  return `₹${(n / 1e5).toFixed(2)} L`;
  return `₹${n.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
}

const EXAMPLES = [
  { label: 'PPFAS Flexi Cap (Jan 2022)',  amount: 100000, buyNav: 42.50, curNav: 78.30, date: '2022-01-03' },
  { label: 'Mirae Asset Large Cap (2021)', amount: 50000,  buyNav: 72.14, curNav: 98.60, date: '2021-06-01' },
  { label: 'SBI Small Cap (2020)',         amount: 25000,  buyNav: 55.20, curNav: 155.40, date: '2020-03-23' },
];

function Field({ label, note, children }: { label: string; note?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs text-gray-500 mb-1">{label}</label>
      {note && <div className="text-xs text-gray-700 mb-1.5">{note}</div>}
      {children}
    </div>
  );
}

const INPUT_CLS = 'w-full bg-[#0a0a0a] border border-[#333] rounded-lg px-3 py-2.5 text-sm text-gray-200 focus:outline-none focus:border-indigo-500 tabular-nums';

export default function PerformanceCalculator() {
  const [amount,  setAmount]  = useState(100000);
  const [buyNav,  setBuyNav]  = useState(42.50);
  const [curNav,  setCurNav]  = useState(78.30);
  const [buyDate, setBuyDate] = useState('2022-01-03');

  const units    = amount / buyNav;
  const curVal   = units * curNav;
  const absRet   = curVal - amount;
  const absRetPct = ((curNav - buyNav) / buyNav) * 100;
  const days     = Math.max(1, (Date.now() - new Date(buyDate).getTime()) / 86400000);
  const yrs      = days / 365.25;
  const cagr     = yrs >= 0.083 ? (Math.pow(curVal / amount, 1 / yrs) - 1) * 100 : absRetPct;
  const pos      = absRet >= 0;
  const meterPct = Math.min(Math.abs(absRetPct), 100);

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-lg font-bold text-gray-100 mb-1">Performance Tracker</h1>
        <p className="text-sm text-gray-500">Enter your purchase NAV and current NAV to calculate absolute return, CAGR, and wealth gain</p>
      </div>

      {/* Examples */}
      <div>
        <div className="text-xs text-gray-500 uppercase tracking-wide mb-2">Load an example</div>
        <div className="flex flex-wrap gap-2">
          {EXAMPLES.map(ex => (
            <button key={ex.label}
              onClick={() => { setAmount(ex.amount); setBuyNav(ex.buyNav); setCurNav(ex.curNav); setBuyDate(ex.date); }}
              className="text-xs border border-[#222] rounded-full px-3 py-1.5 text-gray-400 hover:border-indigo-500/50 hover:text-indigo-300 transition-colors"
            >
              {ex.label}
            </button>
          ))}
        </div>
      </div>

      {/* Inputs */}
      <div className="card p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <Field label="Investment Amount (₹)" note="Total lump-sum amount invested">
            <input type="number" value={amount} min={1000} step={1000}
              onChange={e => setAmount(Number(e.target.value))} className={INPUT_CLS} />
          </Field>
          <Field label="Purchase Date" note="Date you bought the fund units">
            <input type="date" value={buyDate}
              onChange={e => setBuyDate(e.target.value)} className={INPUT_CLS} />
          </Field>
          <Field label="Purchase NAV (₹)" note="NAV on the day you invested">
            <input type="number" value={buyNav} min={0.01} step={0.01}
              onChange={e => setBuyNav(Number(e.target.value))} className={INPUT_CLS} />
          </Field>
          <Field label="Current NAV (₹)" note="Today's NAV from AMC factsheet">
            <input type="number" value={curNav} min={0.01} step={0.01}
              onChange={e => setCurNav(Number(e.target.value))} className={INPUT_CLS} />
          </Field>
        </div>
      </div>

      {/* Results */}
      <div className="card p-6">
        <div className="text-xs text-gray-500 uppercase tracking-wide font-semibold mb-5">Your Investment Summary</div>

        {/* Return meter */}
        <div className="mb-5">
          <div className="flex justify-between text-xs text-gray-500 mb-1.5">
            <span>Absolute Return</span>
            <span className={`font-bold ${pos ? 'text-emerald-400' : 'text-red-400'}`}>
              {pos ? '+' : ''}{absRetPct.toFixed(2)}%
            </span>
          </div>
          <div className="h-2.5 bg-[#1a1a1a] rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-700 ${pos ? 'bg-emerald-500' : 'bg-red-500'}`}
              style={{ width: `${meterPct}%` }}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-4">
          {[
            { label: 'Units Purchased', value: units.toFixed(4),             color: 'text-gray-200'  },
            { label: 'Current Value',   value: fmtINR(curVal),               color: 'text-gray-200'  },
            { label: 'Gain / Loss',     value: (pos ? '+' : '') + fmtINR(absRet), color: pos ? 'text-emerald-400' : 'text-red-400' },
            { label: 'CAGR',            value: (cagr >= 0 ? '+' : '') + cagr.toFixed(2) + '% p.a.', color: cagr >= 0 ? 'text-emerald-400' : 'text-red-400' },
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
