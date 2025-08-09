import { NextResponse } from 'next/server';
import { generateGiftIdeasStructured } from '@/lib/gemini';
import { isAllowlisted, buildRetailerLink, retailerLogo } from '@/lib/retailers';

type SurveySummary = {
  name: string;
  relationship: string;
  occasion: string;
  date: string;                // MM-DD
  about?: string;
  budget_range?: string;
  target_budget_usd?: number | null;
};

function toISOFromMMDD(mmdd: string): string {
  // insert current year purely for context; you are NOT storing identities long term
  const now = new Date();
  const [mm, dd] = mmdd.split('-');
  const y = now.getFullYear();
  return `${y}-${mm}-${dd}`;
}

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

    // Budget band (+0/-15%) — if missing, use a broad default
    const target = Number(surveySummary.target_budget_usd ?? NaN);
    const maxBudget = Number.isFinite(target) && target > 0 ? Math.round(target) : 300;
    const minBudget = Number.isFinite(target) && target > 0 ? Math.round(target * 0.85) : 25;

    const isoDate = /^\d{2}-\d{2}$/.test(surveySummary.date)
      ? toISOFromMMDD(surveySummary.date)
      : surveySummary.date;

    const userPrompt = `
Recipient: ${surveySummary.name} (${surveySummary.relationship})
Occasion: ${surveySummary.occasion} on ${isoDate}
About: ${surveySummary.about || '—'}
Target budget: ${Number.isFinite(target) ? `$${maxBudget} (accept $${minBudget}–$${maxBudget})` : (surveySummary.budget_range || 'unspecified')}
Avoid previously shown items: ${seenGiftNames.length ? seenGiftNames.join(', ') : 'None'}
`.trim();

    const raw = await generateGiftIdeasStructured(userPrompt, minBudget, maxBudget);
    if (!Array.isArray(raw) || raw.length === 0) {
      return NextResponse.json({ error: 'No suggestions returned from Gemini.' }, { status: 502 });
    }

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
          url,
        };
      });

    return NextResponse.json(out);
  } catch (err) {
    console.error('API Error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
