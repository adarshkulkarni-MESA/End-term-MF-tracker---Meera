// Verdict rules — pure logic, no I/O, easily testable

import { FundPerformance } from './performance';
import { VERDICT_CONFIG }  from './verdict.config';

export type Verdict =
  | 'No action needed'
  | 'One fund worth watching'
  | 'Consider reviewing your allocation';

export interface VerdictResult {
  verdict: Verdict;
  reason:  string;
  flaggedFunds: string[];
}

export function applyVerdictRules(funds: FundPerformance[]): VerdictResult {
  const { monthTrailThreshold, ytdTrailThreshold } = VERDICT_CONFIG;
  const flagged: { name: string; reason: string }[] = [];

  for (const f of funds) {
    const reasons: string[] = [];

    if (
      f.monthReturn !== null &&
      f.benchmarkMonth !== null &&
      f.categoryMonth !== null
    ) {
      const trailBench = f.benchmarkMonth - f.monthReturn;
      const trailCat   = f.categoryMonth  - f.monthReturn;
      if (trailBench > monthTrailThreshold && trailCat > monthTrailThreshold) {
        reasons.push(
          `trails benchmark by ${trailBench.toFixed(1)}pp and category avg by ${trailCat.toFixed(1)}pp this month`
        );
      }
    }

    if (f.ytdReturn !== null) {
      const ytdRef = f.benchmarkYtd ?? f.categoryYtd;
      if (ytdRef !== null) {
        const trailYtd = ytdRef - f.ytdReturn;
        if (trailYtd > ytdTrailThreshold) {
          reasons.push(
            `trails ${f.benchmarkName ?? 'category avg'} by ${trailYtd.toFixed(1)}pp year-to-date`
          );
        }
      }
    }

    if (reasons.length > 0) {
      flagged.push({ name: f.schemeName, reason: reasons.join('; ') });
    }
  }

  if (flagged.length === 0) {
    return {
      verdict: 'No action needed',
      reason:  'All funds are performing in line with their benchmarks and peers.',
      flaggedFunds: [],
    };
  }

  if (flagged.length === 1) {
    return {
      verdict: 'One fund worth watching',
      reason:  `${flagged[0].name}: ${flagged[0].reason}.`,
      flaggedFunds: [flagged[0].name],
    };
  }

  const list = flagged.map(f => `${f.name} (${f.reason})`).join('; ');
  return {
    verdict: 'Consider reviewing your allocation',
    reason:  `${flagged.length} funds are underperforming: ${list}.`,
    flaggedFunds: flagged.map(f => f.name),
  };
}
