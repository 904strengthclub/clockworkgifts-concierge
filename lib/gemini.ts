// /lib/gemini.ts
import { GoogleGenerativeAI } from '@google/generative-ai';

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) throw new Error('Missing GEMINI_API_KEY');
const ai = new GoogleGenerativeAI(apiKey);

export interface ModelGiftSuggestion {
  title: string;
  oneLiner: string;
  retailer: string;   // we’ll force "amazon.com"
  query: string;      // search phrase for Amazon
  idHint?: string;    // optional ASIN if the model knows one (rare)
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
Return ONLY JSON with shape:
{
  "suggestions": [
    {
      "title": "string",
      "oneLiner": "string",
      "retailer": "amazon.com",
      "query": "short Amazon search phrase",
      "idHint": "optional ASIN",
      "priceUsd": 123.45,
      "priceBand": "$100–$150",
      "reason": "why this fits the recipient"
    }
  ]
}

Rules:
- retailer MUST be "amazon.com".
- priceUsd MUST be between ${minBudget} and ${maxBudget}, inclusive.
- No URLs or markdown. JSON only.
`.trim();

  const genCfg: any = { responseMimeType: 'application/json' };
  const req = { contents: [{ role: 'user', parts: [{ text: `${system}\n\nUser Input:\n${userPrompt}` }] }], generationConfig: genCfg };

  const res = await model.generateContent(req);
  const raw = res.response.text();

  try {
    const parsed = tryParseStrict(raw) as { suggestions: ModelGiftSuggestion[] };
    const clean = (parsed.suggestions || []).filter(s =>
      s?.title && s?.oneLiner && s?.query && typeof s?.priceUsd === 'number' && s?.priceBand && s?.reason
    );
    return clean.map(s => ({ ...s, retailer: 'amazon.com' })); // belt & suspenders
  } catch (e1) {
    // Retry once, shorter
    const retry = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text:
        `JSON only: {"suggestions":[{"title":"","oneLiner":"","retailer":"amazon.com","query":"","priceUsd":0,"priceBand":"","reason":""}]}\n\nBudget ${minBudget}-${maxBudget}\n\n${userPrompt}`
      }] }],
      generationConfig: genCfg,
    });
    try {
      const parsed2 = tryParseStrict(retry.response.text()) as { suggestions: ModelGiftSuggestion[] };
      const clean2 = (parsed2.suggestions || []).filter(s =>
        s?.title && s?.oneLiner && s?.query && typeof s?.priceUsd === 'number' && s?.priceBand && s?.reason
      );
      return clean2.map(s => ({ ...s, retailer: 'amazon.com' }));
    } catch {
      return [];
    }
  }
}
