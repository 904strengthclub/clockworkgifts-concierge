import { NextResponse } from 'next/server';
import { generateGiftIdeasStructured } from '@/lib/gemini';
import { isAllowlisted, buildRetailerLink, retailerLogo } from '@/lib/retailers';

type SurveySummary = {
  name: string;
  relationship: string;
  occasion: string;
  date: string;       // MM-DD or ISO
  about?: string;
  budget_range?: string;
  target_budget_usd?: number | null;
};

function toISOFromMMDD(mmdd: string): string {
  const now = new Date();
  const [mm, dd] = mmdd.split('-');
  return `${now.getFullYear()}-${mm}-${dd}`;
}

async function fetchInBand(prompt: string, minBudget: number, maxBudget: number) {
  const raw = await generateGiftIdeasStructured(prompt, minBudget, maxBudget);
  return raw.filter(s => s.priceUsd >= minBudget && s.priceUsd <= maxBudget);
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
Avoid previously shown items: ${seenGiftNames.length ? seenGiftNames.join(', ') : 'None'}
`.trim();

    // First attempt
    let banded = await fetchInBand(userPrompt, minBudget, maxBudget);

    // Retry once if fewer than 5 or suspiciously low prices slipped through
    if (banded.length < 5) {
      banded = await fetchInBand(userPrompt + '\nStrictly keep each price within the budget band.', minBudget, maxBudget);
    }

    // Map to legacy shape; allow fewer than 5 if that’s what’s in-band
    const out = banded
      .filter(s => isAllowlisted(s.retailer))
      .map(s => ({
        name: s.title,
        estimated_price: s.priceBand,
        store_or_brand: s.retailer,
        description: s.reason,
        image_url: retailerLogo(),
        suggested_platform: s.retailer,
        search_query: s.query,
        one_liner: s.oneLiner,
        id_hint: s.idHint,
        url: buildRetailerLink(s.retailer as any, s.query, s.idHint),
      }))
      .slice(0, 5);

    if (!out.length) {
      return NextResponse.json({ error: 'No suggestions returned from Gemini.' }, { status: 502 });
    }

    return NextResponse.json(out);
  } catch (err) {
    console.error('API Error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
