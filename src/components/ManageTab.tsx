'use client';

import { useState, useEffect, useCallback } from 'react';

interface Fund { id: number; scheme_code: string; scheme_name: string; fund_type: string; is_active: boolean; }
interface Props { onRefresh: () => void }

const FUND_TYPES = [
  { value: 'large_cap',    label: 'Large-Cap Index Fund' },
  { value: 'mid_cap',      label: 'Mid-Cap Growth Fund' },
  { value: 'small_cap',    label: 'Small-Cap Fund' },
  { value: 'short_debt',   label: 'Short-Duration Debt Fund' },
  { value: 'international',label: 'International Fund' },
];

export default function ManageTab({ onRefresh }: Props) {
  const [funds, setFunds]       = useState<Fund[]>([]);
  const [loading, setLoading]   = useState(true);
  const [code, setCode]           = useState('');
  const [fundType, setFundType]   = useState('large_cap');
  const [passphrase, setPass]     = useState('');
  const [lookupName, setLookupName] = useState<string | null>(null);
  const [lookupLoading, setLookupLoading] = useState(false);
  const [addStatus, setAddStatus] = useState<string | null>(null);
  const [removeStatus, setRemoveStatus] = useState<string | null>(null);

  const fetchFunds = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/funds');
      const data = await res.json() as Fund[];
      setFunds(data);
    } catch { setFunds([]); } finally { setLoading(false); }
  }, []);

  useEffect(() => { void fetchFunds(); }, [fetchFunds]);

  async function lookup() {
    if (!code.trim()) return;
    setLookupLoading(true); setLookupName(null);
    try {
      const res = await fetch(`/api/funds/lookup?code=${code.trim()}`);
      if (!res.ok) { setLookupName('❌ Not found — check the scheme code'); return; }
      const data = await res.json() as { schemeName: string };
      setLookupName(`✓ ${data.schemeName}`);
    } finally { setLookupLoading(false); }
  }

  async function addFund() {
    setAddStatus(null);
    if (!lookupName?.startsWith('✓')) { setAddStatus('Please look up the scheme code first to confirm the fund name.'); return; }
    const res = await fetch('/api/funds', { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-admin-passphrase': passphrase }, body: JSON.stringify({ schemeCode: code.trim(), fundType }) });
    if (res.ok) { setAddStatus('✓ Fund added!'); setCode(''); setLookupName(null); void fetchFunds(); onRefresh(); }
    else { const err = await res.json() as { error: string }; setAddStatus(`❌ ${err.error}`); }
  }

  async function removeFund(schemeCode: string) {
    setRemoveStatus(null);
    const res = await fetch(`/api/funds?code=${schemeCode}`, { method: 'DELETE', headers: { 'x-admin-passphrase': passphrase } });
    if (res.ok) { setRemoveStatus('✓ Removed'); void fetchFunds(); onRefresh(); }
    else { const err = await res.json() as { error: string }; setRemoveStatus(`❌ ${err.error}`); }
  }

  return (
    <div className="space-y-8 max-w-xl">
      <div>
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-widest mb-3">Your Funds</h2>
        {loading ? <div className="text-gray-500 text-sm">Loading…</div> : funds.length === 0 ? <div className="card p-6 text-center text-gray-500 text-sm">No active funds.</div> : (
          <div className="space-y-2">
            {funds.map(f => (
              <div key={f.id} className="card2 p-4 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-sm font-medium text-gray-200 truncate">{f.scheme_name}</div>
                  <div className="text-xs text-gray-600 mt-0.5">Code: {f.scheme_code} · {f.fund_type.replace(/_/g, ' ')}</div>
                </div>
                <button onClick={() => void removeFund(f.scheme_code)} className="text-xs text-red-500 hover:text-red-400 border border-red-900 hover:border-red-700 rounded px-3 py-1 transition-colors shrink-0">Remove</button>
              </div>
            ))}
          </div>
        )}
        {removeStatus && <div className={`text-sm mt-2 ${removeStatus.startsWith('✓') ? 'text-green-400' : 'text-red-400'}`}>{removeStatus}</div>}
      </div>

      <div>
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-widest mb-3">Add a Fund</h2>
        <div className="card p-5 space-y-4">
          <div>
            <label className="text-xs text-gray-500 block mb-1">Scheme Code (from AMFI / MFAPI)</label>
            <div className="flex gap-2">
              <input type="text" value={code} onChange={e => { setCode(e.target.value); setLookupName(null); }} placeholder="e.g. 120503" className="flex-1 bg-[rgba(12,4,8,0.7)] border border-[rgba(190,22,48,0.14)] rounded px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-red-500/50" />
              <button onClick={() => void lookup()} disabled={lookupLoading || !code.trim()} className="px-4 py-2 bg-[#1a1a1a] hover:bg-[#222] border border-[#333] text-sm rounded text-gray-300 disabled:opacity-40 transition-colors">{lookupLoading ? '…' : 'Look up'}</button>
            </div>
            {lookupName && <div className={`text-xs mt-1.5 ${lookupName.startsWith('✓') ? 'text-green-400' : 'text-red-400'}`}>{lookupName}</div>}
            <div className="text-xs text-gray-600 mt-1">Find the scheme code at <a href="https://mfapi.in" target="_blank" rel="noopener noreferrer" className="text-red-400/70 hover:text-red-300 hover:underline">mfapi.in</a></div>
          </div>
          <div>
            <label className="text-xs text-gray-500 block mb-1">Fund Type</label>
            <select value={fundType} onChange={e => setFundType(e.target.value)} className="w-full bg-[rgba(12,4,8,0.7)] border border-[rgba(190,22,48,0.14)] rounded px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-red-500/50">
              {FUND_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-500 block mb-1">Admin Passphrase (if set)</label>
            <input type="password" value={passphrase} onChange={e => setPass(e.target.value)} placeholder="Leave blank if not configured" className="w-full bg-[rgba(12,4,8,0.7)] border border-[rgba(190,22,48,0.14)] rounded px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-red-500/50" />
          </div>
          <button onClick={() => void addFund()} disabled={!lookupName?.startsWith('✓')} className="w-full py-2.5 btn-red text-sm font-medium">Add Fund</button>
          {addStatus && <div className={`text-sm ${addStatus.startsWith('✓') ? 'text-green-400' : 'text-red-400'}`}>{addStatus}</div>}
        </div>
      </div>

      <div className="card2 p-4 text-xs text-gray-500 space-y-2">
        <div className="font-medium text-gray-400">How to find your fund's scheme code</div>
        <ol className="list-decimal list-inside space-y-1">
          <li>Go to <a href="https://mfapi.in" target="_blank" rel="noopener noreferrer" className="text-red-400/70 hover:text-red-300 hover:underline">mfapi.in</a></li>
          <li>Search for your fund by name</li>
          <li>Copy the numeric scheme code (e.g. 120503)</li>
          <li>Paste it above, click "Look up", pick the fund type, and click "Add Fund"</li>
        </ol>
      </div>
    </div>
  );
}
