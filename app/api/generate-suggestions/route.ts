// app/api/generate-suggestions/route.ts
import { NextResponse } from 'next/server';
import { generateGiftIdeasStructured } from '@/lib/gemini';
import {
  mapBudgetToPriceBand,
  buildAmazonSearchLink,
  toAffiliateRedirectUrl,
} from '@/lib/affiliateHelpers';

type SurveySummary = {
  target_budget_usd?: number | null;
  budget?: number | string | null;
  budget_range?: string | null;
  name?: string;
  relationship?: string;
  occasion?: string;
  date?: string;
  about?: string;
};

function coerceBudgetNumber(survey: SurveySummary): number | null {
  if (typeof survey.target_budget_usd === 'number' && isFinite(survey.target_budget_usd) && survey.target_budget_usd > 0) {
    return Math.floor(survey.target_budget_usd);
  }
  if (survey.budget !== undefined && survey.budget !== null) {
    const n = Number(survey.budget);
    if (isFinite(n) && n > 0) return Math.floor(n);
  }
  if (typeof survey.budget_range === 'string') {
    const m = survey.budget_range.match(/(\d+(?:\.\d+)?)/);
    if (m) {
      const n = Number(m[1]);
      if (isFinite(n) && n > 0) return Math.floor(n);
    }
  }
  return null;
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { surveySummary, seenGiftNames = [] } = (body || {}) as {
      surveySummary: SurveySummary;
      seenGiftNames?: string[];
    };

    if (!surveySummary) {
      return NextResponse.json({ error: 'Missing surveySummary' }, { status: 400 });
    }

    const budgetNum = coerceBudgetNumber(surveySummary);
    if (!budgetNum) {
      return NextResponse.json({ error: 'Budget is required' }, { status: 400 });
    }

    const { min, max } = mapBudgetToPriceBand(budgetNum); // +0 / -20%
    const priceBandDisplay = `$${min}–$${max}`;

    const prompt = `
Return ONLY JSON in one of these shapes:

1) Array:
[
  {"title":"","oneLiner":"","retailer":"amazon.com","query":"","priceUsd":0,"reason":""}
]

OR

2) Object:
{"suggestions":[
  {"title":"","oneLiner":"","retailer":"amazon.com","query":"","priceUsd":0,"reason":""}
]}

Rules:
- 8–10 suggestions.
- retailer MUST be "amazon.com".
- priceUsd MUST be between ${min} and ${max}, inclusive.
- query MUST be a concise Amazon search phrase (no URL).
- JSON only; no markdown fences or commentary.

Recipient:
${JSON.stringify(
  {
    name: surveySummary.name || '',
    relationship: surveySummary.relationship || '',
    occasion: surveySummary.occasion || '',
    date: surveySummary.date || '',
    about: surveySummary.about || '',
    avoid: seenGiftNames,
  },
  null,
  2
)}
    `.trim();

    const history = [{ role: 'user', parts: [{ text: prompt }] }];

    // Ask the model; it returns 8–10, we’ll filter/top-up to 5
    const raw = await generateGiftIdeasStructured(history, min, max);

    // In-band, unique, unseen
    const seen = new Set<string>();
    const inBand = (Array.isArray(raw) ? raw : [])
      .filter((s: any) => s && typeof s === 'object')
      .filter((s: any) => typeof s.title === 'string' && s.title.trim())
      .filter((s: any) => typeof s.query === 'string' && s.query.trim())
      .filter((s: any) => typeof s.priceUsd === 'number' && s.priceUsd >= min && s.priceUsd <= max)
      .filter((s: any) => !seenGiftNames.includes(s.title))
      .filter((s: any) => {
        const key = `${s.title.toLowerCase()}|${s.query.toLowerCase()}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });

    // Top up to 5 with budget-aligned fallbacks if needed
    const FALLBACKS = [
      'premium coffee maker','artisan jewelry','smartwatch','wireless earbuds','cocktail smoker kit',
      'handmade leather wallet','gourmet chocolate gift','board game strategy','yoga mat premium',
      'instant camera','barista espresso scale','electric pour-over kettle','chef knife Japanese',
      'luxury throw blanket','aromatherapy diffuser','silk pillowcase','mechanical keyboard hot-swappable'
    ];
    const need = Math.max(0, 5 - inBand.length);
    const fillers: any[] = [];
    for (let i = 0; i < need; i++) {
      const q = FALLBACKS[(i * 3) % FALLBACKS.length];
      fillers.push({
        title: q.replace(/\b\w/g, (m) => m.toUpperCase()),
        oneLiner: 'Popular, well-reviewed options in this category.',
        retailer: 'amazon.com',
        query: q,
        priceUsd: Math.round((min + max) / 2),
        reason: 'Budget-aligned fallback search.',
      });
    }

    const final = [...inBand, ...fillers].slice(0, 5);

    // Map to frontend shape with price-constrained Amazon URLs
    const out = final.map((s: any) => {
      const name = s.title;
      const query = s.query;
      const amazonUrl = buildAmazonSearchLink(query, min, max); // adds low/high & rh=p_36
      const redirectUrl = toAffiliateRedirectUrl(amazonUrl);    // /api/go?u=...&r=amazon.com

      return {
        name,
        estimated_price: priceBandDisplay,
        store_or_brand: 'amazon.com',
        description: s.reason || s.oneLiner || 'Curated Amazon search.',
        image_url: '/retailers/generic-store.svg',
        suggested_platform: 'amazon.com',
        search_query: query,
        url: redirectUrl,
      };
    });

    return NextResponse.json(out);
  } catch (error) {
    console.error('Error generating gift ideas:', error);
    return NextResponse.json({ error: 'Failed to generate gift ideas' }, { status: 500 });
  }
}
