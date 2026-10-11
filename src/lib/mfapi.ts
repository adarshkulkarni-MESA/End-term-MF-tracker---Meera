// Fetches NAV data from MFAPI.in (free, no API key needed)

const BASE = 'https://api.mfapi.in/mf';

export interface MFApiNav {
  date: string;
  nav:  string;
}

export interface MFApiResponse {
  meta: {
    fund_house: string;
    scheme_type: string;
    scheme_category: string;
    scheme_code: number;
    scheme_name: string;
  };
  data: MFApiNav[];
  status: string;
}

function normalise(ddmmyyyy: string): string {
  const [d, m, y] = ddmmyyyy.split('-');
  return `${y}-${m}-${d}`;
}

export async function fetchNavHistory(
  schemeCode: string,
): Promise<{ date: string; nav: number }[]> {
  const res = await fetch(`${BASE}/${schemeCode}`, {
    headers: { Accept: 'application/json' },
    next: { revalidate: 0 },
  });
  if (!res.ok) throw new Error(`MFAPI ${schemeCode}: HTTP ${res.status}`);
  const json: MFApiResponse = await res.json();
  if (json.status !== 'SUCCESS') throw new Error(`MFAPI ${schemeCode}: status ${json.status}`);

  return json.data.map(d => ({
    date: normalise(d.date),
    nav:  parseFloat(d.nav),
  }));
}

export async function lookupScheme(
  schemeCode: string,
): Promise<{ schemeName: string; category: string } | null> {
  try {
    const res = await fetch(`${BASE}/${schemeCode}`, {
      headers: { Accept: 'application/json' },
      next: { revalidate: 0 },
    });
    if (!res.ok) return null;
    const json: MFApiResponse = await res.json();
    if (json.status !== 'SUCCESS') return null;
    return { schemeName: json.meta.scheme_name, category: json.meta.scheme_category };
  } catch {
    return null;
  }
}
