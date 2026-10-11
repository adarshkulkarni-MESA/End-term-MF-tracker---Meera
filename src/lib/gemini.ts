// Gemini AI integration for generating the plain-language report

import { GoogleGenerativeAI } from '@google/generative-ai';
import { FundPerformance } from './performance';
import { VerdictResult }   from './verdict';
import { NewsItem }        from './news';

const MODEL_NAME = process.env.GEMINI_MODEL ?? 'gemini-1.5-flash';

export interface FundSummary {
  schemeName: string;
  summary:    string;
}

export interface GeminiReport {
  fundSummaries: FundSummary[];
  closingParagraph: string;
}

function buildPrompt(
  funds: FundPerformance[],
  verdict: VerdictResult,
  news: NewsItem[],
  asOf: string,
): string {
  const fundsJson = funds.map(f => ({
    name:           f.schemeName,
    type:           f.fundType,
    asOf,
    weekReturn:     f.weekReturn?.toFixed(2) ?? 'N/A',
    monthReturn:    f.monthReturn?.toFixed(2) ?? 'N/A',
    ytdReturn:      f.ytdReturn?.toFixed(2) ?? 'N/A',
    benchmarkName:  f.benchmarkName ?? 'category average only',
    benchmarkWeek:  f.benchmarkWeek?.toFixed(2)  ?? 'N/A',
    benchmarkMonth: f.benchmarkMonth?.toFixed(2) ?? 'N/A',
    benchmarkYtd:   f.benchmarkYtd?.toFixed(2)  ?? 'N/A',
    categoryWeek:   f.categoryWeek?.toFixed(2)  ?? 'N/A',
    categoryMonth:  f.categoryMonth?.toFixed(2) ?? 'N/A',
    categoryYtd:    f.categoryYtd?.toFixed(2)   ?? 'N/A',
  }));

  const newsJson = news.map(n => ({ headline: n.headline, source: n.source }));

  return `
You are writing a Saturday-morning mutual fund summary for Meera, a 28-year-old non-finance professional.

Rules:
1. Use plain language. If you must use a finance term, explain it in a simple bracket.
2. NEVER invent numbers. Only use the numbers provided.
3. Only reference headlines from the news list provided.
4. If any data field is "N/A", say "data not available" and do not guess.
5. Each fund summary must be EXACTLY 3 sentences.
6. The closing paragraph should be 2-3 sentences.

Data:
${JSON.stringify({ funds: fundsJson, verdict: verdict.verdict, reason: verdict.reason, news: newsJson }, null, 2)}

Respond ONLY with valid JSON in this exact format:
{
  "fundSummaries": [
    { "schemeName": "...", "summary": "sentence1. sentence2. sentence3." },
    ...
  ],
  "closingParagraph": "..."
}
`.trim();
}

export async function generateReport(
  funds: FundPerformance[],
  verdict: VerdictResult,
  news: NewsItem[],
  asOf: string,
): Promise<GeminiReport | null> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn('GEMINI_API_KEY not set; skipping AI generation');
    return null;
  }

  try {
    const genAI  = new GoogleGenerativeAI(apiKey);
    const model  = genAI.getGenerativeModel({ model: MODEL_NAME });
    const prompt = buildPrompt(funds, verdict, news, asOf);

    const result = await model.generateContent(prompt);
    const text   = result.response.text();

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('No JSON found in Gemini response');

    const parsed: GeminiReport = JSON.parse(jsonMatch[0]);

    if (!Array.isArray(parsed.fundSummaries) || !parsed.closingParagraph) {
      throw new Error('Invalid Gemini response structure');
    }

    return parsed;
  } catch (err) {
    console.error('Gemini generation failed:', err);
    return null;
  }
}

export function fallbackReport(
  funds: FundPerformance[],
  verdict: VerdictResult,
): GeminiReport {
  const fundSummaries = funds.map(f => {
    const wk = f.weekReturn?.toFixed(2) ?? 'N/A';
    const mo = f.monthReturn?.toFixed(2) ?? 'N/A';
    const bm = f.benchmarkMonth?.toFixed(2) ?? 'N/A';
    return {
      schemeName: f.schemeName,
      summary: `This week the fund moved ${wk}% and over the past month it returned ${mo}%. ` +
        `Its benchmark returned ${bm}% over the same period; category average comparison is in the dashboard. ` +
        `Market data was used to compute these figures; for context visit the Market & News tab.`,
    };
  });

  return {
    fundSummaries,
    closingParagraph: `${verdict.verdict}. ${verdict.reason}`,
  };
}
