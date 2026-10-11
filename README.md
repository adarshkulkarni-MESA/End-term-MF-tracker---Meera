# Meera's MF Tracker

A personal mutual fund intelligence tracker for non-finance professionals. Fetches daily NAV data, computes returns vs benchmarks and category peers, generates plain-language Saturday reports via Gemini AI, and emails them via Resend.

## Features

- **Daily NAV pipeline** — fetches NAVs from MFAPI.in for 5 funds + peer funds
- **Index tracking** — Nifty 50, Nifty Midcap 150, Nifty Smallcap 100, S&P 500 via Yahoo Finance
- **Performance comparison** — week, month, YTD returns vs benchmark and category average
- **Saturday reports** — plain-language AI-written email summaries, with a verdict
- **Market news** — filtered RSS headlines from ET, Moneycontrol, Mint
- **Dark-mode dashboard** — 5 tabs: This Week, Funds, Trends, Market & News, Manage Funds
- **No-code fund management** — add/remove funds by scheme code via the web form

## Stack

- **Next.js 16 + TypeScript** — frontend & API routes
- **Supabase** — database (NAV history, reports, snapshots)
- **Vercel** — hosting + cron jobs
- **MFAPI.in** — free NAV data (no API key)
- **Yahoo Finance** — index price data
- **Gemini 1.5 Flash** — AI report writing
- **Resend** — email delivery

## Quick start

See [SETUP.md](./SETUP.md) for the full deployment guide.

## API routes

| Route | Description |
|-------|-------------|
| `GET /api/performance` | Per-fund returns vs benchmark |
| `GET /api/funds` | List active funds |
| `POST /api/funds` | Add a fund |
| `DELETE /api/funds?code=XXXXX` | Remove a fund |
| `GET /api/funds/lookup?code=XXXXX` | Look up scheme name |
| `GET /api/report` | Latest weekly report |
| `POST /api/send-report` | Trigger weekly report manually |
| `GET /api/dashboard` | All dashboard data in one call |
| `GET /api/cron/daily` | Daily NAV pipeline |
| `GET /api/cron/weekly` | Weekly report pipeline |
