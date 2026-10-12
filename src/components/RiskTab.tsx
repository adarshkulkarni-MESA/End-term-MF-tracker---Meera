'use client';

import { DashboardData, FundPerf, Snapshot } from '@/app/page';

interface Props { data: DashboardData }

const FUND_COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ec4899', '#14b8a6'];

function stdDev(vals: number[]): number {
  if (vals.length < 2) return 0;
  const mean = vals.reduce((a, b) => a + b, 0) / vals.length;
  const variance = vals.reduce((s, v) => s + (v - mean) ** 2, 0) / (vals.length - 1);
  return Math.sqrt(variance);
}

function weekReturns(schemeCode: string, snapshots: Snapshot[]): number[] {
  return snapshots
    .sort((a, b) => a.week_date.localeCompare(b.week_date))
    .map(s => s.data.funds?.find(f => f.schemeCode === schemeCode)?.weekReturn ?? null)
    .filter((v): v is number => v !== null);
}

/* ── Mini sparkline ──────────────────────────────────────────── */
function DrawdownLine({ wr, color }: { wr: number[]; color: string }) {
  if (wr.length < 2) return <div className="w-16 h-7 rounded" style={{ background: 'rgba(30,20,60,0.5)' }} />;
  const W = 64, H = 28;
  const min = Math.min(...wr), max = Math.max(...wr);
  const range = max - min || 1;
  function px(i: number) { return (i / (wr.length - 1)) * W; }
  function py(v: number)  { return H - ((v - min) / range) * H * 0.85 - 4; }
  const pts = wr.map((v, i) => `${i === 0 ? 'M' : 'L'} ${px(i).toFixed(1)} ${py(v).toFixed(1)}`).join(' ');
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: 64, height: 28 }}>
      {/* Shade negative weeks */}
      {wr.map((v, i) => v < 0 ? (
        <rect key={i} x={px(i) - 2} y={0} width={4} height={H}
          fill="#ef444415" />
      ) : null)}
      <path d={pts} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      {/* Zero line */}
      <line x1={0} y1={py(0)} x2={W} y2={py(0)} stroke="rgba(100,80,200,0.2)" strokeWidth="0.8" />
    </svg>
  );
}

/* ── Risk-Return scatter ─────────────────────────────────────── */
function RiskReturnChart({ funds, snapshots }: { funds: FundPerf[]; snapshots: Snapshot[] }) {
  const points = funds.map((f, i) => {
    const wr  = weekReturns(f.schemeCode, snapshots);
    const avg = wr.length > 0 ? wr.reduce((a, b) => a + b, 0) / wr.length : null;
    const vol = wr.length >= 2 ? stdDev(wr) : null;
    return { f, avg, vol, color: FUND_COLORS[i % FUND_COLORS.length] };
  }).filter(p => p.avg !== null && p.vol !== null) as {
    f: FundPerf; avg: number; vol: number; color: string
  }[];

  if (points.length < 2) return null;

  const W = 380, H = 180;
  const padL = 40, padR = 16, padT = 16, padB = 30;
  const cW = W - padL - padR, cH = H - padT - padB;

  const maxVol = Math.max(...points.map(p => p.vol)) * 1.15;
  const maxAvg = Math.max(...points.map(p => Math.abs(p.avg))) * 1.3;
  const minAvg = Math.min(...points.map(p => p.avg));
  const rangeY = maxAvg - minAvg || 1;

  function px(v: number) { return padL + (v / maxVol) * cW; }
  function py(v: number) { return padT + ((maxAvg - v) / rangeY) * cH; }

  const zeroY = py(0);

  return (
    <div>
      <div className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: 'var(--text-moon)' }}>
        Risk vs Return (weekly)
      </div>
      <div className="text-xs mb-3" style={{ color: 'var(--text-dim)' }}>
        X = volatility (std dev), Y = avg weekly return
      </div>
      <div className="overflow-x-auto">
        <svg viewBox={`0 0 ${W} ${H}`} style={{ minWidth: 260, width: '100%', height: H }}>
          {/* Grid */}
          {[maxAvg, 0, minAvg].filter(v => isFinite(v)).map((v, i) => (
            <g key={i}>
              <line x1={padL} y1={py(v)} x2={W - padR} y2={py(v)} stroke="rgba(80,60,180,0.1)" strokeWidth="1" />
              <text x={padL - 4} y={py(v) + 3} textAnchor="end" fontSize="7.5" fill="#50508a">
                {v >= 0 ? '+' : ''}{v.toFixed(2)}%
              </text>
            </g>
          ))}
          {/* Zero line */}
          {zeroY > padT && zeroY < padT + cH && (
            <line x1={padL} y1={zeroY} x2={W - padR} y2={zeroY}
              stroke="rgba(139,92,246,0.2)" strokeWidth="1" />
          )}
          {/* Scatter dots */}
          {points.map(p => (
            <g key={p.f.schemeCode}>
              <circle cx={px(p.vol)} cy={py(p.avg)} r="7" fill={p.color} opacity="0.15" />
              <circle cx={px(p.vol)} cy={py(p.avg)} r="4" fill={p.color} opacity="0.9" />
              <text x={px(p.vol)} y={py(p.avg) - 8} textAnchor="middle" fontSize="7.5" fill={p.color}>
                {p.f.schemeName.split(' ').slice(0, 2).join(' ')}
              </text>
            </g>
          ))}
          {/* X axis */}
          <text x={padL + cW / 2} y={H - 4} textAnchor="middle" fontSize="8" fill="#50508a">
            Risk (volatility)  →
          </text>
        </svg>
      </div>
    </div>
  );
}

