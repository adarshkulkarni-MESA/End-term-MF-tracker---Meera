'use client';

/* Coded dashboard preview — shown inside the landing page hero.
   Static mock data, no interactivity. */

import { ChevronDown, Search, Bell, Plus, MoreHorizontal, Home, CreditCard, ArrowUpRight, ArrowDownRight } from 'lucide-react';

const SIDEBAR_ITEMS = [
  { label: 'Home',         active: true,  badge: null },
  { label: 'My Funds',     active: false, badge: '4'  },
  { label: 'Performance',  active: false, badge: null },
  { label: 'Reports',      active: false, badge: null },
  { label: 'SIP Calc',     active: false, badge: null },
  { label: 'Manage',       active: false, badge: null },
];

const ACTION_BTNS = ['Track', 'Analyze', 'Compare', 'Report', 'SIP', 'Export'];

/* SVG area chart — cubic Bézier upward trend */
function AreaChart() {
  const W = 400, H = 80;
  const path  = 'M 0 68 C 40 68 55 58 100 52 C 145 46 160 62 200 48 C 240 34 275 38 320 26 C 350 18 375 20 400 16';
  const fill  = `M 0 68 C 40 68 55 58 100 52 C 145 46 160 62 200 48 C 240 34 275 38 320 26 C 350 18 375 20 400 16 L 400 ${H} L 0 ${H} Z`;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-20" preserveAspectRatio="none">
      <defs>
        <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="hsl(239 84% 67%)" stopOpacity="0.15" />
          <stop offset="100%" stopColor="hsl(239 84% 67%)" stopOpacity="0"   />
        </linearGradient>
      </defs>
      <path d={fill} fill="url(#chartGrad)" />
      <path d={path} fill="none" stroke="hsl(239 84% 67%)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function TopBar() {
  return (
    <div className="flex items-center gap-3 px-4 py-2.5 border-b border-gray-100 bg-white shrink-0">
      {/* Logo */}
      <div className="flex items-center gap-1.5 shrink-0">
        <div className="w-6 h-6 rounded-md bg-gray-900 flex items-center justify-center text-white text-[10px] font-bold">M</div>
        <span className="text-[11px] font-semibold text-gray-800">Meera's Tracker</span>
        <ChevronDown className="w-3 h-3 text-gray-400" />
      </div>

      {/* Divider */}
      <div className="w-px h-4 bg-gray-200 mx-1" />

      {/* Search */}
      <div className="flex-1 flex items-center gap-2 bg-gray-50 rounded-md px-2.5 py-1.5 border border-gray-100">
        <Search className="w-3 h-3 text-gray-400 shrink-0" />
        <span className="text-[10px] text-gray-400 flex-1">Search funds…</span>
        <span className="text-[9px] bg-white border border-gray-200 rounded px-1 py-0.5 text-gray-400 font-mono">⌘K</span>
      </div>

      {/* Right actions */}
      <div className="flex items-center gap-2 shrink-0">
        <button className="text-[10px] bg-gray-900 text-white rounded-md px-2.5 py-1.5 font-medium">Add Fund</button>
        <div className="relative">
          <Bell className="w-3.5 h-3.5 text-gray-500" />
          <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-blue-500 rounded-full" />
        </div>
        <div className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 text-[9px] font-bold">MK</div>
      </div>
    </div>
  );
}

