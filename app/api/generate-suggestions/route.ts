// app/api/generate-suggestions/route.ts
import { NextResponse } from 'next/server';
import { generateGiftIdeasStructured } from '@/lib/gemini';
import { mapBudgetToPriceBand, buildAmazonSearchLink, toAffiliateRedirectUrl } from '@/lib/affiliateHelpers';

type SurveySummary = {
  relationship?: string;
  about?: string;
  smile_scene?: string;
  talk_hours?: string;
  budget?: number | string | null; // number preferred
};

function coerceBudgetNumber(survey: SurveySummary): number | null {
  if (typeof survey.budget === 'number' && isFinite(survey.budget)) return survey.budget;
  if (typeof survey.budget === 'string') {
    const n = Number(survey.budget.replace(/[^\d.]/g, ''));
    if (isFinite(n) && n > 0) return Math.round(n);
  }
  return null;
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { surveySummary, seenGiftNames = [] } = body as {
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

    const { min, max } = mapBudgetToPriceBand(budgetNum);

    // Build a clean, compact prompt
    const prompt = `
Return ONLY JSON:
{"suggestions":[
  {"title":"","oneLiner":"","retailer":"amazon.com","query":"","priceUsd":0,"reason":""}
]}

Rules:
- 8–10 suggestions; we will filter to 5.
- retailer MUST be "amazon.com".
- priceUsd MUST be between ${min} and ${max}, inclusive.
- query MUST be a concise Amazon search phrase (no URL).
- No markdown fences, no commentary. JSON only.

Context:
relationship: ${surveySummary.relationship || ''}
about: ${surveySummary.about || ''}
smiling_scene: ${surveySummary.smile_scene || ''}
talk_for_hours: ${surveySummary.talk_hours || ''}
avoid_titles: ${seenGiftNames.join(', ') || 'none'}
`.trim();

    const history = [{ role: 'user', parts: [{ text: prompt }] }];
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

    // Top up to 5 with budget-correct generic searches if needed
    const FALLBACKS = [
      'premium coffee maker','artisan jewelry','smartwatch','wireless earbuds','cocktail smoker kit',
      'handmade leather wallet','gourmet chocolate gift','board game strategy','yoga mat premium',
      'instant camera','barista espresso scale','electric pour-over kettle','chef knife Japanese',
      'luxury throw blanket','aromatherapy diffuser','silk pillowcase','mechanical keyboard hot-swappable'
    ];
    const need = Math.max(0, 5 - inBand.length);
    const fillers = [];
    for (let i = 0; i < need; i++) {
      const q = FALLBACKS[(i * 3) % FALLBACKS.length];
      fillers.push({
        title: q.replace(/\b\w/g, m => m.toUpperCase()),
        oneLiner: 'Popular, well-reviewed options in this category.',
        retailer: 'amazon.com',
        query: q,
        priceUsd: Math.round((min + max) / 2),
        reason: 'Budget-aligned fallback search.',
      });
    }

    const final = [...inBand, ...fillers].slice(0, 5);

    // Map to the shape your /results page expects
    const out = final.map((s: any) => {
      const name = s.title;
      const query = s.query;

      // Build a price-constrained Amazon search and wrap in affiliate redirect
      const amazonUrl = buildAmazonSearchLink(query, min, max); // adds low/high and rh=p_36
      const redirectUrl = toAffiliateRedirectUrl(amazonUrl);

      return {
        name,
        // Show a single budget number (no visible band)
        estimated_price: `$${budgetNum}`,
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
