'use client';

import { DashboardData, Snapshot, FundPerf } from '@/app/page';
import ReturnBadge  from './ReturnBadge';
import VerdictBadge from './VerdictBadge';

interface Props { data: DashboardData }

const FUND_COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ec4899', '#14b8a6'];

function MultiLineTrendChart({ snapshots, funds }: { snapshots: Snapshot[]; funds: FundPerf[] }) {
  if (snapshots.length < 2) return null;

  const sorted = [...snapshots].sort((a, b) => a.week_date.localeCompare(b.week_date));

  const W = 400, H = 180;
  const padL = 36, padR = 12, padT = 14, padB = 32;
  const cW = W - padL - padR;
  const cH = H - padT - padB;

  // collect all monthReturn values for scale
  const allVals: number[] = sorted.flatMap(snap =>
    funds.map(fund => {
      const f = snap.data.funds?.find(x => x.schemeCode === fund.schemeCode);
      return f?.monthReturn ?? null;
    }).filter(v => v !== null) as number[]
  );

  if (allVals.length === 0) return null;

  const minV = Math.min(...allVals, 0);
  const maxV = Math.max(...allVals, 0);
  const range = maxV - minV || 1;

  function px(i: number) { return padL + (i / (sorted.length - 1)) * cW; }
  function py(v: number)  { return padT + ((maxV - v) / range) * cH; }

  const zeroY = py(0);

  // Y-axis ticks
  const yTicks = [maxV, (maxV + minV) / 2, minV].filter(v => isFinite(v));

  // X-axis labels — show first, middle, last
  const xLabels = [0, Math.floor(sorted.length / 2), sorted.length - 1].filter((v, i, a) => a.indexOf(v) === i);

  return (
    <div>
      <div className="text-xs text-gray-500 uppercase tracking-widest font-semibold mb-1">1-Month Return Trend</div>
      <div className="flex flex-wrap gap-3 mb-2">
        {funds.map((f, i) => (
          <div key={f.schemeCode} className="flex items-center gap-1.5 text-xs text-gray-500">
            <div className="w-3 h-0.5 rounded" style={{ background: FUND_COLORS[i % FUND_COLORS.length] }} />
            {f.schemeName.split(' ').slice(0, 3).join(' ')}
          </div>
        ))}
      </div>
      <div className="overflow-x-auto">
        <svg viewBox={`0 0 ${W} ${H}`} style={{ minWidth: 280, width: '100%', height: H }}>
          <defs>
            {funds.map((f, i) => (
              <linearGradient key={f.schemeCode} id={`trendFill${i}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%"   stopColor={FUND_COLORS[i % FUND_COLORS.length]} stopOpacity="0.15" />
                <stop offset="100%" stopColor={FUND_COLORS[i % FUND_COLORS.length]} stopOpacity="0.01" />
              </linearGradient>
            ))}
          </defs>

          {/* grid lines */}
          {yTicks.map((v, i) => (
            <g key={i}>
              <line x1={padL} y1={py(v)} x2={W - padR} y2={py(v)} stroke="#1e2038" strokeWidth="1" />
              <text x={padL - 4} y={py(v) + 3} textAnchor="end" fontSize="8" fill="#4b5563">
                {v >= 0 ? '+' : ''}{v.toFixed(1)}
              </text>
            </g>
          ))}
          {/* zero line */}
          <line x1={padL} y1={zeroY} x2={W - padR} y2={zeroY} stroke="#374151" strokeWidth="1" />

          {/* lines per fund */}
          {funds.map((fund, fi) => {
            const points = sorted.map((snap, i) => {
              const f = snap.data.funds?.find(x => x.schemeCode === fund.schemeCode);
              const v = f?.monthReturn ?? null;
              return v !== null ? { x: px(i), y: py(v), v } : null;
            });

            const valid = points.filter(Boolean) as { x: number; y: number; v: number }[];
            if (valid.length < 2) return null;

            const linePath = valid.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
            const areaPath = `${linePath} L ${valid[valid.length - 1].x} ${zeroY} L ${valid[0].x} ${zeroY} Z`;
            const color    = FUND_COLORS[fi % FUND_COLORS.length];

            return (
              <g key={fund.schemeCode}>
                <path d={areaPath} fill={`url(#trendFill${fi})`} />
                <path d={linePath} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                {/* terminal dot */}
                <circle cx={valid[valid.length - 1].x} cy={valid[valid.length - 1].y} r="3" fill={color} />
              </g>
            );
          })}

          {/* x-axis labels */}
          {xLabels.map(i => (
            <text key={i} x={px(i)} y={H - 4} textAnchor="middle" fontSize="8" fill="#6b7280">
              {new Date(sorted[i].week_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
            </text>
          ))}
        </svg>
      </div>
    </div>
  );
}

export default function TrendsTab({ data }: Props) {
  const { snapshots } = data;

  if (snapshots.length === 0) {
    return (
      <div className="card p-8 text-center text-gray-500">
        <div className="text-4xl mb-3">📈</div>
        <div className="font-medium">No trend data yet</div>
        <div className="text-sm mt-1">Trends appear after 2+ weekly snapshots have been saved.</div>
      </div>
    );
  }

  const sorted      = [...snapshots].sort((a, b) => b.week_date.localeCompare(a.week_date));
  const latestFunds : FundPerf[] = sorted[0]?.data?.funds ?? [];

  function fmt(d: string) {
    return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  }

  return (
    <div className="space-y-6">

      {/* ── Multi-line trend chart ───────────────────────────────────────── */}
      {snapshots.length >= 2 && (
        <div className="card p-5">
          <MultiLineTrendChart
            snapshots={snapshots}
            funds={latestFunds}
          />
        </div>
      )}

      {/* ── Per-fund history tables ──────────────────────────────────────── */}
      <div>
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-widest mb-3">Week-by-week Return History</h2>
        {latestFunds.map((fund, fi) => {
          const color = FUND_COLORS[fi % FUND_COLORS.length];
          return (
            <div key={fund.schemeCode} className="card p-5 mb-4" style={{ borderLeft: `3px solid ${color}` }}>
              <div className="text-xs text-gray-500 uppercase tracking-wide mb-0.5">{fund.fundType.replace(/_/g, ' ')}</div>
              <div className="font-semibold text-gray-100 mb-4">{fund.schemeName}</div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-xs text-gray-600 border-b border-[#1a1a1a]">
                      <td className="pb-2 w-28">Week</td>
                      <td className="pb-2 text-right">1W</td>
                      <td className="pb-2 text-right">1M</td>
                      <td className="pb-2 text-right">YTD</td>
                      <td className="pb-2 text-right">vs Bench</td>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#111]">
                    {sorted.map((snap: Snapshot) => {
                      const f = snap.data.funds?.find(x => x.schemeCode === fund.schemeCode);
                      if (!f) return null;
                      const vsBench = f.monthReturn !== null && f.benchmarkMonth !== null ? f.monthReturn - f.benchmarkMonth : null;
                      return (
                        <tr key={snap.week_date}>
                          <td className="py-2 text-gray-400 text-xs">{fmt(snap.week_date)}</td>
                          <td className="py-2 text-right"><ReturnBadge value={f.weekReturn} /></td>
                          <td className="py-2 text-right"><ReturnBadge value={f.monthReturn} /></td>
                          <td className="py-2 text-right"><ReturnBadge value={f.ytdReturn} /></td>
                          <td className="py-2 text-right"><ReturnBadge value={vsBench} /></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Verdict history ──────────────────────────────────────────────── */}
      <div>
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-widest mb-3">Verdict History</h2>
        <div className="space-y-2">
          {sorted.map(snap => {
            const weekReport = data.latestReport?.week_date === snap.week_date ? data.latestReport : null;
            return (
              <div key={snap.week_date} className="card2 p-3 flex items-center justify-between flex-wrap gap-2">
                <span className="text-sm text-gray-400">{fmt(snap.week_date)}</span>
                {weekReport
                  ? <VerdictBadge verdict={weekReport.verdict} />
                  : <span className="text-gray-600 text-xs">no report</span>}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
