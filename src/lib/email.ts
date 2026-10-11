// Build and send the Saturday email report via Resend

import { Resend }         from 'resend';
import { FundPerformance } from './performance';
import { VerdictResult }   from './verdict';
import { GeminiReport }    from './gemini';
import { NewsItem }        from './news';

function fmt(v: number | null): string {
  if (v === null) return '—';
  return (v >= 0 ? '+' : '') + v.toFixed(2) + '%';
}

function verdictColor(v: string): string {
  if (v === 'No action needed') return '#22c55e';
  if (v === 'One fund worth watching') return '#f59e0b';
  return '#ef4444';
}

export function buildEmailHtml(
  funds: FundPerformance[],
  verdict: VerdictResult,
  report: GeminiReport,
  news: NewsItem[],
  asOf: string,
  dashboardUrl: string,
): string {
  const color = verdictColor(verdict.verdict);

  const rows = funds.map(f => `
    <tr>
      <td style="padding:8px 12px;border-bottom:1px solid #2a2a2a;">${f.schemeName.length > 30 ? f.schemeName.slice(0, 28) + '…' : f.schemeName}</td>
      <td style="padding:8px 12px;text-align:right;border-bottom:1px solid #2a2a2a;">${fmt(f.weekReturn)}</td>
      <td style="padding:8px 12px;text-align:right;border-bottom:1px solid #2a2a2a;">${fmt(f.monthReturn)}</td>
      <td style="padding:8px 12px;text-align:right;border-bottom:1px solid #2a2a2a;">${fmt(f.ytdReturn)}</td>
      <td style="padding:8px 12px;text-align:right;border-bottom:1px solid #2a2a2a;">${fmt(f.benchmarkMonth)}</td>
    </tr>
  `).join('');

  const fundDetails = report.fundSummaries.map(fs => `
    <div style="margin-bottom:20px;padding:16px;background:#1a1a1a;border-radius:8px;border-left:3px solid #6366f1;">
      <div style="font-weight:600;font-size:15px;margin-bottom:8px;color:#e5e7eb;">${fs.schemeName}</div>
      <div style="color:#9ca3af;font-size:14px;line-height:1.6;">${fs.summary}</div>
    </div>
  `).join('');

  const newsHtml = news.slice(0, 5).map(n => `
    <li style="margin-bottom:8px;font-size:13px;color:#9ca3af;">
      <span style="color:#e5e7eb;">${n.headline}</span>
      <span style="color:#6b7280;"> — ${n.source}</span>
    </li>
  `).join('');

  return `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="background:#0f0f0f;color:#e5e7eb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;margin:0;padding:0;">
  <div style="max-width:600px;margin:0 auto;padding:24px 16px;">
    <div style="text-align:center;margin-bottom:32px;">
      <div style="font-size:24px;font-weight:700;letter-spacing:-0.5px;">📊 Meera's MF Report</div>
      <div style="color:#6b7280;font-size:14px;margin-top:4px;">Week ending ${asOf}</div>
    </div>
    <div style="text-align:center;margin-bottom:28px;">
      <span style="display:inline-block;padding:10px 24px;border-radius:999px;background:${color}20;border:1px solid ${color};color:${color};font-weight:600;font-size:15px;">
        ${verdict.verdict}
      </span>
      <div style="margin-top:10px;color:#9ca3af;font-size:14px;">${verdict.reason}</div>
    </div>
    <div style="margin-bottom:28px;overflow-x:auto;">
      <table style="width:100%;border-collapse:collapse;font-size:13px;">
        <thead>
          <tr style="background:#1a1a1a;">
            <th style="padding:8px 12px;text-align:left;color:#6b7280;font-weight:500;">Fund</th>
            <th style="padding:8px 12px;text-align:right;color:#6b7280;font-weight:500;">1W</th>
            <th style="padding:8px 12px;text-align:right;color:#6b7280;font-weight:500;">1M</th>
            <th style="padding:8px 12px;text-align:right;color:#6b7280;font-weight:500;">YTD</th>
            <th style="padding:8px 12px;text-align:right;color:#6b7280;font-weight:500;">Bench 1M</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
    <div style="margin-bottom:28px;">
      <div style="font-size:16px;font-weight:600;margin-bottom:16px;">Fund Summaries</div>
      ${fundDetails}
    </div>
    <div style="padding:16px;background:#1a1a1a;border-radius:8px;margin-bottom:28px;">
      <div style="font-size:14px;color:#9ca3af;line-height:1.6;">${report.closingParagraph}</div>
    </div>
    ${newsHtml ? `
    <div style="margin-bottom:28px;">
      <div style="font-size:15px;font-weight:600;margin-bottom:12px;color:#e5e7eb;">This Week's Market Headlines</div>
      <ul style="margin:0;padding-left:20px;">${newsHtml}</ul>
    </div>` : ''}
    <div style="text-align:center;margin-bottom:24px;">
      <a href="${dashboardUrl}" style="display:inline-block;padding:12px 28px;background:#6366f1;color:#fff;text-decoration:none;border-radius:8px;font-weight:600;font-size:14px;">
        View Full Dashboard →
      </a>
    </div>
    <div style="text-align:center;color:#4b5563;font-size:12px;border-top:1px solid #1f1f1f;padding-top:16px;">
      Data from MFAPI.in &amp; Yahoo Finance. Not financial advice.
    </div>
  </div>
</body>
</html>`;
}

export async function sendReport(
  html: string,
  asOf: string,
): Promise<{ ok: boolean; error?: string }> {
  const apiKey    = process.env.RESEND_API_KEY;
  const toEmail   = process.env.REPORT_TO_EMAIL;
  const ccEmail   = process.env.REPORT_CC_EMAIL;
  const fromEmail = process.env.REPORT_FROM_EMAIL ?? 'reports@mf-tracker.meera.app';

  if (!apiKey || !toEmail) {
    return { ok: false, error: 'RESEND_API_KEY or REPORT_TO_EMAIL not set' };
  }

  const resend = new Resend(apiKey);
  const to = [toEmail];
  if (ccEmail) to.push(ccEmail);

  const { error } = await resend.emails.send({
    from:    fromEmail,
    to,
    subject: `Your MF Report – ${asOf}`,
    html,
  });

  if (error) return { ok: false, error: error.message };
  return { ok: true };
}
