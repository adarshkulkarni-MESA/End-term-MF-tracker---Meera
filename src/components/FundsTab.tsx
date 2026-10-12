'use client';

import { DashboardData, FundPerf, Snapshot } from '@/app/page';
import ReturnBadge from './ReturnBadge';
import Sparkline   from './Sparkline';

interface Props { data: DashboardData }

const FUND_COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ec4899', '#14b8a6'];

function shortName(name: string) {
  return name.length > 40 ? name.slice(0, 38) + '…' : name;
}

/* ── Mini growth line chart for a fund ──────────────────────── */
function FundGrowthLine({ schemeCode, snapshots, color }: {
  schemeCode: string; snapshots: Snapshot[]; color: string;
}) {
  const sorted = [...snapshots].sort((a, b) => a.week_date.localeCompare(b.week_date));
  if (sorted.length < 2) return null;

  let idx = 100;
  const vals = sorted.map(snap => {
    const f = snap.data.funds?.find(x => x.schemeCode === schemeCode);
    if (f?.weekReturn !== null && f?.weekReturn !== undefined) {
      idx *= (1 + f.weekReturn / 100);
    }
    return idx;
  });

  const W = 320, H = 72;
  const padL = 6, padR = 6, padT = 8, padB = 16;
  const cW   = W - padL - padR;
  const cH   = H - padT - padB;

  const minV  = Math.min(...vals, 96);
  const maxV  = Math.max(...vals, 104);
  const range = maxV - minV || 1;

  function px(i: number) { return padL + (i / (vals.length - 1)) * cW; }
  function py(v: number)  { return padT + ((maxV - v) / range) * cH; }

  const pts       = vals.map((v, i) => ({ x: px(i), y: py(v) }));
  const linePath  = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');
  const areaPath  = `${linePath} L ${pts[pts.length - 1].x} ${padT + cH} L ${pts[0].x} ${padT + cH} Z`;
  const last      = vals[vals.length - 1];
  const pos       = last >= 100;

  /* X labels: first and last */
  const fmtDate = (d: string) => new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });

  return (
    <div>
      <div className="text-[10px] mb-0.5" style={{ color: 'var(--text-dim)' }}>
        Cumulative growth index (base 100)
      </div>
      <div className="overflow-x-auto">
        <svg viewBox={`0 0 ${W} ${H}`} style={{ minWidth: 200, width: '100%', height: H }}>
          <defs>
            <linearGradient id={`fg${schemeCode}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%"   stopColor={color} stopOpacity="0.22" />
              <stop offset="100%" stopColor={color} stopOpacity="0.01" />
            </linearGradient>
          </defs>

          {/* Zero / base line at 100 */}
          {minV < 100 && maxV > 100 && (
            <line x1={padL} y1={py(100)} x2={W - padR} y2={py(100)}
              stroke="rgba(100,100,200,0.2)" strokeWidth="1" strokeDasharray="3 3" />
          )}

          {/* Area + line */}
          <path d={areaPath} fill={`url(#fg${schemeCode})`} />
          <path d={linePath} fill="none" stroke={color} strokeWidth="1.8"
            strokeLinecap="round" strokeLinejoin="round" />

          {/* End dot */}
          <circle cx={pts[pts.length - 1].x} cy={pts[pts.length - 1].y} r="2.5" fill={color} />

          {/* X labels */}
          <text x={padL} y={H - 2} fontSize="7" fill="#50508a" textAnchor="start">
            {fmtDate(sorted[0].week_date)}
          </text>
          <text x={W - padR} y={H - 2} fontSize="7" fill="#50508a" textAnchor="end">
            {fmtDate(sorted[sorted.length - 1].week_date)}
          </text>

          {/* Current index value */}
          <text x={W - padR} y={padT} fontSize="8" fill={pos ? '#34d399' : '#f87171'}
            textAnchor="end" fontWeight="600">
            {last.toFixed(1)}
          </text>
        </svg>
      </div>
    </div>
  );
}

export default function FundsTab({ data }: Props) {
  const { performance: perf, snapshots } = data;

  function monthlyHistory(schemeCode: string): (number | null)[] {
    return [...snapshots]
      .sort((a, b) => a.week_date.localeCompare(b.week_date))
      .map((s: Snapshot) => {
        const f = s.data.funds?.find(f => f.schemeCode === schemeCode);
        return f?.monthReturn ?? null;
      });
  }

  if (perf.length === 0) {
    return (
      <div className="card p-8 text-center" style={{ color: 'var(--text-moon)' }}>
        <div className="text-4xl mb-3">📊</div>
        <div className="font-medium">No fund data yet</div>
        <div className="text-sm mt-1" style={{ color: 'var(--text-dim)' }}>
          Run the daily pipeline to fetch NAV data.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-sm font-semibold uppercase tracking-widest mb-2" style={{ color: 'var(--text-moon)' }}>
        Fund Performance vs Benchmark &amp; Category Average
      </h2>
      {perf.map((f, fi) => {
        const hist  = monthlyHistory(f.schemeCode);
        const color = FUND_COLORS[fi % FUND_COLORS.length];
        return (
          <div key={f.schemeCode} className="card p-5" style={{ borderLeft: `3px solid ${color}` }}>
            {/* Header */}
            <div className="flex items-start justify-between flex-wrap gap-2 mb-4">
              <div>
                <div className="text-xs uppercase tracking-wide mb-0.5" style={{ color: 'var(--text-dim)' }}>
                  {f.fundType.replace(/_/g, ' ')}
                </div>
                <div className="font-semibold" style={{ color: 'var(--text-star)' }}>{shortName(f.schemeName)}</div>
                {f.currentNav && (
                  <div className="text-xs mt-0.5" style={{ color: 'var(--text-dim)' }}>
                    NAV: ₹{f.currentNav.toFixed(2)}
                  </div>
                )}
              </div>
              <Sparkline values={hist} />
            </div>

            {/* Growth line chart from snapshots */}
            {snapshots.length >= 2 && (
              <div className="mb-4">
                <FundGrowthLine schemeCode={f.schemeCode} snapshots={snapshots} color={color} />
              </div>
            )}

            {/* Return comparison table */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-xs border-b" style={{ color: 'var(--text-dim)', borderColor: 'rgba(80,60,180,0.12)' }}>
                    <td className="pb-2 w-28">Period</td>
                    <td className="pb-2 text-right">This fund</td>
                    <td className="pb-2 text-right">{f.benchmarkName ?? '—'}</td>
                    <td className="pb-2 text-right">Category avg</td>
                    <td className="pb-2 text-right">vs Bench</td>
                  </tr>
                </thead>
                <tbody style={{ borderColor: 'rgba(60,40,140,0.1)' }} className="divide-y divide-[#111]">
                  <tr>
                    <td className="py-2 text-xs" style={{ color: 'var(--text-moon)' }}>1 Week</td>
                    <td className="py-2 text-right"><ReturnBadge value={f.weekReturn} /></td>
                    <td className="py-2 text-right"><ReturnBadge value={f.benchmarkWeek} /></td>
                    <td className="py-2 text-right"><ReturnBadge value={f.categoryWeek} /></td>
                    <td className="py-2 text-right">
                      {f.weekReturn !== null && f.benchmarkWeek !== null
                        ? <ReturnBadge value={f.weekReturn - f.benchmarkWeek} />
                        : <span style={{ color: 'var(--text-dim)' }}>—</span>}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2 text-xs" style={{ color: 'var(--text-moon)' }}>1 Month</td>
                    <td className="py-2 text-right"><ReturnBadge value={f.monthReturn} /></td>
                    <td className="py-2 text-right"><ReturnBadge value={f.benchmarkMonth} /></td>
                    <td className="py-2 text-right"><ReturnBadge value={f.categoryMonth} /></td>
                    <td className="py-2 text-right">
                      {f.monthReturn !== null && f.benchmarkMonth !== null
                        ? <ReturnBadge value={f.monthReturn - f.benchmarkMonth} />
                        : <span style={{ color: 'var(--text-dim)' }}>—</span>}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2 text-xs" style={{ color: 'var(--text-moon)' }}>Year to date</td>
                    <td className="py-2 text-right"><ReturnBadge value={f.ytdReturn} /></td>
                    <td className="py-2 text-right"><ReturnBadge value={f.benchmarkYtd} /></td>
                    <td className="py-2 text-right"><ReturnBadge value={f.categoryYtd} /></td>
                    <td className="py-2 text-right">
                      {f.ytdReturn !== null && f.benchmarkYtd !== null
                        ? <ReturnBadge value={f.ytdReturn - f.benchmarkYtd} />
                        : <span style={{ color: 'var(--text-dim)' }}>—</span>}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            {f.fundType === 'short_debt'    && <div className="text-xs mt-3" style={{ color: 'var(--text-dim)' }}>ℹ️ No free index for short-duration debt funds.</div>}
            {f.fundType === 'international' && <div className="text-xs mt-3" style={{ color: 'var(--text-dim)' }}>ℹ️ Benchmark is S&amp;P 500 (USD returns). Currency movements affect the comparison.</div>}
          </div>
        );
      })}
    </div>
  );
}
