import { GoogleGenerativeAI } from '@google/generative-ai';

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) throw new Error('Missing GEMINI_API_KEY');
const ai = new GoogleGenerativeAI(apiKey);

export interface ModelGiftSuggestion {
  title: string;
  oneLiner: string;
  retailer: string;   // "amazon.com"
  query: string;      // Amazon search phrase
  idHint?: string;    // optional ASIN
  priceUsd: number;
  priceBand: string;
  reason: string;
}

const model = ai.getGenerativeModel({ model: 'gemini-2.5-flash' });

function tryParseStrict(json: string) {
  const cleaned = json
    .replace(/[\u0000-\u001F]/g, '')
    .replace(/^[^\{\[]+/, '')
    .replace(/[^}\]]+$/, '');
  return JSON.parse(cleaned);
}

export async function generateGiftIdeasStructured(
  userPrompt: string,
  minBudget: number,
  maxBudget: number
): Promise<ModelGiftSuggestion[]> {
  const system = `
Return ONLY JSON:
{"suggestions":[
  {"title":"","oneLiner":"","retailer":"amazon.com","query":"","idHint":"","priceUsd":0,"priceBand":"","reason":""}
]}

Rules:
- Return 8–10 suggestions.
- retailer MUST be "amazon.com".
- priceUsd MUST be between ${minBudget} and ${maxBudget}, inclusive.
- query MUST be a concise Amazon search phrase (no URL).
- JSON only. No markdown or extra text.
`.trim();

  const genCfg: any = { responseMimeType: 'application/json' };
  const req = {
    contents: [{ role: 'user', parts: [{ text: `${system}\n\nUser Input:\n${userPrompt}` }] }],
    generationConfig: genCfg
  };

  const parseClean = (txt: string) => {
    const parsed = tryParseStrict(txt) as { suggestions: ModelGiftSuggestion[] };
    const clean = (parsed.suggestions || []).filter(s =>
      s?.title && s?.oneLiner && s?.query && typeof s?.priceUsd === 'number' && s?.reason
    );
    return clean.map(s => ({ ...s, retailer: 'amazon.com', priceUsd: Math.round(Number(s.priceUsd)) }));
  };

  try {
    return parseClean((await model.generateContent(req)).response.text());
  } catch {
    const retry = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text:
        `JSON only with 8–10 in-band items (${minBudget}-${maxBudget}). ` +
        `Shape: {"suggestions":[{"title":"","oneLiner":"","retailer":"amazon.com","query":"","priceUsd":0,"priceBand":"","reason":""}]}\n` +
        userPrompt
      }] }],
      generationConfig: genCfg
    });
    try { return parseClean(retry.response.text()); } catch { return []; }
  }
}
