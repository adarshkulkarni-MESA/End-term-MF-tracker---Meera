// Saturday report pipeline: snapshot → news → verdict → Gemini → email

import { supabase }        from './supabase';
import { computePerformance } from './performance';
import { fetchMarketNews } from './news';
import { applyVerdictRules } from './verdict';
import { generateReport, fallbackReport } from './gemini';
import { buildEmailHtml, sendReport }     from './email';

function lastFriday(from: Date): string {
  const d = new Date(from);
  const dow = d.getDay();
  const offset = dow === 0 ? 2 : dow === 6 ? 1 : dow + 2;
  d.setDate(d.getDate() - offset);
  return d.toISOString().slice(0, 10);
}

export interface WeeklyRunResult {
  weekDate:      string;
  status:        'success' | 'partial' | 'failed';
  verdict:       string;
  emailSent:     boolean;
  alreadyRan:    boolean;
  errors:        string[];
}

export async function runWeeklyReport(weekDate?: string): Promise<WeeklyRunResult> {
  const date = weekDate ?? lastFriday(new Date());
  const errors: string[] = [];

  const { data: existing } = await supabase
    .from('reports')
    .select('id, status')
    .eq('week_date', date)
    .maybeSingle();

  if (existing && existing.status === 'sent') {
    return { weekDate: date, status: 'success', verdict: '', emailSent: false, alreadyRan: true, errors: [] };
  }

  let funds;
  try {
    funds = await computePerformance(date);
  } catch (err) {
    return { weekDate: date, status: 'failed', verdict: '', emailSent: false, alreadyRan: false, errors: [String(err)] };
  }

  await supabase.from('weekly_snapshots').upsert(
    { week_date: date, data: { funds } },
    { onConflict: 'week_date' }
  );

  const news = await fetchMarketNews(15);

  if (news.length > 0) {
    await supabase.from('news_items').upsert(
      news.map(n => ({
        week_date:    date,
        headline:     n.headline,
        source:       n.source,
        url:          n.url,
        published_at: n.publishedAt,
      })),
      { onConflict: 'week_date,headline' }
    );
  }

  const verdict = applyVerdictRules(funds);

  const aiReport = await generateReport(funds, verdict, news, date)
    ?? fallbackReport(funds, verdict);

  const dashUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://mf-tracker.vercel.app';
  const emailHtml = buildEmailHtml(funds, verdict, aiReport, news, date, dashUrl);

  await supabase.from('reports').upsert(
    {
      week_date:      date,
      fund_summaries: aiReport.fundSummaries,
      verdict:        verdict.verdict,
      reason:         verdict.reason,
      email_html:     emailHtml,
      status:         'generated',
    },
    { onConflict: 'week_date' }
  );

  const sendResult = await sendReport(emailHtml, date);
  if (!sendResult.ok) errors.push(`Email: ${sendResult.error}`);

  await supabase.from('reports')
    .update({ status: sendResult.ok ? 'sent' : 'failed', sent_at: sendResult.ok ? new Date().toISOString() : null })
    .eq('week_date', date);

  const status = errors.length === 0 ? 'success' : 'partial';
  await supabase.from('pipeline_runs').insert({
    run_date: date,
    run_type: 'weekly',
    status,
    detail:   { verdict: verdict.verdict, emailSent: sendResult.ok, errors },
  });

  return {
    weekDate:  date,
    status,
    verdict:   verdict.verdict,
    emailSent: sendResult.ok,
    alreadyRan: false,
    errors,
  };
}
