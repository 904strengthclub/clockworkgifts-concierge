// app/api/generate-suggestions/route.ts
import { NextResponse } from 'next/server';
import { generateGiftIdeasStructured } from '@/lib/gemini';
import { mapBudgetToPriceBand, buildAmazonSearchLink, toAffiliateRedirectUrl } from '@/lib/affiliateHelpers';

type SurveySummary = {
  // your UI may send any of these
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
  // Priority: explicit number field first
  if (typeof survey.target_budget_usd === 'number' && isFinite(survey.target_budget_usd)) {
    return survey.target_budget_usd;
  }
  // If 'budget' is present (number or numeric string)
  if (survey.budget !== undefined && survey.budget !== null) {
    const n = Number(survey.budget);
    if (isFinite(n) && n > 0) return n;
  }
  // Parse something like "$300" or "300" in budget_range
  if (typeof survey.budget_range === 'string') {
    const m = survey.budget_range.match(/(\d+(?:\.\d+)?)/);
    if (m) {
      const n = Number(m[1]);
      if (isFinite(n) && n > 0) return n;
    }
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

    // Pull a numeric budget from whatever field the UI provided
    const budgetNum = coerceBudgetNumber(surveySummary);
    if (!budgetNum) {
      return NextResponse.json({ error: 'Budget is required' }, { status: 400 });
    }

    // Build a tight +0 / -20% band
    const { min, max } = mapBudgetToPriceBand(budgetNum);
    const priceBandDisplay = `$${min}–$${max}`;

    // Prompt for the model. We’ll still filter and enforce on the server.
    const prompt = `
Return ONLY JSON:
{"suggestions":[
  {"title":"","oneLiner":"","retailer":"amazon.com","query":"","priceUsd":0,"reason":""}
]}

Rules:
- 8–10 suggestions so we can filter to 5.
- retailer MUST be "amazon.com".
- priceUsd MUST be between ${min} and ${max}, inclusive.
- query MUST be a concise Amazon search phrase (no URL).
- JSON only; no markdown or prose.

Recipient:
${JSON.stringify({
  name: surveySummary.name || '',
  relationship: surveySummary.relationship || '',
  occasion: surveySummary.occasion || '',
  date: surveySummary.date || '',
  about: surveySummary.about || '',
  avoid: seenGiftNames,
}, null, 2)}
    `.trim();

    // Ask the model (expects: (history: any[], minBudget: number, maxBudget: number))
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

    // Map to the shape your /results page expects, with price-constrained Amazon links
    const out = final.map((s: any) => {
      const name = s.title;
      const query = s.query;
      const amazonUrl = buildAmazonSearchLink(query, min, max); // adds low/high & rh=p_36
      const redirectUrl = toAffiliateRedirectUrl(amazonUrl);    // /api/go?u=...&r=amazon.com

      return {
        name,
        estimated_price: priceBandDisplay,        // band shown to the user
        store_or_brand: 'amazon.com',
        description: s.reason || s.oneLiner || 'Curated Amazon search.',
        image_url: '/retailers/generic-store.svg',
        suggested_platform: 'amazon.com',
        search_query: query,
        url: redirectUrl,                         // what the Results page uses as href
      };
    });

    return NextResponse.json(out);
  } catch (error) {
    console.error('Error generating gift ideas:', error);
    return NextResponse.json({ error: 'Failed to generate gift ideas' }, { status: 500 });
  }
}
