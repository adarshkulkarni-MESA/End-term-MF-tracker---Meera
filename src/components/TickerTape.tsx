'use client';

const TICKERS = [
  { sym: 'NIFTY 50',   price: '24,788', change: '+1.12%', up: true  },
  { sym: 'SENSEX',     price: '81,332', change: '+1.05%', up: true  },
  { sym: 'NIFTY BANK', price: '55,256', change: '+1.36%', up: true  },
  { sym: 'RELIANCE',   price: '2,941',  change: '+0.85%', up: true  },
  { sym: 'TCS',        price: '4,312',  change: '-0.32%', up: false },
  { sym: 'HDFCBANK',   price: '1,742',  change: '+2.17%', up: true  },
  { sym: 'INFOSYS',    price: '1,876',  change: '-0.45%', up: false },
  { sym: 'ICICIBANK',  price: '1,284',  change: '+1.23%', up: true  },
  { sym: 'BAJFINANCE', price: '960',    change: '+0.42%', up: true  },
  { sym: 'BHARTIARTL', price: '1,805',  change: '+0.03%', up: true  },
  { sym: 'HINDUNILVR', price: '2,456',  change: '-0.78%', up: false },
  { sym: 'ITC',        price: '465',    change: '+1.56%', up: true  },
  { sym: 'KOTAKBANK',  price: '1,876',  change: '+0.94%', up: true  },
  { sym: 'LT',         price: '3,521',  change: '+0.67%', up: true  },
  { sym: 'WIPRO',      price: '576',    change: '-0.23%', up: false },
  { sym: 'MARUTI',     price: '12,456', change: '+1.34%', up: true  },
  { sym: 'TITAN',      price: '3,876',  change: '+2.10%', up: true  },
  { sym: 'SBIN',       price: '834',    change: '+1.87%', up: true  },
  { sym: 'NESTLEIND',  price: '2,234',  change: '-0.56%', up: false },
  { sym: 'SUNPHARMA',  price: '1,742',  change: '+0.91%', up: true  },
];

// Duplicate for seamless infinite loop
const DOUBLED = [...TICKERS, ...TICKERS];

export default function TickerTape() {
  return (
    <div className="overflow-hidden bg-[#050508] border-b border-[#1a1a2e] py-2 shrink-0">
      <div className="ticker-track gap-0">
        {DOUBLED.map((t, i) => (
          <span key={i} className="flex items-center gap-2 text-xs px-4 whitespace-nowrap">
            <span className="text-gray-300 font-semibold tracking-wide">{t.sym}</span>
            <span className="text-gray-500">{t.price}</span>
            <span className={`font-medium flex items-center gap-0.5 ${t.up ? 'text-emerald-400' : 'text-red-400'}`}>
              <span className="text-[10px]">{t.up ? '▲' : '▼'}</span>
              {t.change}
            </span>
            <span className="text-[#1a1a2e] ml-3 select-none">·</span>
          </span>
        ))}
      </div>
    </div>
  );
}
