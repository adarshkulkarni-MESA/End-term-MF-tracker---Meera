// Fetches index price history from Yahoo Finance via yahoo-finance2

import yahooFinance from 'yahoo-finance2';

export interface IndexPoint { date: string; close: number }

export async function fetchIndexHistory(
  ticker: string,
  startDate: string,
  endDate: string,
): Promise<IndexPoint[]> {
  try {
    const result = await yahooFinance.historical(ticker, {
      period1: startDate,
      period2: endDate,
      interval: '1d',
    }) as Array<{ date: Date; close?: number; adjClose?: number }>;
    return result.map((row) => ({
      date:  row.date.toISOString().slice(0, 10),
      close: row.close ?? row.adjClose ?? 0,
    })).filter((r) => r.close > 0);
  } catch (err) {
    console.error(`Yahoo Finance fetch failed for ${ticker}:`, err);
    return [];
  }
}