function Sidebar() {
  return (
    <div className="w-36 shrink-0 border-r border-gray-100 bg-white flex flex-col py-3 px-2 gap-0.5">
      {SIDEBAR_ITEMS.map(item => (
        <div key={item.label}
          className={`flex items-center justify-between px-2.5 py-1.5 rounded-md text-[10px] font-medium cursor-default ${
            item.active ? 'bg-gray-100 text-gray-900' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <span>{item.label}</span>
          {item.badge && (
            <span className="bg-gray-200 text-gray-600 text-[9px] rounded-full px-1.5 py-0.5 font-semibold">{item.badge}</span>
          )}
        </div>
      ))}
      <div className="mt-3 pt-3 border-t border-gray-100">
        <div className="text-[9px] text-gray-400 px-2.5 mb-1.5 font-semibold uppercase tracking-wide">Tools</div>
        {['SIP Planner', 'Screener', 'Alerts'].map(item => (
          <div key={item} className="px-2.5 py-1.5 text-[10px] text-gray-400 cursor-default">{item}</div>
        ))}
      </div>
    </div>
  );
}

function BalanceCard() {
  return (
    <div className="flex-1 basis-0 bg-white rounded-xl border border-gray-100 p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] font-semibold text-gray-800">Portfolio Value</span>
          <div className="w-4 h-4 rounded-full bg-green-50 flex items-center justify-center">
            <span className="text-green-500 text-[8px]">✓</span>
          </div>
        </div>
      </div>
      <div>
        <div className="text-xl font-bold text-gray-900 leading-none">
          ₹84,50,<span className="text-sm text-gray-400 font-medium">190.32</span>
        </div>
      </div>
      <div className="flex items-center gap-4 text-[10px]">
        <div>
          <div className="text-gray-400 mb-0.5">Last 30 Days</div>
          <div className="flex items-center gap-1 text-green-500 font-semibold">
            <ArrowUpRight className="w-3 h-3" />+₹1.8L
          </div>
        </div>
        <div>
          <div className="text-gray-400 mb-0.5">Redeemed</div>
          <div className="flex items-center gap-1 text-red-400 font-semibold">
            <ArrowDownRight className="w-3 h-3" />−₹45K
          </div>
        </div>
      </div>
      <AreaChart />
    </div>
  );
}

function AccountsCard() {
  const accounts = [
    { name: 'Equity Funds',  value: '₹52,18,240.00' },
    { name: 'Debt Funds',    value: '₹24,06,750.00' },
    { name: 'Hybrid Funds',  value: '₹8,25,200.32'  },
  ];
  return (
    <div className="flex-1 basis-0 bg-white rounded-xl border border-gray-100 p-4 flex flex-col gap-2">
      <div className="flex items-center justify-between mb-1">
        <span className="text-[11px] font-semibold text-gray-800">Funds</span>
        <div className="flex items-center gap-2 text-gray-400">
          <Plus className="w-3 h-3" />
          <MoreHorizontal className="w-3 h-3" />
        </div>
      </div>
      {accounts.map((a, i) => (
        <div key={a.name} className={`flex items-center justify-between py-2.5 text-[10px] ${i < accounts.length - 1 ? 'border-b border-gray-50' : ''}`}>
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-md bg-indigo-50 flex items-center justify-center">
              <CreditCard className="w-2.5 h-2.5 text-indigo-500" />
            </div>
            <span className="text-gray-600 font-medium">{a.name}</span>
          </div>
          <span className="text-gray-800 font-semibold tabular-nums">{a.value}</span>
        </div>
      ))}
    </div>
  );
}

function TransactionsTable() {
  const rows = [
    { date: '11 Oct', desc: 'PPFAS Flexi Cap',   amount: '−₹10,000', status: 'Pending',   statusCls: 'bg-amber-50 text-amber-600'  },
    { date: '08 Oct', desc: 'Mirae Asset LC',     amount: '+₹50,000', status: 'Completed', statusCls: 'bg-green-50 text-green-600'  },
    { date: '01 Oct', desc: 'SIP — SBI Small',    amount: '−₹5,000',  status: 'Completed', statusCls: 'bg-green-50 text-green-600'  },
    { date: '01 Oct', desc: 'SIP — HDFC Mid',     amount: '−₹5,000',  status: 'Completed', statusCls: 'bg-green-50 text-green-600'  },
  ];
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-4">
      <div className="text-[11px] font-semibold text-gray-800 mb-3">Recent Transactions</div>
      <table className="w-full">
        <thead>
          <tr className="text-[9px] text-gray-400 uppercase tracking-wide">
            <th className="text-left pb-2 font-semibold">Date</th>
            <th className="text-left pb-2 font-semibold">Fund</th>
            <th className="text-right pb-2 font-semibold">Amount</th>
            <th className="text-right pb-2 font-semibold">Status</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className={`text-[10px] ${i < rows.length - 1 ? 'border-b border-gray-50' : ''}`}>
              <td className="py-2 text-gray-400">{r.date}</td>
              <td className="py-2 text-gray-700 font-medium">{r.desc}</td>
              <td className={`py-2 text-right font-semibold tabular-nums ${r.amount.startsWith('+') ? 'text-green-500' : 'text-gray-700'}`}>{r.amount}</td>
              <td className="py-2 text-right">
                <span className={`text-[9px] rounded-full px-2 py-0.5 font-semibold ${r.statusCls}`}>{r.status}</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function DashboardPreview() {
  return (
    <div
      className="rounded-2xl overflow-hidden select-none pointer-events-none"
      style={{
        background:   'rgba(255,255,255,0.4)',
        border:       '1px solid rgba(255,255,255,0.5)',
        boxShadow:    'var(--shadow-dashboard)',
        backdropFilter: 'blur(12px)',
      }}
    >
      <div className="p-3 md:p-4">
        <div className="bg-white rounded-xl overflow-hidden flex flex-col" style={{ fontFamily: 'var(--font-inter, Inter, sans-serif)' }}>
          <TopBar />
          <div className="flex flex-1 min-h-0">
            <Sidebar />
            {/* Main content */}
            <div className="flex-1 flex flex-col bg-gray-50/60 p-4 gap-4 overflow-hidden">
              {/* Greeting + actions */}
              <div>
                <div className="text-xs font-semibold text-gray-800 mb-3">Welcome, Meera</div>
                <div className="flex flex-wrap items-center gap-2">
                  {ACTION_BTNS.map((b, i) => (
                    <button key={b}
                      className={`text-[10px] rounded-full px-3 py-1.5 font-medium ${i === 0
                        ? 'bg-gray-900 text-white'
                        : 'bg-white border border-gray-200 text-gray-600'
                      }`}
                    >
                      {b}
                    </button>
                  ))}
                  <button className="text-[10px] text-gray-400 ml-1">Customize</button>
                </div>
              </div>

              {/* Balance + Accounts cards */}
              <div className="flex gap-3">
                <BalanceCard />
                <AccountsCard />
              </div>

              {/* Transactions */}
              <TransactionsTable />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
