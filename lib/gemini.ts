import { GoogleGenerativeAI } from '@google/generative-ai';
import { ALLOWLIST } from '@/lib/retailers';

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) throw new Error('Missing GEMINI_API_KEY');
const ai = new GoogleGenerativeAI(apiKey);

export interface ModelGiftSuggestion {
  title: string;
  oneLiner: string;
  retailer: string;
  query: string;
  idHint?: string;
  priceUsd: number;
  priceBand: string;
  reason: string;
}

const model = ai.getGenerativeModel({ model: 'gemini-2.5-flash' });

export async function generateGiftIdeasStructured(
  userPrompt: string,
  minBudget: number,
  maxBudget: number
): Promise<ModelGiftSuggestion[]> {
  const retailers = ALLOWLIST.join(', ');

  const generationConfig = {
    responseMimeType: 'application/json',
  } as any;

  const system = `
You are Clockwork — an elite AI gifting concierge.

Budget rule:
- Each suggestion.priceUsd MUST be between ${minBudget} and ${maxBudget} inclusive.

Return EXACTLY 5 suggestions as JSON:
{
  "suggestions": [
    {
      "title": "string",
      "oneLiner": "string",
      "retailer": "one of [${retailers}]",
      "query": "string",
      "idHint": "optional string",
      "priceUsd": 123.45,
      "priceBand": "e.g., $250–$300",
      "reason": "string"
    }
  ]
}

Rules:
- Do NOT output URLs or images.
- "retailer" MUST be one of [${retailers}].
- "priceUsd" MUST be numeric within budget band.
- Keep oneLiner punchy; reason ties to the recipient.
- Output ONLY the JSON object above.
  `.trim();

  const res = await model.generateContent({
    contents: [{ role: 'user', parts: [{ text: `${system}\n\nUser Input:\n${userPrompt}` }] }],
    generationConfig,
  });

  // With responseMimeType=application/json, .text() should be clean JSON
  const json = res.response.text();
  try {
    const parsed = JSON.parse(json) as { suggestions: ModelGiftSuggestion[] };
    const clean = (parsed.suggestions || []).filter(s =>
      s?.title && s?.oneLiner && s?.retailer && s?.query && typeof s?.priceUsd === 'number' && s?.priceBand && s?.reason
    );
    return clean;
  } catch (e) {
    console.error('Gemini JSON parse error:', e, json);
    return [];
  }
}
