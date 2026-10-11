// Saturday report pipeline: snapshot → news → verdict → Gemini → email

import { getDb }              from './db';
import { computePerformance } from './performance';
import { fetchMarketNews }    from './news';
import { applyVerdictRules }  from './verdict';
import { generateReport, fallbackReport } from './gemini';
import { buildEmailHtml, sendReport }     from './email';

function lastFriday(from: Date): string {
  const d   = new Date(from);
  const dow = d.getDay();
  const offset = dow === 0 ? 2 : dow === 6 ? 1 : dow + 2;
  d.setDate(d.getDate() - offset);
  return d.toISOString().slice(0, 10);
}

export interface WeeklyRunResult {
  weekDate:   string;
  status:     'success' | 'partial' | 'failed';
  verdict:    string;
  emailSent:  boolean;
  alreadyRan: boolean;
  errors:     string[];
}

export async function runWeeklyReport(weekDate?: string): Promise<WeeklyRunResult> {
  const sql    = getDb();
  const date   = weekDate ?? lastFriday(new Date());
  const errors: string[] = [];

  // ── Idempotency check ─────────────────────────────────────────────────────
  const existing = await sql`
    SELECT id, status FROM reports WHERE week_date = ${date} LIMIT 1
  `;
  if (existing.length > 0 && existing[0].status === 'sent') {
    return { weekDate: date, status: 'success', verdict: '', emailSent: false, alreadyRan: true, errors: [] };
  }

  // ── 1. Compute performance ─────────────────────────────────────────────────
  let funds;
  try {
    funds = await computePerformance(date);
  } catch (err) {
    return { weekDate: date, status: 'failed', verdict: '', emailSent: false, alreadyRan: false, errors: [String(err)] };
  }

  // ── 2. Save weekly snapshot ────────────────────────────────────────────────
  await sql`
    INSERT INTO weekly_snapshots (week_date, data)
    VALUES (${date}, ${JSON.stringify({ funds })})
    ON CONFLICT (week_date) DO UPDATE SET data = EXCLUDED.data
  `;

  // ── 3. Fetch news ──────────────────────────────────────────────────────────
  const news = await fetchMarketNews(15);

  if (news.length > 0) {
    for (const n of news) {
      await sql`
        INSERT INTO news_items (week_date, headline, source, url, published_at)
        VALUES (${date}, ${n.headline}, ${n.source}, ${n.url ?? null}, ${n.publishedAt ?? null})
        ON CONFLICT (week_date, headline) DO NOTHING
      `;
    }
  }

  // ── 4. Apply verdict rules ─────────────────────────────────────────────────
  const verdict = applyVerdictRules(funds);

  // ── 5. Generate AI report ──────────────────────────────────────────────────
  const aiReport = await generateReport(funds, verdict, news, date)
    ?? fallbackReport(funds, verdict);

  // ── 6. Build email HTML ────────────────────────────────────────────────────
  const dashUrl  = process.env.NEXT_PUBLIC_APP_URL ?? 'https://mf-tracker.vercel.app';
  const emailHtml = buildEmailHtml(funds, verdict, aiReport, news, date, dashUrl);

  // ── 7. Upsert report record ────────────────────────────────────────────────
  await sql`
    INSERT INTO reports (week_date, fund_summaries, verdict, reason, email_html, status)
    VALUES (${date}, ${JSON.stringify(aiReport.fundSummaries)}, ${verdict.verdict}, ${verdict.reason}, ${emailHtml}, 'generated')
    ON CONFLICT (week_date) DO UPDATE
      SET fund_summaries = EXCLUDED.fund_summaries,
          verdict        = EXCLUDED.verdict,
          reason         = EXCLUDED.reason,
          email_html     = EXCLUDED.email_html,
          status         = 'generated'
  `;

  // ── 8. Send email ──────────────────────────────────────────────────────────
  const sendResult = await sendReport(emailHtml, date);
  if (!sendResult.ok) errors.push(`Email: ${sendResult.error}`);

  const newStatus = sendResult.ok ? 'sent' : 'failed';
  await sql`
    UPDATE reports
    SET status = ${newStatus}, sent_at = ${sendResult.ok ? new Date().toISOString() : null}
    WHERE week_date = ${date}
  `;

  // ── 9. Record pipeline run ─────────────────────────────────────────────────
  const status = errors.length === 0 ? 'success' : 'partial';
  await sql`
    INSERT INTO pipeline_runs (run_date, run_type, status, detail)
    VALUES (${date}, 'weekly', ${status}, ${JSON.stringify({ verdict: verdict.verdict, emailSent: sendResult.ok, errors })})
  `;

  return {
    weekDate:  date,
    status,
    verdict:   verdict.verdict,
    emailSent: sendResult.ok,
    alreadyRan: false,
    errors,
  };
}
