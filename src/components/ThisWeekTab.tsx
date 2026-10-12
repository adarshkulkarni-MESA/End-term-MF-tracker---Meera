'use client';

import { useState } from 'react';
import { DashboardData, FundPerf } from '@/app/page';
import VerdictBadge from './VerdictBadge';
import ReturnBadge  from './ReturnBadge';

const FUND_COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ec4899', '#14b8a6'];

function WeeklyReturnChart({ perf }: { perf: FundPerf[] }) {
  if (perf.length === 0) return null;

  const W = 400, H = 180;
  const padL = 52, padR = 16, padT = 16, padB = 44;
  const cW = W - padL - padR;
  const cH = H - padT - padB;

  const allVals = perf.flatMap(f => [f.weekReturn, f.benchmarkWeek]).filter((v): v is number => v !== null);
  const maxAbs  = Math.max(...allVals.map(Math.abs), 1);
  const zeroY   = padT + cH / 2;

  function fy(v: number | null) {
    if (v === null) return zeroY;
    return padT + ((maxAbs - v) / (2 * maxAbs)) * cH;
  }

  function fx(i: number) {
    return padL + (i + 0.5) * (cW / perf.length);
  }

  const yTicks = [maxAbs, maxAbs / 2, 0, -maxAbs / 2, -maxAbs];

  return (
    <div>
      <div className="text-xs uppercase tracking-widest font-semibold mb-2" style={{ color: 'var(--text-dim)' }}>
        1-Week Returns: Fund vs Benchmark
      </div>
      <div className="flex gap-4 mb-2">
        <div className="flex items-center gap-1.5 text-[10px]" style={{ color: 'var(--text-dim)' }}>
          <div className="w-3 h-2 rounded-sm" style={{ background: '#6366f1' }} /> Fund
        </div>
        <div className="flex items-center gap-1.5 text-[10px]" style={{ color: 'var(--text-dim)' }}>
          <div className="w-3 h-2 rounded-sm" style={{ background: '#6b7280' }} /> Benchmark
        </div>
      </div>
      <div className="overflow-x-auto">
        <svg viewBox={`0 0 ${W} ${H}`} style={{ minWidth: 260, width: '100%', height: H }}>
          {/* Y-axis ticks and grid lines */}
          {yTicks.map((v, i) => (
            <g key={i}>
              <line
                x1={padL} y1={fy(v)} x2={W - padR} y2={fy(v)}
                stroke={v === 0 ? '#374151' : '#1e2038'}
                strokeWidth={v === 0 ? 1 : 1}
                strokeDasharray={v === 0 ? undefined : '3,4'}
              />
              <text x={padL - 5} y={fy(v) + 3} textAnchor="end" fontSize="7" fill="#4b5563">
                {v === 0 ? '0%' : `${v > 0 ? '+' : ''}${v.toFixed(1)}%`}
              </text>
            </g>
          ))}

          {perf.map((f, fi) => {
            const color  = FUND_COLORS[fi % FUND_COLORS.length];
            const x      = fx(fi);
            const fundY  = fy(f.weekReturn);
            const benchY = fy(f.benchmarkWeek);
            const pos    = (f.weekReturn ?? 0) >= 0;
            const name   = f.schemeName.split(' ').slice(0, 2).join(' ');

            return (
              <g key={f.schemeCode}>
                {/* Lollipop stick — fund */}
                {f.weekReturn !== null && (
                  <line x1={x - 7} y1={zeroY} x2={x - 7} y2={fundY}
                    stroke={color} strokeWidth="1.5" strokeOpacity="0.55" />
                )}
                {/* Lollipop stick — benchmark */}
                {f.benchmarkWeek !== null && (
                  <line x1={x + 7} y1={zeroY} x2={x + 7} y2={benchY}
                    stroke="#6b7280" strokeWidth="1.5" strokeOpacity="0.5" />
                )}
                {/* Fund dot */}
                {f.weekReturn !== null && (
                  <circle cx={x - 7} cy={fundY} r="4.5" fill={color} />
                )}
                {/* Benchmark dot */}
                {f.benchmarkWeek !== null && (
                  <circle cx={x + 7} cy={benchY} r="3" fill="#6b7280" opacity="0.8" />
                )}
                {/* Return value label */}
                {f.weekReturn !== null && (
                  <text
                    x={x - 7} y={pos ? fundY - 8 : fundY + 12}
                    textAnchor="middle" fontSize="7.5"
                    fill={pos ? '#34d399' : '#f87171'} fontWeight="600"
                  >
                    {pos ? '+' : ''}{f.weekReturn.toFixed(1)}%
                  </text>
                )}
                {/* Fund name at bottom */}
                <text x={x} y={H - 6} textAnchor="middle" fontSize="7" fill="#4b5563">
                  {name}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}

interface Props { data: DashboardData }

function autoSummary(f: FundPerf): string {
  const parts: string[] = [];

  if (f.weekReturn !== null) {
    const dir  = f.weekReturn >= 0 ? 'gained' : 'lost';
    let line   = `This week the fund ${dir} ${Math.abs(f.weekReturn).toFixed(2)}%`;
    if (f.benchmarkWeek !== null) {
      const diff = f.weekReturn - f.benchmarkWeek;
      if (Math.abs(diff) >= 0.1) {
        line += `, ${diff >= 0 ? 'outperforming' : 'underperforming'} its benchmark (${f.benchmarkName ?? 'benchmark'}) by ${Math.abs(diff).toFixed(2)}%`;
      } else {
        line += `, in line with its benchmark (${f.benchmarkName ?? 'benchmark'}) at ${f.benchmarkWeek.toFixed(2)}%`;
      }
    }
    parts.push(line + '.');
  }

  if (f.monthReturn !== null) {
    const dir  = f.monthReturn >= 0 ? 'up' : 'down';
    let line   = `Over the past month it is ${dir} ${Math.abs(f.monthReturn).toFixed(2)}%`;
    if (f.categoryMonth !== null) {
      const diff = f.monthReturn - f.categoryMonth;
      line += `, ${diff >= 0 ? 'ahead of' : 'behind'} the category average of ${f.categoryMonth.toFixed(2)}%`;
    }
    parts.push(line + '.');
  }

  if (f.ytdReturn !== null) {
    const dir = f.ytdReturn >= 0 ? 'up' : 'down';
    parts.push(`Year-to-date it is ${dir} ${Math.abs(f.ytdReturn).toFixed(2)}%.`);
  }

  return parts.length > 0 ? parts.join(' ') : 'Performance data not yet available.';
}

export default function ThisWeekTab({ data }: Props) {
  const report = data.latestReport;
  const perf   = data.performance;

  const [sending,    setSending]    = useState(false);
  const [passphrase, setPassphrase] = useState('');
  const [showModal,  setShowModal]  = useState(false);
  const [sendResult, setSendResult] = useState<{ ok: boolean; msg: string } | null>(null);

  async function handleSend() {
    setSending(true);
    setSendResult(null);
    try {
      const res = await fetch('/api/send-report', {
        method:  'POST',
        headers: {
          'Content-Type':       'application/json',
          'x-admin-passphrase': passphrase,
        },
        body: JSON.stringify({}),
      });
      const json = await res.json() as { status?: string; error?: string; errors?: string[]; emailSent?: boolean };
      if (!res.ok) {
        const detail = json.errors?.join('; ') ?? json.error ?? `HTTP ${res.status}`;
        setSendResult({ ok: false, msg: detail });
      } else if (json.emailSent === false && json.errors && json.errors.length > 0) {
        setSendResult({ ok: false, msg: json.errors.join('; ') });
      } else {
        setSendResult({ ok: true, msg: 'Report generated and email sent successfully!' });
        setTimeout(() => setShowModal(false), 2000);
      }
    } catch (e) {
      setSendResult({ ok: false, msg: String(e) });
    } finally {
      setSending(false);
    }
  }

  if (!report && perf.length === 0) {
    return (
      <div className="space-y-6">
        <div className="card p-8 text-center" style={{ color: 'var(--text-moon)' }}>
          <div className="text-4xl mb-3">📭</div>
          <div className="font-medium">No report yet</div>
          <div className="text-sm mt-1" style={{ color: 'var(--text-dim)' }}>
            The first Saturday report will arrive after deployment. Daily data is being collected.
          </div>
        </div>
        <SendReportSection
          showModal={showModal} setShowModal={setShowModal}
          passphrase={passphrase} setPassphrase={setPassphrase}
          sending={sending} sendResult={sendResult} onSend={handleSend}
        />
      </div>
    );
  }

  const aiSummaries = report?.fund_summaries ?? [];

  return (
    <div className="space-y-6">
      {/* ── Verdict ──────────────────────────────────────────────────── */}
      {report && (
        <div className="card p-6 text-center">
          <div className="text-sm mb-3" style={{ color: 'var(--text-moon)' }}>
            Week ending {new Date(report.week_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
          </div>
          <VerdictBadge verdict={report.verdict} />
          <p className="mt-3 text-sm max-w-xl mx-auto" style={{ color: 'var(--text-moon)' }}>{report.reason}</p>
        </div>
      )}

      {/* ── Weekly returns dot chart ─────────────────────────────────── */}
      {perf.length > 0 && (
        <div className="card p-5">
          <WeeklyReturnChart perf={perf} />
        </div>
      )}

      {/* ── Quick returns grid ───────────────────────────────────────── */}
      <div>
        <h2 className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: 'var(--text-moon)' }}>
          This Week&apos;s Returns
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {perf.map(f => (
            <div key={f.schemeCode} className="card2 p-4">
              <div className="text-xs mb-1 uppercase tracking-wide" style={{ color: 'var(--text-dim)' }}>
                {f.fundType.replace(/_/g, ' ')}
              </div>
              <div className="text-sm font-medium mb-3 leading-tight" style={{ color: 'var(--text-star)' }}>
                {f.schemeName}
              </div>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div>
                  <div className="text-xs mb-0.5" style={{ color: 'var(--text-dim)' }}>1W</div>
                  <ReturnBadge value={f.weekReturn} />
                </div>
                <div>
                  <div className="text-xs mb-0.5" style={{ color: 'var(--text-dim)' }}>1M</div>
                  <ReturnBadge value={f.monthReturn} />
                </div>
                <div>
                  <div className="text-xs mb-0.5" style={{ color: 'var(--text-dim)' }}>YTD</div>
                  <ReturnBadge value={f.ytdReturn} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Fund summaries ───────────────────────────────────────────── */}
      <div>
        <h2 className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: 'var(--text-moon)' }}>
          Fund Summaries{' '}
          {aiSummaries.length === 0 && (
            <span className="normal-case text-xs ml-1" style={{ color: 'var(--text-dim)' }}>(auto-generated)</span>
          )}
        </h2>
        <div className="space-y-3">
          {aiSummaries.length > 0
            ? aiSummaries.map((fs, i) => (
                <div key={i} className="card2 p-4" style={{ borderLeft: '2px solid var(--accent-violet)' }}>
                  <div className="text-sm font-semibold mb-1" style={{ color: 'var(--text-star)' }}>{fs.schemeName}</div>
                  <div className="text-sm leading-relaxed" style={{ color: 'var(--text-moon)' }}>{fs.summary}</div>
                </div>
              ))
            : perf.map(f => (
                <div key={f.schemeCode} className="card2 p-4" style={{ borderLeft: '2px solid rgba(70,60,140,0.4)' }}>
                  <div className="text-sm font-semibold mb-1" style={{ color: 'var(--text-star)' }}>{f.schemeName}</div>
                  <div className="text-sm leading-relaxed" style={{ color: 'var(--text-moon)' }}>{autoSummary(f)}</div>
                </div>
              ))
          }
        </div>
      </div>

      {/* ── Send report ──────────────────────────────────────────────── */}
      <SendReportSection
        showModal={showModal} setShowModal={setShowModal}
        passphrase={passphrase} setPassphrase={setPassphrase}
        sending={sending} sendResult={sendResult} onSend={handleSend}
      />
    </div>
  );
}

interface SendProps {
  showModal:     boolean;
  setShowModal:  (v: boolean) => void;
  passphrase:    string;
  setPassphrase: (v: string) => void;
  sending:       boolean;
  sendResult:    { ok: boolean; msg: string } | null;
  onSend:        () => void;
}

function SendReportSection({ showModal, setShowModal, passphrase, setPassphrase, sending, sendResult, onSend }: SendProps) {
  return (
    <div className="card p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
      <div>
        <div className="text-sm font-medium" style={{ color: 'var(--text-star)' }}>Generate &amp; send weekly report</div>
        <div className="text-xs mt-0.5" style={{ color: 'var(--text-dim)' }}>Triggers AI analysis and sends the report email via Resend</div>
      </div>
      <button
        onClick={() => setShowModal(true)}
        className="text-sm rounded px-4 py-2 transition-colors whitespace-nowrap"
        style={{ background: 'var(--accent-violet)', color: '#fff' }}
      >
        ✉ Send Report
      </button>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(4px)' }} onClick={() => setShowModal(false)}>
          <div className="card p-6 w-full max-w-sm mx-4 space-y-4" onClick={e => e.stopPropagation()}>
            <div className="text-base font-semibold" style={{ color: 'var(--text-star)' }}>Send Weekly Report</div>
            <div className="text-sm" style={{ color: 'var(--text-moon)' }}>Enter the admin passphrase to trigger the report. Leave blank if no passphrase is set.</div>
            <input
              type="password"
              placeholder="Admin passphrase (optional)"
              value={passphrase}
              onChange={e => setPassphrase(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !sending && onSend()}
              className="w-full rounded px-3 py-2 text-sm focus:outline-none"
              style={{
                background:  'rgba(8,8,22,0.9)',
                border:      '1px solid rgba(80,60,180,0.25)',
                color:       'var(--text-star)',
              }}
            />
            {sendResult && (
              <div className={`text-sm rounded px-3 py-2 ${sendResult.ok ? 'bg-green-900/40 text-green-400' : 'bg-red-900/40 text-red-400'}`}>
                {sendResult.msg}
              </div>
            )}
            <div className="flex gap-3 justify-end">
              <button onClick={() => setShowModal(false)} className="text-sm px-3 py-1.5" style={{ color: 'var(--text-moon)' }}>
                Cancel
              </button>
              <button
                onClick={onSend}
                disabled={sending}
                className="text-sm rounded px-4 py-1.5 transition-colors disabled:opacity-50"
                style={{ background: 'var(--accent-violet)', color: '#fff' }}
              >
                {sending ? 'Sending…' : 'Send'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
