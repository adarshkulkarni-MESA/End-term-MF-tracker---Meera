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
              <span className={pos ? 'text-emerald-400 font-semibold' : 'text-red-400 font-semibold'}>
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
    ? Math.max(...perf.map(f => f.weekReturn ?? -Infinity))
    : null;

  const stats = [
    { label: 'Active Funds',   value: perf.length.toString(),                          sub: 'being tracked' },
    { label: 'Avg YTD Return', value: avgYtd != null ? `${avgYtd >= 0 ? '+' : ''}${avgYtd.toFixed(2)}%` : '—', sub: 'year to date',   color: avgYtd != null ? (avgYtd >= 0 ? 'text-emerald-400' : 'text-red-400') : undefined },
    { label: 'Best 1W',        value: bestWeek != null && isFinite(bestWeek) ? `+${bestWeek.toFixed(2)}%` : '—', sub: 'this week', color: 'text-emerald-400' },
    { label: 'Last Update',    value: data.lastRun ? new Date(data.lastRun.run_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : '—', sub: data.lastRun?.status ?? 'pending' },
  ];

  return (
    <div className="space-y-6">
      {/* Hero */}
      <div
        className="relative rounded-2xl overflow-hidden p-7 sm:p-10"
        style={{ background: 'linear-gradient(135deg, #0f0c29 0%, #302b63 55%, #24243e 100%)' }}
      >
        {/* Decorative SVG */}
        <svg className="absolute inset-0 w-full h-full opacity-[0.08] pointer-events-none" viewBox="0 0 700 320" preserveAspectRatio="xMidYMid slice">
          {[70,140,210,280].map(y => <line key={`h${y}`} x1="0" y1={y} x2="700" y2={y} stroke="#6366f1" strokeWidth="0.6"/>)}
          {[100,200,300,400,500,600].map(x => <line key={`v${x}`} x1={x} y1="0" x2={x} y2="320" stroke="#6366f1" strokeWidth="0.6"/>)}
          <polyline points="0,280 80,240 160,200 240,180 320,160 400,120 480,90 560,65 640,45 700,30"
            fill="none" stroke="#818cf8" strokeWidth="2.5" strokeLinecap="round"/>
          <polyline points="0,310 80,290 160,270 240,260 320,240 400,210 480,190 560,170 640,150 700,135"
            fill="none" stroke="#6366f1" strokeWidth="1.5" strokeLinecap="round" strokeDasharray="6 4"/>
        </svg>

        <div className="relative z-10">
          <div className="text-xs text-indigo-300/80 uppercase tracking-widest mb-2">Meera's Portfolio Overview</div>
          <div className="text-2xl sm:text-3xl font-bold text-white mb-1">Mutual Fund Intelligence</div>
          <div className="text-indigo-200/60 text-sm mb-7">
            Personal tracker · {perf.length} fund{perf.length !== 1 ? 's' : ''} active
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {stats.map((s, i) => (
              <div key={i} className="rounded-xl p-4 bg-white/[0.06] backdrop-blur-sm border border-white/10">
                <div className="text-xs text-indigo-300/80 mb-1">{s.label}</div>
                <div className={`text-xl font-bold ${s.color ?? 'text-white'}`}>{s.value}</div>
                <div className="text-xs text-indigo-200/50 mt-0.5">{s.sub}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* YTD performance bars */}
      {perf.length > 0 && (
        <div className="card p-5">
          <div className="text-xs text-gray-500 uppercase tracking-widest mb-0.5 font-semibold">YTD Performance</div>
          <div className="text-xs text-gray-600">Year-to-date return per fund</div>
          <FundBars perf={perf} />
        </div>
      )}

      {/* Quick links */}
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

      {/* Latest report snippet */}
      {data.latestReport && (
        <div className="card p-5">
          <div className="text-xs text-gray-500 uppercase tracking-widest font-semibold mb-3">Latest AI Verdict</div>
          <div className="text-sm font-bold text-indigo-300 mb-1">{data.latestReport.verdict}</div>
          <p className="text-sm text-gray-400 leading-relaxed">{data.latestReport.reason}</p>
          <button onClick={() => onNavigate('week')} className="mt-3 text-xs text-indigo-400 hover:text-indigo-300 transition-colors">
            View full report →
          </button>
        </div>
      )}
    </div>
  );
}
