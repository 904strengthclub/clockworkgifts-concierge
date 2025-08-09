// /app/api/generate-suggestions/route.ts
import { NextResponse } from 'next/server';
import { generateGiftIdeasStructured } from '@/lib/gemini';
import { buildRetailerLink } from '@/lib/retailers';

type SurveySummary = {
  name: string;
  relationship: string;
  occasion: string;
  date: string;              // MM-DD or ISO; we use for context only
  about?: string;
  budget_range?: string;
  target_budget_usd?: number | null;
};

function toISOFromMMDD(mmdd: string): string {
  const now = new Date();
  const [mm, dd] = mmdd.split('-');
  return `${now.getFullYear()}-${mm}-${dd}`;
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({} as any));
    const { surveySummary, seenGiftNames = [] } = body as {
      surveySummary: SurveySummary; seenGiftNames?: string[];
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

    let suggestions = await generateGiftIdeasStructured(userPrompt, minBudget, maxBudget);

    // Strict in-band filter; allow fewer than 5 if needed (better than junk)
    suggestions = suggestions.filter(s => s.priceUsd >= minBudget && s.priceUsd <= maxBudget).slice(0, 5);

    if (!suggestions.length) {
      return NextResponse.json({ error: 'No suggestions returned in band.' }, { status: 502 });
    }

    const out = suggestions.map(s => ({
      name: s.title,
      estimated_price: s.priceBand,
      store_or_brand: 'amazon.com',
      description: s.reason,
      image_url: '/retailers/generic-store.svg',
      suggested_platform: 'amazon.com',
      search_query: s.query,
      one_liner: s.oneLiner,
      id_hint: s.idHint,
      url: buildRetailerLink('amazon.com', s.query, s.idHint),
    }));

    return NextResponse.json(out);
  } catch (err) {
    console.error('API Error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
