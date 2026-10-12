'use client';

import { DashboardData, Snapshot, FundPerf } from '@/app/page';

interface Props { data: DashboardData; onNavigate: (tab: string) => void }

const QUICK_LINKS = [
  { id: 'week',        icon: '📊', label: 'This Week',           desc: 'Latest returns & AI verdict' },
  { id: 'screener',    icon: '🔍', label: 'Stock Screener',      desc: 'PE, D/E, ROE of top stocks' },
  { id: 'sip',         icon: '🧮', label: 'SIP Calculator',      desc: 'Plan your monthly investment' },
  { id: 'performance', icon: '⚡', label: 'Performance Tracker', desc: 'Calculate CAGR on any NAV' },
  { id: 'news',        icon: '📰', label: 'Market News',         desc: 'Latest market headlines' },
  { id: 'portfolio',   icon: '💹', label: 'Portfolio',           desc: 'Allocation & growth overview' },
];

const FUND_COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ec4899', '#14b8a6'];

/* ── Reference-style Growth Line Chart ──────────────────────────── */
function PortfolioGrowthChart({ snapshots, funds }: { snapshots: Snapshot[]; funds: FundPerf[] }) {
  if (snapshots.length < 2) return (
    <div className="text-center py-8 text-gray-600 text-xs">
      Need 2+ weekly snapshots to show growth trend.
    </div>
  );

  const sorted = [...snapshots].sort((a, b) => a.week_date.localeCompare(b.week_date));

  /* Compute cumulative index (starts at 100) for each fund */
  const lines = funds.slice(0, 5).map((fund, fi) => {
    let idx = 100;
    const points = sorted.map(snap => {
      const f = snap.data.funds?.find(x => x.schemeCode === fund.schemeCode);
      if (f?.weekReturn !== null && f?.weekReturn !== undefined) {
        idx *= (1 + f.weekReturn / 100);
      }
      return idx;
    });
    return { fund, points, color: FUND_COLORS[fi % FUND_COLORS.length] };
  });

  const W = 500, H = 200;
  const padL = 44, padR = 16, padT = 16, padB = 28;
  const cW   = W - padL - padR;
  const cH   = H - padT - padB;

  const allVals = lines.flatMap(l => l.points).filter(isFinite);
  if (allVals.length === 0) return null;

  const minV  = Math.min(...allVals, 90);
  const maxV  = Math.max(...allVals, 105);
  const range = maxV - minV || 1;

  function px(i: number) { return padL + (i / (sorted.length - 1)) * cW; }
  function py(v: number)  { return padT + ((maxV - v) / range) * cH; }

  const yTicks = [maxV, maxV * 0.66 + minV * 0.34, minV].filter(isFinite);
  const xLabels = [0, Math.floor(sorted.length / 2), sorted.length - 1]
    .filter((v, i, a) => a.indexOf(v) === i);

  return (
    <div>
      <div className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: 'var(--text-moon)' }}>
        Portfolio Growth Index (Base = 100)
      </div>
      <div className="flex flex-wrap gap-4 mb-3">
        {lines.map(l => (
          <div key={l.fund.schemeCode} className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--text-moon)' }}>
            <div className="w-4 h-0.5 rounded" style={{ background: l.color }} />
            <span className="truncate max-w-[90px]">{l.fund.schemeName.split(' ').slice(0,3).join(' ')}</span>
          </div>
        ))}
      </div>
      <div className="overflow-x-auto">
        <svg viewBox={`0 0 ${W} ${H}`} style={{ minWidth: 280, width: '100%', height: H }}>
          <defs>
            {lines.map((l, i) => (
              <linearGradient key={l.fund.schemeCode} id={`hgFill${i}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%"   stopColor={l.color} stopOpacity="0.18" />
                <stop offset="100%" stopColor={l.color} stopOpacity="0.01" />
              </linearGradient>
            ))}
          </defs>

          {/* Grid lines */}
          {yTicks.map((v, i) => (
            <g key={i}>
              <line x1={padL} y1={py(v)} x2={W - padR} y2={py(v)} stroke="rgba(80,60,180,0.12)" strokeWidth="1" />
              <text x={padL - 4} y={py(v) + 3} textAnchor="end" fontSize="8" fill="#50508a">
                {v.toFixed(0)}
              </text>
            </g>
          ))}

          {/* Base line at 100 */}
          {minV < 100 && maxV > 100 && (
            <line x1={padL} y1={py(100)} x2={W - padR} y2={py(100)}
              stroke="rgba(139,92,246,0.25)" strokeWidth="1" strokeDasharray="4 3" />
          )}

          {/* Lines per fund */}
          {lines.map((l, fi) => {
            const pts = l.points
              .map((v, i) => ({ x: px(i), y: py(v) }))
              .filter(p => isFinite(p.x) && isFinite(p.y));
            if (pts.length < 2) return null;

            const linePath  = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');
            const areaPath  = `${linePath} L ${pts[pts.length - 1].x} ${padT + cH} L ${pts[0].x} ${padT + cH} Z`;
            const last      = pts[pts.length - 1];

            return (
              <g key={l.fund.schemeCode}>
                <path d={areaPath} fill={`url(#hgFill${fi})`} />
                <path d={linePath} fill="none" stroke={l.color} strokeWidth="2"
                  strokeLinecap="round" strokeLinejoin="round"
                  className="chart-line-animated" />
                <circle cx={last.x} cy={last.y} r="3" fill={l.color} />
                <circle cx={last.x} cy={last.y} r="6" fill={l.color} opacity="0.15" />
              </g>
            );
          })}

          {/* X-axis labels */}
          {xLabels.map(i => (
            <text key={i} x={px(i)} y={H - 5} textAnchor="middle" fontSize="8" fill="#50508a">
              {new Date(sorted[i].week_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
            </text>
          ))}
        </svg>
      </div>
    </div>
  );
}

/* ── YTD bars ─────────────────────────────────────────────────── */
function FundBars({ perf }: { perf: DashboardData['performance'] }) {
  if (perf.length === 0) return null;
  const max = Math.max(...perf.map(f => Math.abs(f.ytdReturn ?? 0)), 1);
  return (
    <div className="space-y-3 mt-3">
      {perf.map((f, fi) => {
        const val   = f.ytdReturn ?? 0;
        const pct   = (Math.abs(val) / max) * 100;
        const pos   = val >= 0;
        const color = FUND_COLORS[fi % FUND_COLORS.length];
        return (
          <div key={f.schemeCode}>
            <div className="flex justify-between text-xs mb-1">
              <span style={{ color: 'var(--text-moon)' }} className="truncate max-w-[65%]">
                {f.schemeName.split(' ').slice(0, 5).join(' ')}
              </span>
              <span className={`font-semibold tabular-nums ${pos ? 'text-emerald-400' : 'text-red-400'}`}>
                {val > 0 ? '+' : ''}{val.toFixed(2)}%
              </span>
            </div>
            <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(30,20,60,0.8)' }}>
              <div className="h-full rounded-full transition-all duration-700"
                style={{ width: `${pct}%`, background: color, opacity: 0.85 }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function HomeTab({ data, onNavigate }: Props) {
  const perf     = data.performance;
  const avgYtd   = perf.length > 0
    ? perf.reduce((s, f) => s + (f.ytdReturn ?? 0), 0) / perf.length
    : null;
  const bestWeek = perf.length > 0
    ? perf.reduce((best, f) => ((f.weekReturn ?? -Infinity) > (best ?? -Infinity) ? f.weekReturn : best), null as number | null)
    : null;
  const bestFund = bestWeek !== null ? perf.find(f => f.weekReturn === bestWeek) : null;

  const stats = [
    { label: 'Active Funds',   value: perf.length.toString(),
      sub: 'being tracked' },
    { label: 'Avg YTD Return', value: avgYtd  != null ? `${avgYtd  >= 0 ? '+' : ''}${avgYtd.toFixed(2)}%`  : '—',
      sub: 'year to date',  color: avgYtd  != null ? (avgYtd  >= 0 ? '#34d399' : '#f87171') : undefined },
    { label: 'Best 1W',        value: bestWeek != null && isFinite(bestWeek) ? `+${bestWeek.toFixed(2)}%` : '—',
      sub: bestFund ? bestFund.schemeName.split(' ').slice(0,3).join(' ') : 'this week', color: '#34d399' },
    { label: 'Last Pipeline',  value: data.lastRun
        ? new Date(data.lastRun.run_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
        : '—',
      sub: data.lastRun?.status ?? 'pending' },
  ];

  return (
    <div className="space-y-6" style={{ position: 'relative', zIndex: 1 }}>

      {/* ── Hero ─────────────────────────────────────────────────────── */}
      <div className="relative rounded-2xl overflow-hidden p-7 sm:p-10"
        style={{ background: 'linear-gradient(135deg, #06061c 0%, #110a30 40%, #0a1428 100%)' }}>

        {/* Decorative orbit rings */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 700 320" preserveAspectRatio="xMidYMid slice">
          {/* Faint grid */}
          {[70, 140, 210, 280].map(y => (
            <line key={`h${y}`} x1="0" y1={y} x2="700" y2={y} stroke="#3730a3" strokeWidth="0.35" opacity="0.3" />
          ))}
          {[100, 200, 300, 400, 500, 600].map(x => (
            <line key={`v${x}`} x1={x} y1="0" x2={x} y2="320" stroke="#3730a3" strokeWidth="0.35" opacity="0.3" />
          ))}
          {/* Planet circle */}
          <circle cx="580" cy="60" r="38" fill="none" stroke="#4f46e5" strokeWidth="0.5" opacity="0.4" />
          <circle cx="580" cy="60" r="28" fill="rgba(79,70,229,0.06)" />
          <circle cx="580" cy="60" r="10" fill="rgba(139,92,246,0.25)" />
          {/* Orbit ellipse */}
          <ellipse cx="580" cy="60" rx="70" ry="22" fill="none" stroke="#6366f1" strokeWidth="0.4" opacity="0.25" strokeDasharray="3 4" />
          {/* Growth chart line */}
          <defs>
            <linearGradient id="heroLine" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%"   stopColor="#818cf8" stopOpacity="0.2" />
              <stop offset="60%"  stopColor="#818cf8" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#34d399" stopOpacity="0.9" />
            </linearGradient>
            <linearGradient id="heroFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%"   stopColor="#6366f1" stopOpacity="0.15" />
              <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
            </linearGradient>
          </defs>
          {/* Main growth curve — squiggly upward like BofA chart */}
          <path d="M0,295 C50,285 80,270 120,250 C160,230 175,240 210,215
                   C245,190 260,195 295,170 C330,145 345,155 380,128
                   C415,100 430,112 465,88 C500,64 520,75 550,52 C570,40 600,30 700,18"
            fill="none" stroke="url(#heroLine)" strokeWidth="2.5" strokeLinecap="round" />
          <path d="M0,295 C50,285 80,270 120,250 C160,230 175,240 210,215
                   C245,190 260,195 295,170 C330,145 345,155 380,128
                   C415,100 430,112 465,88 C500,64 520,75 550,52 C570,40 600,30 700,18 L700,320 L0,320 Z"
            fill="url(#heroFill)" />
          {/* Terminal dot */}
          <circle cx="700" cy="18" r="5" fill="#34d399" opacity="0.9" />
          <circle cx="700" cy="18" r="10" fill="#34d399" opacity="0.15" />
          {/* Secondary line (benchmark) */}
          <path d="M0,310 C100,298 200,282 320,262 C440,242 560,222 700,205"
            fill="none" stroke="#4f46e5" strokeWidth="1" strokeDasharray="5 4" opacity="0.35" />
        </svg>

        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-3">
            <div className="text-xs uppercase tracking-widest" style={{ color: 'rgba(165,148,255,0.7)' }}>Meera's Portfolio</div>
            <div className="px-2 py-0.5 rounded-full text-[10px] font-semibold tracking-wide"
              style={{ background: 'rgba(139,92,246,0.18)', border: '1px solid rgba(139,92,246,0.3)', color: '#c4b5fd' }}>
              LIVE
            </div>
          </div>
          <div className="text-2xl sm:text-4xl font-bold text-white mb-1 leading-tight" style={{ textWrap: 'balance' }}>
            Mutual Fund Intelligence
          </div>
          <div className="text-sm mb-7" style={{ color: 'rgba(165,148,255,0.45)' }}>
            {perf.length} fund{perf.length !== 1 ? 's' : ''} tracked · auto-updated daily
          </div>

          {/* Stat tiles */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {stats.map((s, i) => (
              <div key={i} className="rounded-xl p-4 transition-colors"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', backdropFilter: 'blur(8px)' }}>
                <div className="text-[10px] uppercase tracking-widest mb-1.5" style={{ color: 'rgba(165,148,255,0.55)' }}>
                  {s.label}
                </div>
                <div className="text-xl font-bold tabular-nums glow-text" style={{ color: s.color ?? '#ffffff' }}>
                  {s.value}
                </div>
                <div className="text-[10px] mt-0.5 truncate" style={{ color: 'rgba(165,148,255,0.35)' }}>
                  {s.sub}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Portfolio Growth Line Chart ───────────────────────────── */}
      {data.snapshots.length >= 2 && (
        <div className="card p-5">
          <PortfolioGrowthChart snapshots={data.snapshots} funds={perf} />
        </div>
      )}

      {/* ── YTD bar chart ─────────────────────────────────────────── */}
      {perf.length > 0 && (
        <div className="card p-5">
          <div className="text-xs font-semibold uppercase tracking-widest mb-0.5" style={{ color: 'var(--text-moon)' }}>
            YTD Performance
          </div>
          <div className="text-xs mb-0.5" style={{ color: 'var(--text-dim)' }}>Year-to-date return per fund</div>
          <FundBars perf={perf} />
        </div>
      )}

      {/* ── Latest verdict ────────────────────────────────────────── */}
      {data.latestReport && (
        <div className="card p-5" style={{ borderLeft: '2px solid #8b5cf6' }}>
          <div className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: 'var(--text-moon)' }}>
            Latest AI Verdict
          </div>
          <div className="text-sm font-bold mb-1" style={{ color: '#c4b5fd' }}>{data.latestReport.verdict}</div>
          <p className="text-sm leading-relaxed" style={{ color: 'var(--text-moon)' }}>{data.latestReport.reason}</p>
          <button onClick={() => onNavigate('week')}
            className="mt-3 text-xs transition-colors hover:text-indigo-300" style={{ color: '#8b5cf6' }}>
            View full report →
          </button>
        </div>
      )}

      {/* ── Quick links ───────────────────────────────────────────── */}
      <div>
        <div className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: 'var(--text-moon)' }}>
          Quick Access
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {QUICK_LINKS.map(lk => (
            <button key={lk.id} onClick={() => onNavigate(lk.id)}
              className="card2 p-4 text-left transition-all group hover:border-indigo-500/40">
              <div className="text-2xl mb-2">{lk.icon}</div>
              <div className="text-sm font-semibold transition-colors group-hover:text-indigo-300" style={{ color: 'var(--text-star)' }}>
                {lk.label}
              </div>
              <div className="text-xs mt-0.5 leading-relaxed" style={{ color: 'var(--text-dim)' }}>
                {lk.desc}
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
