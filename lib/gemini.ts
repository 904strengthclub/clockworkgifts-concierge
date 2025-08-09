// /lib/gemini.ts  (replace the previous patched version with this)
import { GoogleGenerativeAI } from '@google/generative-ai';
import { ALLOWLIST } from '@/lib/retailers';

const ai = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export interface ModelGiftSuggestion {
  title: string;
  oneLiner: string;
  retailer: string;      // allowlisted domain
  query: string;         // search terms
  idHint?: string;
  priceUsd: number;      // NEW: numeric price for filtering
  priceBand: string;     // friendly display, e.g. "$250–$300"
  reason: string;
}

const model = ai.getGenerativeModel({ model: 'gemini-2.5-flash' });

export async function generateGiftIdeasStructured(userPrompt: string, minBudget: number, maxBudget: number): Promise<ModelGiftSuggestion[]> {
  const retailerList = ALLOWLIST.join(', ');
  const groundingPrompt = `
You are Clockwork — an elite AI gifting concierge.

Budget rule:
- Every suggestion's numeric price (priceUsd) MUST be between ${minBudget} and ${maxBudget}, inclusive.

Return EXACTLY 5 suggestions as STRICT JSON with shape:
{
  "suggestions": [
    {
      "title": "string",
      "oneLiner": "string",
      "retailer": "one of [${retailerList}]",
      "query": "string",
      "idHint": "optional",
      "priceUsd": 123.45,
      "priceBand": "string like $250–$300",
      "reason": "string"
    }
  ]
}

Rules:
- Do NOT output any URLs or images.
- "retailer" MUST be one of [${retailerList}].
- "priceUsd" MUST be a number within the budget band above (no text).
- Keep "oneLiner" snappy; "reason" ties to recipient context.
- Output ONLY the JSON object. No markdown, no prose.

User Input:
${userPrompt}
  `.trim();

  try {
    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: groundingPrompt }] }],
    });
    const text = result.response.text();
    const match = text.match(/\{\s*"suggestions"\s*:\s*\[\s*{[\s\S]*}\s*\]\s*\}/);
    if (!match) return [];

    const parsed = JSON.parse(match[0]) as { suggestions: ModelGiftSuggestion[] };
    const clean = (parsed.suggestions || []).filter(s =>
      s?.title && s?.oneLiner && s?.retailer && s?.query && typeof s?.priceUsd === 'number' && s?.priceBand && s?.reason
    );
    return clean;
  } catch (e) {
    console.error('Gemini API error:', e);
    return [];
  }
}
