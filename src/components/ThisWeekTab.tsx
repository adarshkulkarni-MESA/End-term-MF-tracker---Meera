'use client';

import { useState } from 'react';
import { DashboardData, FundPerf } from '@/app/page';
import VerdictBadge from './VerdictBadge';
import ReturnBadge  from './ReturnBadge';

const FUND_COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ec4899', '#14b8a6'];

function WeeklyReturnChart({ perf }: { perf: FundPerf[] }) {
  if (perf.length === 0) return null;

  const W = 400, H = 28 + perf.length * 36;
  const padL = 16, padR = 60, padT = 20, padB = 8;
  const cW = W - padL - padR;
  const cH = H - padT - padB;
  const rowH = cH / perf.length;

  const allVals = perf.flatMap(f => [f.weekReturn, f.benchmarkWeek]).filter((v): v is number => v !== null);
  const maxAbs  = Math.max(...allVals.map(Math.abs), 1);

  function bw(v: number | null) {
    if (v === null) return 0;
    return (Math.abs(v) / maxAbs) * (cW * 0.5);
  }

  const zeroX = padL + cW * 0.5;

  return (
    <div>
      <div className="text-xs text-gray-500 uppercase tracking-widest font-semibold mb-1">1-Week Returns: Fund vs Benchmark</div>
      <div className="flex gap-4 mb-2">
        <div className="flex items-center gap-1 text-[10px] text-gray-600"><div className="w-3 h-2 rounded-sm bg-indigo-500" /> Fund</div>
        <div className="flex items-center gap-1 text-[10px] text-gray-600"><div className="w-3 h-2 rounded-sm bg-gray-600" /> Benchmark</div>
      </div>
      <div className="overflow-x-auto">
        <svg viewBox={`0 0 ${W} ${H}`} style={{ minWidth: 260, width: '100%', height: H }}>
          {/* zero axis */}
          <line x1={zeroX} y1={padT - 8} x2={zeroX} y2={H - padB} stroke="#374151" strokeWidth="1" />
          <text x={zeroX} y={padT - 10} textAnchor="middle" fontSize="7" fill="#4b5563">0%</text>

          {perf.map((f, fi) => {
            const color   = FUND_COLORS[fi % FUND_COLORS.length];
            const cy      = padT + fi * rowH;
            const fundW   = bw(f.weekReturn);
            const benchW  = bw(f.benchmarkWeek);
            const fundPos = (f.weekReturn ?? 0) >= 0;
            const name    = f.schemeName.split(' ').slice(0, 3).join(' ');

            return (
              <g key={f.schemeCode}>
                {/* fund bar */}
                <rect
                  x={fundPos ? zeroX : zeroX - fundW}
                  y={cy + 2}
                  width={fundW}
                  height={rowH * 0.38}
                  rx="2"
                  fill={color}
                  opacity="0.9"
                />
                {/* benchmark bar */}
                {f.benchmarkWeek !== null && (
                  <rect
                    x={(f.benchmarkWeek >= 0) ? zeroX : zeroX - benchW}
                    y={cy + rowH * 0.42 + 3}
                    width={benchW}
                    height={rowH * 0.28}
                    rx="1.5"
                    fill="#6b7280"
                    opacity="0.65"
                  />
                )}
                {/* fund name label */}
                <text x={padL} y={cy + 1} fontSize="7.5" fill="#9ca3af" dominantBaseline="hanging">
                  {name}
                </text>
                {/* value label */}
                {f.weekReturn !== null && (
                  <text
                    x={W - padR + 4}
                    y={cy + rowH * 0.22 + 2}
                    fontSize="8.5"
                    fill={fundPos ? '#34d399' : '#f87171'}
                    fontWeight="600"
                    dominantBaseline="middle"
                  >
                    {fundPos ? '+' : ''}{f.weekReturn.toFixed(2)}%
                  </text>
                )}
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

  const [sending,  setSending]  = useState(false);
  const [passphrase, setPassphrase] = useState('');
  const [showModal, setShowModal]   = useState(false);
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
        <div className="card p-8 text-center text-gray-500">
          <div className="text-4xl mb-3">📭</div>
          <div className="font-medium">No report yet</div>
          <div className="text-sm mt-1">The first Saturday report will arrive after deployment. Daily data is being collected.</div>
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
          <div className="text-gray-400 text-sm mb-3">
            Week ending {new Date(report.week_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
          </div>
          <VerdictBadge verdict={report.verdict} />
          <p className="text-gray-300 mt-3 text-sm max-w-xl mx-auto">{report.reason}</p>
        </div>
      )}

      {/* ── Weekly returns chart ─────────────────────────────────────── */}
      {perf.length > 0 && (
        <div className="card p-5">
          <WeeklyReturnChart perf={perf} />
        </div>
      )}

      {/* ── Quick returns grid ───────────────────────────────────────── */}
      <div>
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-widest mb-3">This Week's Returns</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {perf.map(f => (
            <div key={f.schemeCode} className="card2 p-4">
              <div className="text-xs text-gray-500 mb-1 uppercase tracking-wide">{f.fundType.replace(/_/g, ' ')}</div>
              <div className="text-sm font-medium text-gray-200 mb-3 leading-tight">{f.schemeName}</div>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div>
                  <div className="text-xs text-gray-600 mb-0.5">1W</div>
                  <ReturnBadge value={f.weekReturn} />
                </div>
                <div>
                  <div className="text-xs text-gray-600 mb-0.5">1M</div>
                  <ReturnBadge value={f.monthReturn} />
                </div>
                <div>
                  <div className="text-xs text-gray-600 mb-0.5">YTD</div>
                  <ReturnBadge value={f.ytdReturn} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Fund summaries ───────────────────────────────────────────── */}
      <div>
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-widest mb-3">
          Fund Summaries {aiSummaries.length === 0 && <span className="text-gray-600 normal-case text-xs ml-1">(auto-generated)</span>}
        </h2>
        <div className="space-y-3">
          {aiSummaries.length > 0
            ? aiSummaries.map((fs, i) => (
                <div key={i} className="card2 p-4 border-l-2 border-indigo-500">
                  <div className="text-sm font-semibold text-gray-200 mb-1">{fs.schemeName}</div>
                  <div className="text-sm text-gray-400 leading-relaxed">{fs.summary}</div>
                </div>
              ))
            : perf.map(f => (
                <div key={f.schemeCode} className="card2 p-4 border-l-2 border-gray-700">
                  <div className="text-sm font-semibold text-gray-200 mb-1">{f.schemeName}</div>
                  <div className="text-sm text-gray-400 leading-relaxed">{autoSummary(f)}</div>
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
        <div className="text-sm font-medium text-gray-200">Generate & send weekly report</div>
        <div className="text-xs text-gray-500 mt-0.5">Triggers AI analysis and sends the report email via Resend</div>
      </div>
      <button
        onClick={() => { setShowModal(true); }}
        className="text-sm bg-indigo-600 hover:bg-indigo-500 text-white rounded px-4 py-2 transition-colors whitespace-nowrap"
      >
        ✉ Send Report
      </button>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70" onClick={() => setShowModal(false)}>
          <div className="card p-6 w-full max-w-sm mx-4 space-y-4" onClick={e => e.stopPropagation()}>
            <div className="text-base font-semibold text-gray-100">Send Weekly Report</div>
            <div className="text-sm text-gray-400">Enter the admin passphrase to trigger the report. Leave blank if no passphrase is set.</div>
            <input
              type="password"
              placeholder="Admin passphrase (optional)"
              value={passphrase}
              onChange={e => setPassphrase(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !sending && onSend()}
              className="w-full bg-[#0a0a0a] border border-[#333] rounded px-3 py-2 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-indigo-500"
            />
            {sendResult && (
              <div className={`text-sm rounded px-3 py-2 ${sendResult.ok ? 'bg-green-900/40 text-green-400' : 'bg-red-900/40 text-red-400'}`}>
                {sendResult.msg}
              </div>
            )}
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowModal(false)}
                className="text-sm text-gray-400 hover:text-gray-200 px-3 py-1.5"
              >
                Cancel
              </button>
              <button
                onClick={onSend}
                disabled={sending}
                className="text-sm bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded px-4 py-1.5 transition-colors"
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
