'use client';

import { useEffect, useState, useCallback } from 'react';
import TickerTape            from '@/components/TickerTape';
import HomeTab               from '@/components/HomeTab';
import ThisWeekTab           from '@/components/ThisWeekTab';
import FundsTab              from '@/components/FundsTab';
import TrendsTab             from '@/components/TrendsTab';
import TopCharts             from '@/components/TopCharts';
import Screener              from '@/components/Screener';
import MarketTab             from '@/components/MarketTab';
import SIPCalculator         from '@/components/SIPCalculator';
import PerformanceCalculator from '@/components/PerformanceCalculator';
import ManageTab             from '@/components/ManageTab';

const NAV_ITEMS = [
  { id: 'home',        label: 'Home',               icon: '🏠' },
  { id: 'week',        label: 'This Week',           icon: '📊' },
  { id: 'funds',       label: 'My Funds',            icon: '💼' },
  { id: 'trends',      label: 'Trends',              icon: '📈' },
  { id: 'charts',      label: 'Top Charts',          icon: '📉' },
  { id: 'screener',    label: 'Stock Screener',      icon: '🔍' },
  { id: 'news',        label: 'Market News',         icon: '📰' },
  { id: 'sip',         label: 'SIP Calculator',      icon: '🧮' },
  { id: 'performance', label: 'Performance Tracker', icon: '⚡' },
  { id: 'manage',      label: 'Manage Funds',        icon: '⚙️' },
] as const;

type TabId = (typeof NAV_ITEMS)[number]['id'];

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
  schemeCode:     string;
  schemeName:     string;
  fundType:       string;
  asOf:           string;
  currentNav:     number | null;
  weekReturn:     number | null;
  monthReturn:    number | null;
  ytdReturn:      number | null;
  benchmarkName:  string | null;
  benchmarkWeek:  number | null;
  benchmarkMonth: number | null;
  benchmarkYtd:   number | null;
  categoryWeek:   number | null;
  categoryMonth:  number | null;
  categoryYtd:    number | null;
}

export interface Report {
  week_date:      string;
  fund_summaries: { schemeName: string; summary: string }[];
  verdict:        string;
  reason:         string;
  created_at:     string;
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

export default function AppRoot() {
  const [activeTab,   setActiveTab]   = useState<TabId>('home');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [data,        setData]        = useState<DashboardData | null>(null);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/dashboard');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setData(await res.json() as DashboardData);
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  function navigate(tab: string) {
    setActiveTab(tab as TabId);
    setSidebarOpen(false);
  }

  const activeLabel = NAV_ITEMS.find(n => n.id === activeTab)?.label ?? '';

  // Tabs that don't need the API at all — render immediately
  const standaloneContent =
    activeTab === 'charts'      ? <TopCharts /> :
    activeTab === 'screener'    ? <Screener /> :
    activeTab === 'sip'         ? <SIPCalculator /> :
    activeTab === 'performance' ? <PerformanceCalculator /> :
    null;

  const sidebar = (
    <>
      {/* Logo */}
      <div className="px-5 py-5 border-b border-[#1a1a2e] shrink-0">
        <div className="text-sm font-bold text-white leading-tight">📊 Meera's Tracker</div>
        <div className="text-xs text-indigo-400/60 mt-0.5">MF Intelligence Dashboard</div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-0.5">
        {NAV_ITEMS.map(item => (
          <button
            key={item.id}
            onClick={() => navigate(item.id)}
            className={`nav-item ${activeTab === item.id ? 'active' : ''}`}
          >
            <span className="text-base leading-none shrink-0">{item.icon}</span>
            <span>{item.label}</span>
          </button>
        ))}
      </nav>

      {/* Status footer */}
      <div className="px-5 py-4 border-t border-[#1a1a2e] shrink-0">
        <div className="text-xs text-gray-700">
          {data?.lastRun
            ? `Updated ${new Date(data.lastRun.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}`
            : loading ? 'Loading…' : 'Awaiting data'}
        </div>
      </div>
    </>
  );

  return (
    <div className="min-h-screen flex flex-col">
      {/* Scrolling ticker */}
      <TickerTape />

      <div className="flex flex-1">
        {/* Mobile drawer overlay */}
        {sidebarOpen && (
          <>
            <div
              className="fixed inset-0 bg-black/60 z-40 lg:hidden"
              onClick={() => setSidebarOpen(false)}
            />
            <aside className="fixed inset-y-0 left-0 w-64 z-50 flex flex-col bg-[#08080f] border-r border-[#1a1a2e] overflow-y-auto lg:hidden">
              {sidebar}
            </aside>
          </>
        )}

        {/* Desktop sidebar — sticky */}
        <aside className="hidden lg:flex flex-col w-64 shrink-0 bg-[#08080f] border-r border-[#1a1a2e] sticky top-0 h-screen overflow-y-auto">
          {sidebar}
        </aside>

        {/* Main panel */}
        <main className="flex-1 min-w-0 flex flex-col">
          {/* Top header bar */}
          <header className="sticky top-0 z-10 bg-[#0a0a0a]/95 backdrop-blur-sm border-b border-[#1a1a2e] px-4 sm:px-6 py-3 flex items-center gap-3 shrink-0">
            <button
              onClick={() => setSidebarOpen(v => !v)}
              className="lg:hidden text-gray-400 hover:text-white text-xl leading-none w-8"
              aria-label="Toggle menu"
            >
              ☰
            </button>
            <span className="text-sm font-semibold text-gray-200 flex-1 truncate">{activeLabel}</span>
            <button
              onClick={() => void load()}
              className="text-xs text-gray-500 hover:text-white border border-[#222] rounded px-3 py-1.5 transition-colors shrink-0"
            >
              ↻ Refresh
            </button>
          </header>

          {/* Content area */}
          <div className="flex-1 px-4 sm:px-6 py-6 max-w-5xl mx-auto w-full">
            {/* Standalone tabs (no dashboard data) */}
            {standaloneContent}

            {/* Loading / error (data-dependent tabs only) */}
            {!standaloneContent && loading && (
              <div className="flex items-center justify-center py-24 text-gray-500">
                <span className="animate-pulse text-sm">Loading dashboard…</span>
              </div>
            )}
            {!standaloneContent && error && !loading && (
              <div className="card p-8 text-center">
                <div className="text-red-400 font-medium mb-2">Failed to load data</div>
                <div className="text-gray-500 text-sm mb-4">{error}</div>
                <button onClick={() => void load()} className="text-indigo-400 hover:text-indigo-300 text-sm">
                  Try again
                </button>
              </div>
            )}

            {/* Data-dependent tabs */}
            {!standaloneContent && !loading && !error && data && (
              <>
                {activeTab === 'home'   && <HomeTab data={data} onNavigate={navigate} />}
                {activeTab === 'week'   && <ThisWeekTab data={data} />}
                {activeTab === 'funds'  && <FundsTab data={data} />}
                {activeTab === 'trends' && <TrendsTab data={data} />}
                {activeTab === 'news'   && <MarketTab data={data} />}
                {activeTab === 'manage' && <ManageTab onRefresh={load} />}
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
