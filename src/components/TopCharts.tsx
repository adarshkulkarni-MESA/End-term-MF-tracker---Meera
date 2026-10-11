'use client';

const STOCKS = [
  {
    name: 'Reliance Industries', sym: 'RELIANCE', sector: 'Energy',
    price: '₹2,941', change: '+0.85%', up: true,
    prices: [2780, 2810, 2795, 2835, 2870, 2855, 2900, 2880, 2910, 2930, 2945, 2941],
  },
  {
    name: 'Tata Consultancy Services', sym: 'TCS', sector: 'IT',
    price: '₹4,312', change: '−0.32%', up: false,
    prices: [4450, 4420, 4385, 4350, 4325, 4360, 4400, 4380, 4350, 4322, 4330, 4312],
  },
  {
    name: 'HDFC Bank', sym: 'HDFCBANK', sector: 'Banking',
    price: '₹1,742', change: '+2.17%', up: true,
    prices: [1620, 1648, 1680, 1710, 1695, 1725, 1740, 1728, 1750, 1735, 1758, 1742],
  },
  {
    name: 'Infosys', sym: 'INFY', sector: 'IT',
    price: '₹1,876', change: '−0.45%', up: false,
    prices: [1920, 1898, 1872, 1885, 1904, 1880, 1865, 1875, 1892, 1875, 1884, 1876],
  },
  {
    name: 'ICICI Bank', sym: 'ICICIBANK', sector: 'Banking',
    price: '₹1,284', change: '+1.23%', up: true,
    prices: [1180, 1195, 1220, 1215, 1240, 1258, 1245, 1268, 1255, 1272, 1280, 1284],
  },
  {
    name: 'Bharti Airtel', sym: 'BHARTIARTL', sector: 'Telecom',
    price: '₹1,805', change: '+0.03%', up: true,
    prices: [1620, 1658, 1695, 1730, 1715, 1748, 1770, 1755, 1785, 1795, 1803, 1805],
  },
];

function Sparkline({ prices, up }: { prices: number[]; up: boolean }) {
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const rng = max - min || 1;
  const W = 220, H = 64, P = 4;

  const pts = prices.map((v, i) => {
    const x = P + (i / (prices.length - 1)) * (W - P * 2);
    const y = P + (1 - (v - min) / rng) * (H - P * 2);
    return [x, y] as [number, number];
  });

  const path   = `M ${pts.map(p => p.join(',')).join(' L ')}`;
  const fill   = `M ${pts[0].join(',')} L ${pts.map(p => p.join(',')).join(' L ')} L ${W - P},${H} L ${P},${H} Z`;
  const stroke = up ? '#10b981' : '#f87171';
  const bg     = up ? 'rgba(16,185,129,0.08)' : 'rgba(248,113,113,0.08)';

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-14">
      <path d={fill} fill={bg} />
      <path d={path} fill="none" stroke={stroke} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={pts[pts.length - 1][0]} cy={pts[pts.length - 1][1]} r="2.5" fill={stroke} />
    </svg>
  );
}

export default function TopCharts() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-bold text-gray-100 mb-1">Top Charts</h1>
        <p className="text-sm text-gray-500">Price trend overview for major Indian stocks — past 12 weeks</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {STOCKS.map(s => (
          <div key={s.sym} className="card p-5">
            <div className="flex justify-between items-start mb-3">
              <div>
                <div className="text-xs text-gray-600 uppercase tracking-wide mb-0.5">{s.sector}</div>
                <div className="text-sm font-semibold text-gray-200 leading-snug">{s.name}</div>
                <div className="text-xs text-gray-600 mt-0.5">{s.sym} · NSE</div>
              </div>
              <div className="text-right shrink-0 ml-3">
                <div className="text-base font-bold text-gray-100">{s.price}</div>
                <div className={`text-sm font-semibold mt-0.5 ${s.up ? 'text-emerald-400' : 'text-red-400'}`}>
                  <span className="text-xs">{s.up ? '▲' : '▼'}</span> {s.change}
                </div>
              </div>
            </div>
            <Sparkline prices={s.prices} up={s.up} />
            <div className="flex justify-between text-xs text-gray-700 mt-1">
              <span>12W ago</span>
              <span>Today</span>
            </div>
          </div>
        ))}
      </div>
      <div className="card2 p-4 text-center text-xs text-gray-600">
        Charts show illustrative price trends for reference only. Not live market data — not investment advice.
      </div>
    </div>
  );
}
