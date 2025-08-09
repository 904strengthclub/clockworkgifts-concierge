// /app/api/generate-suggestions/route.ts  (replace the previous patched version)
import { NextResponse } from 'next/server';
import { generateGiftIdeasStructured } from '@/lib/gemini';
import { isAllowlisted, buildRetailerLink, retailerLogo } from '@/lib/retailers';

type SurveySummary = {
  name: string;
  relationship: string;
  occasion: string;
  date: string;
  budget_range?: string;
  target_budget_usd?: number | null; // NEW
};

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({} as any));
    const { surveySummary, seenGiftNames = [] } = body as {
      surveySummary: SurveySummary;
      seenGiftNames?: string[];
    };

    if (!surveySummary?.name || !surveySummary?.relationship || !surveySummary?.occasion || !surveySummary?.date) {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
    }

    // Budget band (+0% / −15%). If no numeric given, default to a broad band.
    const target = Number(surveySummary.target_budget_usd ?? NaN);
    const maxBudget = isFinite(target) && target > 0 ? Math.round(target) : 500;
    const minBudget = isFinite(target) && target > 0 ? Math.round(target * 0.85) : 10;

    const userPrompt = `
Recipient: ${surveySummary.name} (${surveySummary.relationship})
Occasion: ${surveySummary.occasion} on ${surveySummary.date}
Target budget: ${isFinite(target) ? `$${maxBudget} (accept $${minBudget}–$${maxBudget})` : (surveySummary.budget_range || 'unspecified')}
Avoid previously shown items: ${seenGiftNames.length ? seenGiftNames.join(', ') : 'None'}
`.trim();

    const raw = await generateGiftIdeasStructured(userPrompt, minBudget, maxBudget);
    if (!Array.isArray(raw) || raw.length === 0) {
      return NextResponse.json({ error: 'No suggestions returned from Gemini.' }, { status: 502 });
    }

    // Enforce budget band server-side as well (belt & suspenders)
    const banded = raw.filter(s => s.priceUsd >= minBudget && s.priceUsd <= maxBudget);

    const out = banded
      .filter(s => isAllowlisted(s.retailer))
      .slice(0, 5)
      .map(s => {
        const url = buildRetailerLink(s.retailer as any, s.query, s.idHint);
        return {
          name: s.title,
          estimated_price: s.priceBand,
          store_or_brand: s.retailer,
          description: s.reason,
          image_url: retailerLogo(s.retailer),
          suggested_platform: s.retailer,
          search_query: s.query,
          one_liner: s.oneLiner,
          id_hint: s.idHint,
          url, // for CTA
        };
      });

    return NextResponse.json(out);
  } catch (err) {
    console.error('API Error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
