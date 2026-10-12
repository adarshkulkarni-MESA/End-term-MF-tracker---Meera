'use client';

import { DashboardData } from '@/app/page';

interface Props { data: DashboardData; onNavigate: (tab: string) => void }

const QUICK_LINKS = [
  { id: 'week',        icon: '📊', label: 'This Week',           desc: 'Latest returns & AI verdict' },
  { id: 'screener',    icon: '🔍', label: 'Stock Screener',      desc: 'PE, D/E, ROE of top stocks' },
  { id: 'sip',         icon: '🧮', label: 'SIP Calculator',      desc: 'Plan your monthly investment' },
  { id: 'performance', icon: '⚡', label: 'Performance Tracker', desc: 'Calculate CAGR on any NAV' },
  { id: 'news',        icon: '📰', label: 'Market News',         desc: 'Latest market headlines' },
  { id: 'charts',      icon: '📉', label: 'Top Charts',          desc: 'Sparklines for major stocks' },
];

const PERIOD_COLORS = { pos: '#10b981', neg: '#ef4444', bench: '#6366f1', cat: '#f59e0b' };

function ReturnComparisonChart({ perf }: { perf: DashboardData['performance'] }) {
  if (perf.length === 0) return null;

  const periods: { key: 'weekReturn' | 'monthReturn' | 'ytdReturn'; label: string }[] = [
    { key: 'weekReturn',  label: '1W' },
    { key: 'monthReturn', label: '1M' },
    { key: 'ytdReturn',   label: 'YTD' },
  ];

  const W = 320, H = 160;
  const padL = 8, padR = 8, padT = 12, padB = 24;
  const cW = W - padL - padR;
  const cH = H - padT - padB;

  // one group per period, each group has one bar per fund
  const numGroups = 3;
  const numFunds  = perf.length;
  const groupW    = cW / numGroups;
  const barW      = Math.min(18, (groupW * 0.75) / numFunds);
  const barGap    = 2;

  const allVals = perf.flatMap(f => [f.weekReturn ?? 0, f.monthReturn ?? 0, f.ytdReturn ?? 0]);
  const maxAbs  = Math.max(...allVals.map(Math.abs), 1);
  const minV    = Math.min(...allVals, 0);
  const maxV    = Math.max(...allVals, 0);
  const range   = maxV - minV || 1;

  function py(v: number) {
    return padT + ((maxV - v) / range) * cH;
  }
  const zeroY = py(0);

  const fundColors = ['#6366f1', '#10b981', '#f59e0b', '#ec4899', '#14b8a6'];

  return (
    <div>
      <div className="text-xs text-gray-500 uppercase tracking-widest font-semibold mb-1">Period Returns by Fund</div>
      <div className="flex gap-3 flex-wrap mb-2">
        {perf.map((f, i) => (
          <div key={f.schemeCode} className="flex items-center gap-1 text-xs text-gray-500">
            <div className="w-2 h-2 rounded-sm shrink-0" style={{ background: fundColors[i % fundColors.length] }} />
            <span className="truncate max-w-[120px]">{f.schemeName.split(' ').slice(0, 3).join(' ')}</span>
          </div>
        ))}
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: 160 }}>
        {/* grid lines */}
        {[maxV, maxV / 2, 0, minV / 2, minV].filter((v, i, arr) => arr.indexOf(v) === i && Math.abs(v) > 0.01).map((v, i) => (
          <g key={i}>
            <line x1={padL} y1={py(v)} x2={W - padR} y2={py(v)} stroke="#1e2038" strokeWidth="1" />
            <text x={padL - 2} y={py(v) + 3} textAnchor="end" fontSize="7" fill="#4b5563">
              {v > 0 ? '+' : ''}{v.toFixed(1)}
            </text>
          </g>
        ))}
        {/* zero line */}
        <line x1={padL} y1={zeroY} x2={W - padR} y2={zeroY} stroke="#374151" strokeWidth="1" />

        {/* bars */}
        {periods.map((period, gi) => {
          const totalW = numFunds * barW + (numFunds - 1) * barGap;
          const groupX = padL + gi * groupW + (groupW - totalW) / 2;
          return (
            <g key={period.key}>
              {perf.map((f, fi) => {
                const val = f[period.key] ?? 0;
                const x   = groupX + fi * (barW + barGap);
                const y   = val >= 0 ? py(val) : zeroY;
                const bh  = Math.max(2, Math.abs(py(val) - zeroY));
                return (
                  <rect key={f.schemeCode} x={x} y={y} width={barW} height={bh} rx="2"
                    fill={fundColors[fi % fundColors.length]} opacity="0.85" />
                );
              })}
              <text x={padL + gi * groupW + groupW / 2} y={H - 6}
                textAnchor="middle" fontSize="10" fill="#9ca3af" fontWeight="600">
                {period.label}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

function FundBars({ perf }: { perf: DashboardData['performance'] }) {
  if (perf.length === 0) return null;
  const max = Math.max(...perf.map(f => Math.abs(f.ytdReturn ?? 0)), 1);
  return (
    <div className="space-y-3 mt-3">
      {perf.map(f => {
        const val = f.ytdReturn ?? 0;
        const pct = (Math.abs(val) / max) * 100;
        const pos = val >= 0;
        return (
          <div key={f.schemeCode}>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-gray-400 truncate max-w-[65%]">
                {f.schemeName.split(' ').slice(0, 5).join(' ')}
              </span>
              <span className={pos ? 'text-emerald-400 font-semibold tabular-nums' : 'text-red-400 font-semibold tabular-nums'}>
                {val > 0 ? '+' : ''}{val.toFixed(2)}%
              </span>
            </div>
            <div className="h-1.5 bg-[#1a1a2e] rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-700 ${pos ? 'bg-emerald-500' : 'bg-red-500'}`}
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function HomeTab({ data, onNavigate }: Props) {
  const perf    = data.performance;
  const avgYtd  = perf.length > 0
    ? perf.reduce((s, f) => s + (f.ytdReturn ?? 0), 0) / perf.length
    : null;
  const bestWeek = perf.length > 0
    ? perf.reduce((best, f) => (f.weekReturn ?? -Infinity) > (best ?? -Infinity) ? f.weekReturn : best, null as number | null)
    : null;
  const bestFund = bestWeek !== null ? perf.find(f => f.weekReturn === bestWeek) : null;

  const stats = [
    { label: 'Active Funds',   value: perf.length.toString(),                                                                       sub: 'being tracked' },
    { label: 'Avg YTD Return', value: avgYtd  != null ? `${avgYtd  >= 0 ? '+' : ''}${avgYtd.toFixed(2)}%`         : '—',           sub: 'year to date',  color: avgYtd  != null ? (avgYtd  >= 0 ? 'text-emerald-400' : 'text-red-400') : undefined },
    { label: 'Best 1W',        value: bestWeek != null && isFinite(bestWeek) ? `+${bestWeek.toFixed(2)}%`           : '—',           sub: bestFund ? bestFund.schemeName.split(' ').slice(0,3).join(' ') : 'this week', color: 'text-emerald-400' },
    { label: 'Last Pipeline',  value: data.lastRun ? new Date(data.lastRun.run_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : '—', sub: data.lastRun?.status ?? 'pending' },
  ];

  return (
    <div className="space-y-6">
      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <div
        className="relative rounded-2xl overflow-hidden p-7 sm:p-10"
        style={{ background: 'linear-gradient(135deg, #0a0820 0%, #1e1b4b 50%, #0f172a 100%)' }}
      >
        {/* decorative SVG chart lines */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 700 320" preserveAspectRatio="xMidYMid slice">
          {[70, 140, 210, 280].map(y => (
            <line key={`h${y}`} x1="0" y1={y} x2="700" y2={y} stroke="#4f46e5" strokeWidth="0.4" opacity="0.25" />
          ))}
          {[100, 200, 300, 400, 500, 600].map(x => (
            <line key={`v${x}`} x1={x} y1="0" x2={x} y2="320" stroke="#4f46e5" strokeWidth="0.4" opacity="0.25" />
          ))}
          {/* main chart line */}
          <defs>
            <linearGradient id="heroLineGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%"   stopColor="#818cf8" stopOpacity="0.3" />
              <stop offset="60%"  stopColor="#818cf8" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#34d399" stopOpacity="0.9" />
            </linearGradient>
            <linearGradient id="heroFillGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%"   stopColor="#6366f1" stopOpacity="0.18" />
              <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d="M0,290 C80,270 140,240 220,190 C300,145 360,120 440,85 C520,55 600,38 700,22"
            fill="none" stroke="url(#heroLineGrad)" strokeWidth="2.5" strokeLinecap="round" />
          <path d="M0,290 C80,270 140,240 220,190 C300,145 360,120 440,85 C520,55 600,38 700,22 L700,320 L0,320 Z"
            fill="url(#heroFillGrad)" />
          {/* secondary line */}
          <path d="M0,310 C100,295 200,278 320,255 C440,232 560,210 700,195"
            fill="none" stroke="#4f46e5" strokeWidth="1.2" strokeLinecap="round" strokeDasharray="6 4" opacity="0.4" />
          {/* terminal dot */}
          <circle cx="700" cy="22" r="5" fill="#34d399" opacity="0.9" />
          <circle cx="700" cy="22" r="10" fill="#34d399" opacity="0.15" />
        </svg>

        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-3">
            <div className="text-xs text-indigo-300/80 uppercase tracking-widest">Meera's Portfolio</div>
            <div className="px-2 py-0.5 rounded-full bg-indigo-500/20 border border-indigo-500/30 text-[10px] text-indigo-300 font-semibold tracking-wide">
              LIVE
            </div>
          </div>
          <div className="text-2xl sm:text-4xl font-bold text-white mb-1 leading-tight" style={{ textWrap: 'balance' }}>
            Mutual Fund Intelligence
          </div>
          <div className="text-indigo-200/50 text-sm mb-7">
            {perf.length} fund{perf.length !== 1 ? 's' : ''} tracked · auto-updated daily
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {stats.map((s, i) => (
              <div key={i} className="rounded-xl p-4 bg-white/[0.05] backdrop-blur-sm border border-white/[0.08] hover:bg-white/[0.08] transition-colors">
                <div className="text-[10px] text-indigo-300/70 uppercase tracking-widest mb-1.5">{s.label}</div>
                <div className={`text-xl font-bold tabular-nums ${s.color ?? 'text-white'}`}>{s.value}</div>
                <div className="text-[10px] text-indigo-200/40 mt-0.5 truncate">{s.sub}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Multi-period return chart ─────────────────────────────────── */}
      {perf.length > 0 && (
        <div className="card p-5">
          <ReturnComparisonChart perf={perf} />
        </div>
      )}

      {/* ── YTD horizontal bars ───────────────────────────────────────── */}
      {perf.length > 0 && (
        <div className="card p-5">
          <div className="text-xs text-gray-500 uppercase tracking-widest font-semibold mb-0.5">YTD Performance</div>
          <div className="text-xs text-gray-600">Year-to-date return per fund</div>
          <FundBars perf={perf} />
        </div>
      )}

      {/* ── Latest verdict ────────────────────────────────────────────── */}
      {data.latestReport && (
        <div className="card p-5 border-l-2 border-indigo-500">
          <div className="text-xs text-gray-500 uppercase tracking-widest font-semibold mb-2">Latest AI Verdict</div>
          <div className="text-sm font-bold text-indigo-300 mb-1">{data.latestReport.verdict}</div>
          <p className="text-sm text-gray-400 leading-relaxed">{data.latestReport.reason}</p>
          <button onClick={() => onNavigate('week')} className="mt-3 text-xs text-indigo-400 hover:text-indigo-300 transition-colors">
            View full report →
          </button>
        </div>
      )}

      {/* ── Quick links ───────────────────────────────────────────────── */}
      <div>
        <div className="text-xs text-gray-500 uppercase tracking-widest font-semibold mb-3">Quick Access</div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {QUICK_LINKS.map(lk => (
            <button
              key={lk.id}
              onClick={() => onNavigate(lk.id)}
              className="card2 p-4 text-left hover:border-indigo-500/40 transition-all group"
            >
              <div className="text-2xl mb-2">{lk.icon}</div>
              <div className="text-sm font-semibold text-gray-200 group-hover:text-indigo-300 transition-colors">{lk.label}</div>
              <div className="text-xs text-gray-600 mt-0.5 leading-relaxed">{lk.desc}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
