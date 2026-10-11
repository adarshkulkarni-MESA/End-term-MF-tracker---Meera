'use client';

import { useEffect, useState, useCallback } from 'react';
import ThisWeekTab  from '@/components/ThisWeekTab';
import FundsTab     from '@/components/FundsTab';
import TrendsTab    from '@/components/TrendsTab';
import MarketTab    from '@/components/MarketTab';
import ManageTab    from '@/components/ManageTab';

const TABS = [
  { id: 'week',   label: 'This Week' },
  { id: 'funds',  label: 'Funds' },
  { id: 'trends', label: 'Trends' },
  { id: 'market', label: 'Market & News' },
  { id: 'manage', label: 'Manage Funds' },
] as const;

type TabId = (typeof TABS)[number]['id'];

export interface DashboardData {
  asOf:          string;
  updatedAt:     string;
  performance:   FundPerf[];
  latestReport:  Report | null;
  snapshots:     Snapshot[];
  news:          NewsItem[];
  lastRun:       LastRun | null;
}

export interface FundPerf {
  schemeCode:    string;
  schemeName:    string;
  fundType:      string;
  asOf:          string;
  currentNav:    number | null;
  weekReturn:    number | null;
  monthReturn:   number | null;
  ytdReturn:     number | null;
  benchmarkName: string | null;
  benchmarkWeek:  number | null;
  benchmarkMonth: number | null;
  benchmarkYtd:   number | null;
  categoryWeek:   number | null;
  categoryMonth:  number | null;
  categoryYtd:    number | null;
}

export interface Report {
  week_date:     string;
  fund_summaries: { schemeName: string; summary: string }[];
  verdict:       string;
  reason:        string;
  created_at:    string;
}

export interface Snapshot {
  week_date: string;
  data:      { funds: FundPerf[] };
}

export interface NewsItem {
  headline:     string;
  source:       string;
  url:          string;
  published_at: string;
  week_date:    string;
}

export interface LastRun {
  run_date:   string;
  run_type:   string;
  status:     string;
  created_at: string;
}

export default function HomePage() {
  const [activeTab, setActiveTab] = useState<TabId>('week');
  const [data, setData]           = useState<DashboardData | null>(null);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/dashboard');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json() as DashboardData;
      setData(json);
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const fmt = (d: string) =>
    new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-[#1a1a1a] px-4 sm:px-8 py-4 flex items-center justify-between sticky top-0 bg-[#0a0a0a] z-10">
        <div>
          <div className="text-lg font-bold tracking-tight">📊 Meera's MF Tracker</div>
          <div className="text-xs text-gray-500 mt-0.5">
            {data?.lastRun
              ? `Data last updated ${fmt(data.lastRun.created_at)} · ${data.lastRun.status}`
              : loading ? 'Loading…' : 'No data yet'}
          </div>
        </div>
        <button onClick={() => void load()} className="text-xs text-gray-400 hover:text-white border border-[#222] rounded px-3 py-1.5 transition-colors">
          ↻ Refresh
        </button>
      </header>

      <nav className="border-b border-[#1a1a1a] px-4 sm:px-8 flex gap-0 overflow-x-auto">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)}
            className={`px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors ${
              activeTab === t.id ? 'tab-active' : 'tab-inactive'
            }`}>
            {t.label}
          </button>
        ))}
      </nav>

      <main className="flex-1 px-4 sm:px-8 py-6 max-w-6xl mx-auto w-full">
        {loading && <div className="flex items-center justify-center py-24 text-gray-500"><span className="animate-pulse">Loading data…</span></div>}
        {error && !loading && (
          <div className="card p-6 text-center">
            <div className="text-red-400 font-medium mb-2">Failed to load data</div>
            <div className="text-gray-500 text-sm mb-4">{error}</div>
            <button onClick={() => void load()} className="text-indigo-400 hover:text-indigo-300 text-sm">Try again</button>
          </div>
        )}
        {!loading && !error && data && (
          <>
            {activeTab === 'week'   && <ThisWeekTab  data={data} />}
            {activeTab === 'funds'  && <FundsTab     data={data} />}
            {activeTab === 'trends' && <TrendsTab    data={data} />}
            {activeTab === 'market' && <MarketTab    data={data} />}
            {activeTab === 'manage' && <ManageTab    onRefresh={load} />}
          </>
        )}
      </main>
    </div>
  );
}
