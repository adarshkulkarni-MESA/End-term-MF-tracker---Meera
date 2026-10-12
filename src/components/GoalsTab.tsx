'use client';

import { useState } from 'react';
import { DashboardData } from '@/app/page';

interface Props { data: DashboardData }

function fmtINR(n: number) {
  if (n >= 1e7) return `₹${(n / 1e7).toFixed(1)}Cr`;
  if (n >= 1e5) return `₹${(n / 1e5).toFixed(1)}L`;
  return `₹${Math.round(n).toLocaleString('en-IN')}`;
}

const PRESETS = [
  { label: '🏖️ Retirement',      target: 10000000, years: 25, ret: 12 },
  { label: '🏠 House Down Pmt',  target: 2000000,  years: 5,  ret: 11 },
  { label: '🎓 Child Education', target: 3000000,  years: 12, ret: 12 },
  { label: '🛡️ Emergency Fund',  target: 500000,   years: 2,  ret: 7  },
];

const INPUT = 'w-full rounded-lg px-3 py-2.5 text-sm focus:outline-none tabular-nums transition-colors'
  + ' bg-[rgba(10,10,28,0.9)] border border-[rgba(80,60,180,0.2)] text-[#eeeeff]'
  + ' focus:border-[rgba(139,92,246,0.5)]';

/* ── SIP Growth Chart ───────────────────────────────────────── */
function GrowthChart({ target, currentSavings, sipMonthly, rAnnual, years }: {
  target: number; currentSavings: number; sipMonthly: number; rAnnual: number; years: number;
}) {
  if (years < 1) return null;

  const W = 400, H = 180;
  const padL = 44, padR = 12, padT = 12, padB = 28;
  const cW = W - padL - padR, cH = H - padT - padB;

  const steps = Math.min(years, 30);
  const pts: number[] = [];
  for (let y = 0; y <= steps; y++) {
    const r  = rAnnual / 100;
    const n  = y * 12;
    const fv = currentSavings * Math.pow(1 + r, y) + (sipMonthly > 0 ? sipMonthly * (Math.pow(1 + r / 12, n) - 1) / (r / 12) : 0);
    pts.push(fv);
  }

  const maxV = Math.max(...pts, target) * 1.05;
  const minV = 0;
  const range = maxV - minV || 1;

  function px(i: number) { return padL + (i / steps) * cW; }
  function py(v: number)  { return padT + ((maxV - v) / range) * cH; }

  const linePath = pts.map((v, i) => `${i === 0 ? 'M' : 'L'} ${px(i).toFixed(1)} ${py(v).toFixed(1)}`).join(' ');
  const areaPath = `${linePath} L ${px(steps)} ${py(0)} L ${px(0)} ${py(0)} Z`;
  const targetY  = py(target);

  const yTicks = [maxV, maxV * 0.5, 0];

  return (
    <div>
      <div className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: 'var(--text-moon)' }}>
        Projected Growth to Goal
      </div>
      <div className="overflow-x-auto">
        <svg viewBox={`0 0 ${W} ${H}`} style={{ minWidth: 260, width: '100%', height: H }}>
          <defs>
            <linearGradient id="goalFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%"   stopColor="#8b5cf6" stopOpacity="0.22" />
              <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.01" />
            </linearGradient>
          </defs>
          {/* Grid */}
          {yTicks.filter(v => v > 0).map((v, i) => (
            <g key={i}>
              <line x1={padL} y1={py(v)} x2={W - padR} y2={py(v)} stroke="rgba(80,60,180,0.1)" strokeWidth="1" />
              <text x={padL - 4} y={py(v) + 3} textAnchor="end" fontSize="7.5" fill="#50508a">
                {v >= 1e7 ? `${(v/1e7).toFixed(0)}Cr` : v >= 1e5 ? `${(v/1e5).toFixed(0)}L` : `${(v/1000).toFixed(0)}k`}
              </text>
            </g>
          ))}
          {/* Target line */}
          {target > 0 && targetY > padT && targetY < padT + cH && (
            <>
              <line x1={padL} y1={targetY} x2={W - padR} y2={targetY}
                stroke="#f59e0b" strokeWidth="1.2" strokeDasharray="5 3" opacity="0.7" />
              <text x={W - padR + 2} y={targetY + 3} fontSize="7" fill="#f59e0b">Target</text>
            </>
          )}
          {/* Growth area + line */}
          <path d={areaPath} fill="url(#goalFill)" />
          <path d={linePath} fill="none" stroke="#8b5cf6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          {/* End dot */}
          <circle cx={px(steps)} cy={py(pts[steps])} r="3" fill="#8b5cf6" />
          {/* X labels */}
          {[0, Math.floor(steps / 2), steps].map(i => (
            <text key={i} x={px(i)} y={H - 4} textAnchor="middle" fontSize="8" fill="#50508a">
              Yr {i}
            </text>
          ))}
        </svg>
      </div>
    </div>
  );
}

