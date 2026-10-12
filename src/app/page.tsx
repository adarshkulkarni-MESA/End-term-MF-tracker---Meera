'use client';

import { useEffect, useState, useCallback } from 'react';
import StarField             from '@/components/StarField';
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
import PortfolioTab          from '@/components/PortfolioTab';
import GoalsTab              from '@/components/GoalsTab';
import RiskTab               from '@/components/RiskTab';

const NAV_ITEMS = [
  { id: 'home',        label: 'Home',               icon: '🏠' },
  { id: 'week',        label: 'This Week',           icon: '📊' },
  { id: 'funds',       label: 'My Funds',            icon: '💼' },
  { id: 'portfolio',   label: 'Portfolio',           icon: '💹' },
  { id: 'trends',      label: 'Trends',              icon: '📈' },
  { id: 'risk',        label: 'Risk Analysis',       icon: '⚠️' },
  { id: 'goals',       label: 'Goal Planner',        icon: '🎯' },
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

  const standaloneContent =
    activeTab === 'charts'      ? <TopCharts /> :
    activeTab === 'screener'    ? <Screener /> :
    activeTab === 'sip'         ? <SIPCalculator /> :
    activeTab === 'performance' ? <PerformanceCalculator /> :
    activeTab === 'goals'       ? <GoalsTab data={data ?? { asOf: '', updatedAt: '', performance: [], latestReport: null, snapshots: [], news: [], lastRun: null }} /> :
    null;

  const sidebar = (
    <>
      <div className="px-5 py-5 shrink-0" style={{ borderBottom: '1px solid rgba(80,60,180,0.15)' }}>
        {/* Logo mark */}
        <div className="flex items-center gap-2 mb-1">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center text-sm"
            style={{ background: 'linear-gradient(135deg,#4f46e5,#7c3aed)', boxShadow: '0 0 14px rgba(139,92,246,0.35)' }}>
            ✦
          </div>
          <div>
            <div className="text-sm font-bold text-white leading-tight">Meera's Tracker</div>
            <div className="text-[10px]" style={{ color: 'rgba(165,148,255,0.5)' }}>MF Intelligence</div>
          </div>
        </div>
      </div>
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
      <div className="px-5 py-4 shrink-0" style={{ borderTop: '1px solid rgba(80,60,180,0.12)' }}>
        <div className="text-xs" style={{ color: 'rgba(100,90,160,0.7)' }}>
          {data?.lastRun
            ? `Updated ${new Date(data.lastRun.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}`
            : loading ? 'Loading…' : 'Awaiting data'}
        </div>
      </div>
    </>
  );

  return (
    <div className="min-h-screen flex flex-col" style={{ position: 'relative', zIndex: 0 }}>
      {/* Animated starfield canvas — fixed behind everything */}
      <StarField />

      <TickerTape performance={data?.performance} />

      <div className="flex flex-1" style={{ position: 'relative', zIndex: 1 }}>
        {sidebarOpen && (
          <>
            <div
              className="fixed inset-0 z-40 lg:hidden"
              style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}
              onClick={() => setSidebarOpen(false)}
            />
            <aside className="fixed inset-y-0 left-0 w-64 z-50 flex flex-col overflow-y-auto lg:hidden"
              style={{ background: 'rgba(6,6,20,0.97)', borderRight: '1px solid rgba(80,60,180,0.18)', backdropFilter: 'blur(20px)' }}>
              {sidebar}
            </aside>
          </>
        )}

        <aside className="hidden lg:flex flex-col w-64 shrink-0 sticky top-0 h-screen overflow-y-auto"
          style={{ background: 'rgba(6,6,20,0.92)', borderRight: '1px solid rgba(80,60,180,0.15)', backdropFilter: 'blur(20px)' }}>
          {sidebar}
        </aside>

        <main className="flex-1 min-w-0 flex flex-col">
          <header className="sticky top-0 z-10 px-4 sm:px-6 py-3 flex items-center gap-3 shrink-0"
            style={{ background: 'rgba(4,4,14,0.92)', borderBottom: '1px solid rgba(80,60,180,0.12)', backdropFilter: 'blur(16px)' }}>
            <button
              onClick={() => setSidebarOpen(v => !v)}
              className="lg:hidden text-xl leading-none w-8 transition-colors"
              style={{ color: 'var(--text-moon)' }}
              aria-label="Toggle menu"
            >
              ☰
            </button>
            <span className="text-sm font-semibold flex-1 truncate" style={{ color: 'var(--text-star)' }}>
              {activeLabel}
            </span>
            <button
              onClick={() => void load()}
              className="text-xs rounded px-3 py-1.5 transition-colors shrink-0"
              style={{ color: 'var(--text-moon)', border: '1px solid rgba(80,60,180,0.2)' }}
            >
              ↻ Refresh
            </button>
          </header>

          <div className="flex-1 px-4 sm:px-6 py-6 max-w-5xl mx-auto w-full">
            {standaloneContent}

            {!standaloneContent && loading && (
              <div className="flex items-center justify-center py-24" style={{ color: 'var(--text-dim)' }}>
                <span className="animate-pulse text-sm">Loading dashboard…</span>
              </div>
            )}
            {!standaloneContent && error && !loading && (
              <div className="card p-8 text-center">
                <div className="text-red-400 font-medium mb-2">Failed to load data</div>
                <div className="text-sm mb-4" style={{ color: 'var(--text-moon)' }}>{error}</div>
                <button onClick={() => void load()} className="text-indigo-400 hover:text-indigo-300 text-sm">
                  Try again
                </button>
              </div>
            )}

            {!standaloneContent && !loading && !error && data && (
              <>
                {activeTab === 'home'      && <HomeTab      data={data} onNavigate={navigate} />}
                {activeTab === 'week'      && <ThisWeekTab  data={data} />}
                {activeTab === 'funds'     && <FundsTab     data={data} />}
                {activeTab === 'portfolio' && <PortfolioTab data={data} />}
                {activeTab === 'trends'    && <TrendsTab    data={data} />}
                {activeTab === 'risk'      && <RiskTab      data={data} />}
                {activeTab === 'news'      && <MarketTab    data={data} />}
                {activeTab === 'manage'    && <ManageTab    onRefresh={load} />}
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
