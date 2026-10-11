-- Meera MF Tracker – complete schema
-- Run this once in your Supabase SQL editor

-- ── 1. funds ──────────────────────────────────────────────────────────────────
create table if not exists funds (
  id          serial primary key,
  scheme_code text    not null unique,
  scheme_name text    not null,
  fund_type   text    not null,
  is_active   boolean not null default true,
  created_at  timestamptz default now()
);

-- ── 2. peer_funds ─────────────────────────────────────────────────────────────
create table if not exists peer_funds (
  id          serial primary key,
  scheme_code text not null unique,
  scheme_name text not null,
  fund_type   text not null
);

-- ── 3. nav_history ────────────────────────────────────────────────────────────
create table if not exists nav_history (
  id          serial primary key,
  scheme_code text    not null,
  nav_date    date    not null,
  nav         numeric(12,4) not null,
  unique (scheme_code, nav_date)
);
create index if not exists nav_history_code_date on nav_history(scheme_code, nav_date desc);

-- ── 4. market_indices ────────────────────────────────────────────────────────
create table if not exists market_indices (
  id          serial primary key,
  name        text not null unique,
  ticker      text not null,
  fund_type   text,
  is_active   boolean not null default true
);

-- ── 5. benchmark_map ─────────────────────────────────────────────────────────
create table if not exists benchmark_map (
  id          serial primary key,
  fund_type   text not null unique,
  index_name  text not null
);

-- ── 6. index_history ─────────────────────────────────────────────────────────
create table if not exists index_history (
  id          serial primary key,
  index_name  text    not null,
  price_date  date    not null,
  close_price numeric(14,4) not null,
  unique (index_name, price_date)
);
create index if not exists idx_history_name_date on index_history(index_name, price_date desc);

-- ── 7. pipeline_runs ─────────────────────────────────────────────────────────
create table if not exists pipeline_runs (
  id          serial primary key,
  run_date    date    not null,
  run_type    text    not null,
  status      text    not null,
  detail      jsonb,
  created_at  timestamptz default now()
);

-- ── 8. weekly_snapshots ──────────────────────────────────────────────────────
create table if not exists weekly_snapshots (
  id          serial primary key,
  week_date   date not null unique,
  data        jsonb not null,
  created_at  timestamptz default now()
);

-- ── 9. news_items ────────────────────────────────────────────────────────────
create table if not exists news_items (
  id          serial primary key,
  week_date   date    not null,
  headline    text    not null,
  source      text    not null,
  url         text,
  published_at timestamptz,
  created_at  timestamptz default now()
);
create index if not exists news_week on news_items(week_date desc);

-- ── 10. reports ──────────────────────────────────────────────────────────────
create table if not exists reports (
  id          serial primary key,
  week_date   date    not null unique,
  fund_summaries jsonb not null,
  verdict     text    not null,
  reason      text    not null,
  email_html  text    not null,
  sent_at     timestamptz,
  status      text    not null default 'generated',
  created_at  timestamptz default now()
);

-- ── Seed data ─────────────────────────────────────────────────────────────────

insert into market_indices (name, ticker, fund_type) values
  ('Nifty 50',          '^NSEI',    'large_cap'),
  ('Nifty Midcap 150',  '^NSEMDCP50', 'mid_cap'),
  ('Nifty Smallcap 100','^NSESC100', 'small_cap'),
  ('S&P 500',           '^GSPC',    'international')
on conflict (name) do nothing;

insert into benchmark_map (fund_type, index_name) values
  ('large_cap',     'Nifty 50'),
  ('mid_cap',       'Nifty Midcap 150'),
  ('small_cap',     'Nifty Smallcap 100'),
  ('international', 'S&P 500')
on conflict (fund_type) do nothing;

insert into funds (scheme_code, scheme_name, fund_type) values
  ('120503', 'UTI Nifty 50 Index Fund',                 'large_cap'),
  ('118989', 'Nippon India Growth Fund',                 'mid_cap'),
  ('125497', 'Nippon India Small Cap Fund',              'small_cap'),
  ('119551', 'HDFC Short Term Debt Fund',                'short_debt'),
  ('120594', 'Mirae Asset NYSE FANG+ ETF FoF',          'international')
on conflict (scheme_code) do nothing;

insert into peer_funds (scheme_code, scheme_name, fund_type) values
  ('120716', 'SBI Nifty Index Fund',             'large_cap'),
  ('120466', 'ICICI Prudential Nifty 50 Index',  'large_cap'),
  ('101305', 'HDFC Index Fund Nifty 50 Plan',    'large_cap'),
  ('118533', 'HDFC Mid-Cap Opportunities',        'mid_cap'),
  ('119028', 'Kotak Emerging Equity Fund',        'mid_cap'),
  ('118825', 'DSP Midcap Fund',                   'mid_cap'),
  ('120828', 'SBI Small Cap Fund',                'small_cap'),
  ('118778', 'Axis Small Cap Fund',               'small_cap'),
  ('120841', 'HDFC Small Cap Fund',               'small_cap'),
  ('119383', 'ICICI Prudential Short Term Fund',  'short_debt'),
  ('118534', 'HDFC Short Duration Fund',          'short_debt'),
  ('119326', 'Kotak Bond Short Term Plan',        'short_debt'),
  ('120835', 'DSP US Flexible Equity FoF',        'international'),
  ('120594', 'Mirae Asset NYSE FANG+ ETF FoF',    'international'),
  ('120841', 'Franklin India Feeder US Opp',      'international')
on conflict (scheme_code) do nothing;