export default function GoalsTab({ data: _data }: Props) {
  const [target,   setTarget]   = useState(10000000);
  const [years,    setYears]    = useState(25);
  const [retPct,   setRetPct]   = useState(12);
  const [savings,  setSavings]  = useState(0);
  const [sip,      setSip]      = useState(0);

  /* SIP calculation */
  const r         = retPct / 100;
  const rM        = r / 12;
  const n         = years * 12;
  const fvSavings = savings * Math.pow(1 + r, years);
  const remaining = Math.max(0, target - fvSavings);
  const reqSIP    = rM > 0 && n > 0
    ? (remaining * rM) / (Math.pow(1 + rM, n) - 1)
    : remaining / n;
  const totalInvested = reqSIP * n + savings;
  const totalReturns  = target - totalInvested;
  const progress      = Math.min(100, (fvSavings / target) * 100);

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-lg font-bold mb-1" style={{ color: 'var(--text-star)' }}>Goal Planner</h1>
        <p className="text-sm" style={{ color: 'var(--text-moon)' }}>
          Set a financial goal and discover the monthly SIP needed to reach it.
        </p>
      </div>

      {/* Presets */}
      <div>
        <div className="text-xs uppercase tracking-wide mb-2" style={{ color: 'var(--text-dim)' }}>Quick presets</div>
        <div className="flex flex-wrap gap-2">
          {PRESETS.map(p => (
            <button key={p.label}
              onClick={() => { setTarget(p.target); setYears(p.years); setRetPct(p.ret); }}
              className="text-xs rounded-full px-3 py-1.5 transition-colors"
              style={{ border: '1px solid rgba(80,60,180,0.25)', color: 'var(--text-moon)', background: 'transparent' }}>
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Inputs */}
      <div className="card p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label className="block text-xs mb-1" style={{ color: 'var(--text-moon)' }}>Target Corpus (₹)</label>
            <input type="number" value={target} min={10000} step={50000}
              onChange={e => setTarget(Number(e.target.value))} className={INPUT} />
          </div>
          <div>
            <label className="block text-xs mb-1" style={{ color: 'var(--text-moon)' }}>Time Horizon (years)</label>
            <input type="number" value={years} min={1} max={40}
              onChange={e => setYears(Number(e.target.value))} className={INPUT} />
          </div>
          <div>
            <label className="block text-xs mb-1" style={{ color: 'var(--text-moon)' }}>Expected Annual Return (%)</label>
            <input type="number" value={retPct} min={1} max={30} step={0.5}
              onChange={e => setRetPct(Number(e.target.value))} className={INPUT} />
          </div>
          <div>
            <label className="block text-xs mb-1" style={{ color: 'var(--text-moon)' }}>Current Savings (₹)</label>
            <input type="number" value={savings} min={0} step={10000}
              onChange={e => setSavings(Number(e.target.value))} className={INPUT} />
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="card p-6 space-y-5">
        {/* Chart */}
        <GrowthChart target={target} currentSavings={savings} sipMonthly={reqSIP} rAnnual={retPct} years={years} />

        {/* Progress bar */}
        {savings > 0 && (
          <div>
            <div className="flex justify-between text-xs mb-1.5" style={{ color: 'var(--text-moon)' }}>
              <span>Current savings coverage</span>
              <span className="font-semibold text-amber-400">{progress.toFixed(1)}%</span>
            </div>
            <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(30,20,60,0.8)' }}>
              <div className="h-full rounded-full" style={{ width: `${progress}%`, background: '#8b5cf6' }} />
            </div>
          </div>
        )}

        {/* Key figures */}
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: 'Required Monthly SIP', value: fmtINR(Math.max(0, reqSIP)),     color: '#c4b5fd' },
            { label: 'Total Invested',        value: fmtINR(totalInvested),           color: 'var(--text-star)' },
            { label: 'Expected Returns',      value: fmtINR(Math.max(0, totalReturns)), color: '#34d399' },
            { label: 'Goal Corpus',           value: fmtINR(target),                  color: '#fbbf24' },
          ].map(s => (
            <div key={s.label} className="card2 p-4">
              <div className="text-[10px] uppercase tracking-wide mb-1.5" style={{ color: 'var(--text-dim)' }}>{s.label}</div>
              <div className="text-base font-bold" style={{ color: s.color }}>{s.value}</div>
            </div>
          ))}
        </div>

        <div className="text-xs text-center" style={{ color: 'var(--text-dim)' }}>
          Returns assumed at {retPct}% p.a. compounded annually. Actual MF returns vary.
        </div>
      </div>
    </div>
  );
}
