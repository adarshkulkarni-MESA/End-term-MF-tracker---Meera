// Pure return-math helpers — no I/O, fully testable

export interface NavPoint { date: string; nav: number }

export function navOnDate(points: NavPoint[], targetDate: string): number | null {
  const sorted = [...points].sort((a, b) => b.date.localeCompare(a.date));
  const found  = sorted.find(p => p.date <= targetDate);
  return found ? found.nav : null;
}

export function pctReturn(navStart: number | null, navEnd: number | null): number | null {
  if (navStart == null || navEnd == null || navStart === 0) return null;
  return ((navEnd - navStart) / navStart) * 100;
}

export function weekReturn(points: NavPoint[], asOf: string): number | null {
  const d = new Date(asOf);
  d.setDate(d.getDate() - 7);
  const weekAgo = d.toISOString().slice(0, 10);
  const navEnd   = navOnDate(points, asOf);
  const navStart = navOnDate(points, weekAgo);
  return pctReturn(navStart, navEnd);
}

export function monthReturn(points: NavPoint[], asOf: string): number | null {
  const d = new Date(asOf);
  d.setDate(d.getDate() - 30);
  const monthAgo = d.toISOString().slice(0, 10);
  const navEnd   = navOnDate(points, asOf);
  const navStart = navOnDate(points, monthAgo);
  return pctReturn(navStart, navEnd);
}

export function ytdReturn(points: NavPoint[], asOf: string): number | null {
  const year     = asOf.slice(0, 4);
  const jan1     = `${year}-01-01`;
  const navEnd   = navOnDate(points, asOf);
  const navStart = navOnDate(points, jan1);
  return pctReturn(navStart, navEnd);
}

export function categoryAverage(
  values: (number | null)[],
  minCount = 3,
): number | null {
  const valid = values.filter((v): v is number => v !== null);
  if (valid.length < minCount) return null;
  return valid.reduce((a, b) => a + b, 0) / valid.length;
}