export default function RiskTab({ data }: Props) {
  const { performance: perf, snapshots } = data;

  if (snapshots.length < 2) {
    return (
      <div className="card p-8 text-center" style={{ color: 'var(--text-moon)' }}>
        <div className="text-4xl mb-3">⚠️</div>
        <div className="font-medium">Need weekly snapshots</div>
        <div className="text-sm mt-1" style={{ color: 'var(--text-dim)' }}>
          Risk metrics are computed from weekly snapshots. 2+ snapshots required.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-bold mb-1" style={{ color: 'var(--text-star)' }}>Risk Analysis</h1>
        <p className="text-sm" style={{ color: 'var(--text-moon)' }}>
          Volatility, drawdown and risk-adjusted returns based on {snapshots.length} weekly snapshots.
        </p>
      </div>

      {/* Risk-return scatter */}
      {snapshots.length >= 3 && (
        <div className="card p-5">
          <RiskReturnChart funds={perf} snapshots={snapshots} />
        </div>
      )}

      {/* Per-fund risk cards */}
      <div>
        <h2 className="text-sm font-semibold uppercase tracking-widest mb-3" style={{ color: 'var(--text-moon)' }}>
          Per-Fund Risk Metrics
        </h2>
        <div className="space-y-3">
          {perf.map((f, fi) => {
            const color  = FUND_COLORS[fi % FUND_COLORS.length];
            const wr     = weekReturns(f.schemeCode, snapshots);
            const avg    = wr.length > 0 ? wr.reduce((a, b) => a + b, 0) / wr.length : null;
            const vol    = wr.length >= 3 ? stdDev(wr) : null;
            const ratio  = vol && avg != null && vol > 0 ? (avg / vol) : null;
            const best   = wr.length > 0 ? Math.max(...wr) : null;
            const worst  = wr.length > 0 ? Math.min(...wr) : null;

            return (
              <div key={f.schemeCode} className="card p-5" style={{ borderLeft: `3px solid ${color}` }}>
                <div className="flex items-start justify-between flex-wrap gap-3 mb-4">
                  <div>
                    <div className="text-[10px] uppercase tracking-wide mb-0.5" style={{ color: 'var(--text-dim)' }}>
                      {f.fundType.replace(/_/g, ' ')}
                    </div>
                    <div className="font-semibold" style={{ color: 'var(--text-star)' }}>
                      {f.schemeName.length > 44 ? f.schemeName.slice(0, 42) + '…' : f.schemeName}
                    </div>
                  </div>
                  <DrawdownLine wr={wr} color={color} />
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { label: 'Volatility',   value: vol    != null ? `±${vol.toFixed(2)}%/wk`   : '—', note: wr.length < 3 ? 'need 3+ snaps' : 'std dev of 1W returns' },
                    { label: 'Avg 1W Return',value: avg    != null ? `${avg >= 0 ? '+' : ''}${avg.toFixed(3)}%` : '—', color: avg != null ? (avg >= 0 ? '#34d399' : '#f87171') : undefined },
                    { label: 'Best Week',    value: best   != null ? `+${best.toFixed(2)}%`    : '—', color: '#34d399' },
                    { label: 'Worst Week',   value: worst  != null ? `${worst.toFixed(2)}%`     : '—', color: '#f87171' },
                  ].map(s => (
                    <div key={s.label} className="card2 p-3">
                      <div className="text-[10px] uppercase tracking-wide mb-1" style={{ color: 'var(--text-dim)' }}>
                        {s.label}
                      </div>
                      <div className="text-sm font-bold tabular-nums" style={{ color: s.color ?? 'var(--text-star)' }}>
                        {s.value}
                      </div>
                      {s.note && <div className="text-[9px] mt-0.5" style={{ color: 'var(--text-dim)' }}>{s.note}</div>}
                    </div>
                  ))}
                </div>
                {ratio !== null && (
                  <div className="mt-3 text-xs" style={{ color: 'var(--text-dim)' }}>
                    Risk-adjusted ratio: <span className="font-semibold" style={{ color: ratio >= 0 ? '#c4b5fd' : '#f87171' }}>{ratio.toFixed(3)}×</span>
                    <span className="ml-1">(higher = better return per unit of risk)</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="text-xs text-center" style={{ color: 'var(--text-dim)' }}>
        Risk metrics computed from {snapshots.length} weekly snapshot{snapshots.length !== 1 ? 's' : ''}. More history = more reliable estimates.
      </div>
    </div>
  );
}
