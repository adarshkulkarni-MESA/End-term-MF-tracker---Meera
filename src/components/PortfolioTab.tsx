'use client';

import { DashboardData, FundPerf, Snapshot } from '@/app/page';

interface Props { data: DashboardData }

const FUND_COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ec4899', '#14b8a6'];

const TYPE_LABELS: Record<string, string> = {
  large_cap:     'Large Cap',
  mid_cap:       'Mid Cap',
  small_cap:     'Small Cap',
  international: 'International',
  short_debt:    'Short Debt',
  flexi_cap:     'Flexi Cap',
};

/* ── Donut chart ─────────────────────────────────────────────── */
function DonutChart({ perf }: { perf: FundPerf[] }) {
  if (perf.length === 0) return null;

  const W = 180, cx = 90, cy = 90, r = 60, sw = 22;
  const circumference = 2 * Math.PI * r;
  const total = perf.length;

  let offset = 0;
  const slices = perf.map((f, i) => {
    const pct  = 1 / total;
    const dash = pct * circumference;
    const gap  = circumference - dash;
    const slice = { f, color: FUND_COLORS[i % FUND_COLORS.length], dash, gap, offset };
    offset += dash;
    return slice;
  });

  return (
    <div className="flex flex-col items-center">
      <svg viewBox={`0 0 ${W} ${W}`} style={{ width: 140, height: 140 }}>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(80,60,180,0.1)" strokeWidth={sw} />
        {slices.map(s => (
          <circle key={s.f.schemeCode} cx={cx} cy={cy} r={r} fill="none"
            stroke={s.color} strokeWidth={sw}
            strokeDasharray={`${s.dash - 2} ${s.gap + 2}`}
            strokeDashoffset={circumference / 4 - s.offset}
            style={{ transition: 'stroke-dasharray 0.6s ease' }} />
        ))}
        {/* Center */}
        <text x={cx} y={cy - 4} textAnchor="middle" fontSize="9" fill="#9898b8">Funds</text>
        <text x={cx} y={cy + 10} textAnchor="middle" fontSize="18" fontWeight="700" fill="#eeeeff">{total}</text>
      </svg>
      <div className="space-y-1 mt-1 w-full">
        {slices.map(s => (
          <div key={s.f.schemeCode} className="flex items-center gap-2 text-xs">
            <div className="w-2 h-2 rounded-full shrink-0" style={{ background: s.color }} />
            <span className="truncate" style={{ color: '#9898b8' }}>
              {TYPE_LABELS[s.f.fundType] ?? s.f.fundType.replace(/_/g, ' ')}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Cumulative growth line chart ────────────────────────────── */
function GrowthChart({ snapshots, funds }: { snapshots: Snapshot[]; funds: FundPerf[] }) {
  if (snapshots.length < 2) {
    return (
      <div className="text-center py-8 text-xs" style={{ color: 'var(--text-dim)' }}>
        Need 2+ weekly snapshots to show growth lines.
      </div>
    );
  }

  const sorted = [...snapshots].sort((a, b) => a.week_date.localeCompare(b.week_date));

  const lines = funds.slice(0, 5).map((fund, fi) => {
    let idx = 100;
    const points = sorted.map(snap => {
      const f = snap.data.funds?.find(x => x.schemeCode === fund.schemeCode);
      if (f?.weekReturn !== null && f?.weekReturn !== undefined) idx *= (1 + f.weekReturn / 100);
      return idx;
    });
    return { fund, points, color: FUND_COLORS[fi % FUND_COLORS.length] };
  });

  const W = 480, H = 200;
  const padL = 44, padR = 12, padT = 14, padB = 28;
  const cW = W - padL - padR, cH = H - padT - padB;

  const allVals = lines.flatMap(l => l.points).filter(isFinite);
  const minV = Math.min(...allVals, 95), maxV = Math.max(...allVals, 105);
  const range = maxV - minV || 1;

  function px(i: number) { return padL + (i / (sorted.length - 1)) * cW; }
  function py(v: number)  { return padT + ((maxV - v) / range) * cH; }

  const yTicks = [maxV, (maxV + minV) / 2, minV];
  const xIdx   = [0, Math.floor(sorted.length / 2), sorted.length - 1];

  return (
    <div>
      <div className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: 'var(--text-moon)' }}>
        Portfolio Growth Index (Base 100)
      </div>
      <div className="flex flex-wrap gap-4 mb-2">
        {lines.map(l => (
          <div key={l.fund.schemeCode} className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--text-moon)' }}>
            <div className="w-4 h-px rounded" style={{ background: l.color }} />
            {l.fund.schemeName.split(' ').slice(0, 3).join(' ')}
          </div>
        ))}
      </div>
      <div className="overflow-x-auto">
        <svg viewBox={`0 0 ${W} ${H}`} style={{ minWidth: 280, width: '100%', height: H }}>
          <defs>
            {lines.map((l, i) => (
              <linearGradient key={l.fund.schemeCode} id={`pf${i}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%"   stopColor={l.color} stopOpacity="0.16" />
                <stop offset="100%" stopColor={l.color} stopOpacity="0.01" />
              </linearGradient>
            ))}
          </defs>

          {yTicks.map((v, i) => (
            <g key={i}>
              <line x1={padL} y1={py(v)} x2={W - padR} y2={py(v)} stroke="rgba(80,60,180,0.1)" strokeWidth="1" />
              <text x={padL - 4} y={py(v) + 3} textAnchor="end" fontSize="8" fill="#50508a">{v.toFixed(0)}</text>
            </g>
          ))}

          {minV < 100 && maxV > 100 && (
            <line x1={padL} y1={py(100)} x2={W - padR} y2={py(100)}
              stroke="rgba(139,92,246,0.2)" strokeWidth="1" strokeDasharray="4 3" />
          )}

          {lines.map((l, fi) => {
            const pts = l.points.map((v, i) => ({ x: px(i), y: py(v) }));
            if (pts.length < 2) return null;
            const lp = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');
            const ap = `${lp} L ${pts[pts.length-1].x} ${padT+cH} L ${pts[0].x} ${padT+cH} Z`;
            const ep = pts[pts.length - 1];
            return (
              <g key={l.fund.schemeCode}>
                <path d={ap} fill={`url(#pf${fi})`} />
                <path d={lp} fill="none" stroke={l.color} strokeWidth="2"
                  strokeLinecap="round" strokeLinejoin="round" />
                <circle cx={ep.x} cy={ep.y} r="3" fill={l.color} />
              </g>
            );
          })}

          {xIdx.map(i => (
            <text key={i} x={px(i)} y={H - 4} textAnchor="middle" fontSize="8" fill="#50508a">
              {new Date(sorted[i].week_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
            </text>
          ))}
        </svg>
      </div>
    </div>
  );
}

export default function PortfolioTab({ data }: Props) {
  const { performance: perf, snapshots } = data;

  const avgYtd  = perf.length > 0 ? perf.reduce((s, f) => s + (f.ytdReturn ?? 0), 0) / perf.length : null;
  const avg1M   = perf.length > 0 ? perf.reduce((s, f) => s + (f.monthReturn ?? 0), 0) / perf.length : null;
  const best    = perf.reduce((b, f) => (f.weekReturn ?? -Infinity) > (b?.weekReturn ?? -Infinity) ? f : b, perf[0] ?? null);

  const stats = [
    { label: 'Funds Tracked', value: perf.length.toString(),                                             sub: 'active funds' },
    { label: 'Avg YTD',       value: avgYtd  != null ? `${avgYtd  >= 0 ? '+' : ''}${avgYtd.toFixed(2)}%`  : '—', sub: 'year-to-date',  color: avgYtd  != null ? (avgYtd  >= 0 ? '#34d399' : '#f87171') : undefined },
    { label: 'Avg 1-Month',   value: avg1M   != null ? `${avg1M   >= 0 ? '+' : ''}${avg1M.toFixed(2)}%`   : '—', sub: 'last 30 days',  color: avg1M   != null ? (avg1M   >= 0 ? '#34d399' : '#f87171') : undefined },
    { label: 'Best This Week',value: best?.weekReturn != null ? `+${best.weekReturn.toFixed(2)}%`          : '—', sub: best ? best.schemeName.split(' ').slice(0,3).join(' ') : '—', color: '#34d399' },
  ];

  if (perf.length === 0) {
    return (
      <div className="card p-8 text-center" style={{ color: 'var(--text-moon)' }}>
        <div className="text-4xl mb-3">💹</div>
        <div className="font-medium">No fund data yet</div>
        <div className="text-sm mt-1" style={{ color: 'var(--text-dim)' }}>Run the daily pipeline to fetch NAV data.</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {stats.map((s, i) => (
          <div key={i} className="card2 p-4">
            <div className="text-[10px] uppercase tracking-widest mb-1.5" style={{ color: 'var(--text-dim)' }}>{s.label}</div>
            <div className="text-xl font-bold tabular-nums" style={{ color: s.color ?? 'var(--text-star)' }}>{s.value}</div>
            <div className="text-[10px] mt-0.5 truncate" style={{ color: 'var(--text-dim)' }}>{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Allocation + growth */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card p-5">
          <div className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: 'var(--text-moon)' }}>
            Allocation
          </div>
          <DonutChart perf={perf} />
        </div>
        <div className="card p-5 sm:col-span-2">
          <GrowthChart snapshots={snapshots} funds={perf} />
        </div>
      </div>

      {/* Fund cards */}
      <div>
        <h2 className="text-sm font-semibold uppercase tracking-widest mb-3" style={{ color: 'var(--text-moon)' }}>
          Fund Overview
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {perf.map((f, fi) => {
            const color = FUND_COLORS[fi % FUND_COLORS.length];
            return (
              <div key={f.schemeCode} className="card2 p-4" style={{ borderLeft: `3px solid ${color}` }}>
                <div className="text-[10px] uppercase tracking-wide mb-0.5" style={{ color: 'var(--text-dim)' }}>
                  {TYPE_LABELS[f.fundType] ?? f.fundType}
                </div>
                <div className="text-sm font-semibold mb-1 leading-tight" style={{ color: 'var(--text-star)' }}>
                  {f.schemeName.length > 40 ? f.schemeName.slice(0, 38) + '…' : f.schemeName}
                </div>
                {f.currentNav && (
                  <div className="text-xs mb-3" style={{ color: 'var(--text-dim)' }}>NAV: ₹{f.currentNav.toFixed(2)}</div>
                )}
                <div className="grid grid-cols-3 gap-1 text-center">
                  {[
                    { label: '1W', val: f.weekReturn },
                    { label: '1M', val: f.monthReturn },
                    { label: 'YTD', val: f.ytdReturn },
                  ].map(({ label, val }) => (
                    <div key={label}>
                      <div className="text-[10px] mb-0.5" style={{ color: 'var(--text-dim)' }}>{label}</div>
                      {val !== null
                        ? <div className={`text-xs font-semibold tabular-nums ${val >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                            {val >= 0 ? '+' : ''}{val.toFixed(2)}%
                          </div>
                        : <div className="text-xs" style={{ color: 'var(--text-dim)' }}>—</div>}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
