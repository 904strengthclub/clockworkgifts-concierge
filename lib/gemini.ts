import { GoogleGenerativeAI } from '@google/generative-ai';

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) throw new Error('Missing GEMINI_API_KEY');

const ai = new GoogleGenerativeAI(apiKey);
const model = ai.getGenerativeModel({
  model: 'gemini-2.5-flash',
});

export interface ModelGiftSuggestion {
  title: string;
  oneLiner?: string;
  retailer: 'amazon.com';
  query: string;      // concise Amazon search phrase
  priceUsd: number;   // model’s guess (we still enforce server-side)
  reason?: string;
}

/** Strip markdown fences / leading prose, then return JSON string */
function extractJson(raw: string): string {
  if (!raw) return '[]';
  let s = raw.trim();

  // remove code fences like ```json ... ```
  if (s.startsWith('```')) {
    s = s.replace(/^```[a-zA-Z]*\s*/m, '').replace(/```$/m, '').trim();
  }
  // sometimes there’s extra prose before/after JSON; find the first { or [
  const first = Math.min(
    ...[s.indexOf('['), s.indexOf('{')].filter((i) => i >= 0)
  );
  const last = Math.max(
    s.lastIndexOf(']'),
    s.lastIndexOf('}')
  );
  if (first >= 0 && last > first) {
    s = s.slice(first, last + 1).trim();
  }
  return s;
}

function normalize(items: any): ModelGiftSuggestion[] {
  const arr = Array.isArray(items) ? items : Array.isArray(items?.suggestions) ? items.suggestions : [];
  return arr
    .filter((x: any) => x && typeof x === 'object')
    .map((x: any) => ({
      title: String(x.title || x.name || '').trim(),
      oneLiner: x.oneLiner ? String(x.oneLiner) : undefined,
      retailer: 'amazon.com' as const,
      query: String(x.query || x.keyword || x.title || x.name || '').trim(),
      priceUsd: Number.isFinite(Number(x.priceUsd)) ? Math.round(Number(x.priceUsd)) : 0,
      reason: x.reason ? String(x.reason) : undefined,
    }))
    .filter((x: ModelGiftSuggestion) => x.title && x.query);
}

export async function generateGiftIdeasStructured(
  history: any[],
  minBudget: number,
  maxBudget: number
): Promise<ModelGiftSuggestion[]> {
  const system = `
Return ONLY JSON in one of these shapes:

1) An array:
[
  {"title":"","oneLiner":"","retailer":"amazon.com","query":"","priceUsd":0,"reason":""}
]

OR

2) An object:
{"suggestions":[
  {"title":"","oneLiner":"","retailer":"amazon.com","query":"","priceUsd":0,"reason":""}
]}

Rules:
- 8–10 suggestions.
- retailer MUST be "amazon.com".
- priceUsd MUST be between ${minBudget} and ${maxBudget}, inclusive.
- query MUST be a concise Amazon search phrase (no URL).
- No markdown fences, no commentary. JSON only.
`.trim();

  const req = {
    contents: [
      ...(history || []),
      { role: 'user', parts: [{ text: system }] },
    ],
    generationConfig: { responseMimeType: 'application/json' as const },
  };

  try {
    const resp = await model.generateContent(req as any);
    const raw = resp.response.text();
    const jsonStr = extractJson(raw);
    let parsed: any;
    try {
      parsed = JSON.parse(jsonStr);
    } catch (e) {
      // last-resort cleanup: remove control chars & retry
      const cleaned = jsonStr.replace(/[\u0000-\u001F]/g, '');
      parsed = JSON.parse(cleaned);
    }
    return normalize(parsed);
  } catch (e) {
    console.warn('Gemini JSON parse hard-fail:', e);
    return [];
  }
}
