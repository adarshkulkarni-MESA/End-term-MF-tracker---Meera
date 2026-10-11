// Fetch market-relevant news from free RSS feeds

import { parseStringPromise } from 'xml2js';

export interface NewsItem {
  headline:    string;
  source:      string;
  url:         string;
  publishedAt: string;
}

const FEEDS = [
  {
    source: 'Economic Times Markets',
    url: 'https://economictimes.indiatimes.com/markets/rssfeeds/1977021501.cms',
  },
  {
    source: 'Moneycontrol Markets',
    url: 'https://www.moneycontrol.com/rss/latestnews.xml',
  },
  {
    source: 'Mint Markets',
    url: 'https://www.livemint.com/rss/markets',
  },
];

const KEEP_KEYWORDS = [
  'rbi', 'rate', 'inflation', 'repo', 'fii', 'dii', 'nifty', 'sensex',
  'gdp', 'oil', 'crude', 'rupee', 'dollar', 'fed', 'global', 'market',
  'mutual fund', 'sebi', 'equity', 'debt', 'bond', 'index', 'rally',
  'fall', 'crash', 'surge', 'drop', 'sell', 'buy', 'invest',
];

function isRelevant(headline: string): boolean {
  const lower = headline.toLowerCase();
  return KEEP_KEYWORDS.some(kw => lower.includes(kw));
}

async function fetchFeed(source: string, feedUrl: string): Promise<NewsItem[]> {
  try {
    const res = await fetch(feedUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0 (MF Tracker)' },
      signal:  AbortSignal.timeout(10_000),
    });
    if (!res.ok) return [];
    const xml  = await res.text();
    const parsed = await parseStringPromise(xml, { explicitArray: false });
    const channel = parsed?.rss?.channel;
    if (!channel) return [];
    const items: unknown[] = Array.isArray(channel.item) ? channel.item : [channel.item].filter(Boolean);
    return items.map((it: unknown) => {
      const item = it as Record<string, string>;
      return {
        headline:    (item.title ?? '').toString().trim(),
        source,
        url:         (item.link ?? item.guid ?? '').toString().trim(),
        publishedAt: item.pubDate ? new Date(item.pubDate.toString()).toISOString() : new Date().toISOString(),
      };
    });
  } catch {
    return [];
  }
}

export async function fetchMarketNews(maxItems = 15): Promise<NewsItem[]> {
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const allItems = (
    await Promise.all(FEEDS.map(f => fetchFeed(f.source, f.url)))
  ).flat();

  return allItems
    .filter(item => {
      const pub = new Date(item.publishedAt);
      return pub >= sevenDaysAgo && isRelevant(item.headline);
    })
    .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt))
    .slice(0, maxItems);
}
