import { NextResponse } from 'next/server';
import { generateGiftIdeasStructured } from '@/lib/gemini';
import { buildRetailerLink } from '@/lib/retailers';

type SurveySummary = {
  name: string;
  relationship: string;
  occasion: string;
  date: string;              // MM-DD or ISO
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
    const hasTarget = Number.isFinite(target) && target > 0;
    const maxBudget = hasTarget ? Math.round(target) : 200;
    const minBudget = hasTarget ? Math.round(target * 0.85) : 100;
    const priceBand = `$${minBudget}–$${maxBudget}`;

    const isoDate = /^\d{2}-\d{2}$/.test(surveySummary.date)
      ? toISOFromMMDD(surveySummary.date)
      : surveySummary.date;

    const userPrompt = `
Recipient: ${surveySummary.name} (${surveySummary.relationship})
Occasion: ${surveySummary.occasion} on ${isoDate}
About: ${surveySummary.about || '—'}
Avoid previously shown items: ${seenGiftNames.length ? seenGiftNames.join(', ') : 'None'}
`.trim();

    // 1) Model returns 8–10 ideas
    const suggestions = await generateGiftIdeasStructured(userPrompt, minBudget, maxBudget);

    // 2) Strict in-band, unique by title|query, unseen
    const seenKey = new Set<string>();
    const inBandUnique = suggestions.filter(s => {
      if (s.priceUsd < minBudget || s.priceUsd > maxBudget) return false;
      if (seenGiftNames.includes(s.title)) return false;
      const key = (s.title || '').toLowerCase() + '|' + (s.query || '').toLowerCase();
      if (seenKey.has(key)) return false;
      seenKey.add(key);
      return true;
    });

    // 3) Fillers if needed (unique, budget-centered, decent reasons)
    const FILLER_SEEDS = [
      'premium coffee maker','artisan jewelry','smartwatch','wireless earbuds','cocktail smoker kit',
      'handmade leather wallet','gourmet chocolate gift','board game strategy','yoga mat premium',
      'instant camera','barista espresso scale','electric pour-over kettle','chef knife Japanese',
      'luxury throw blanket','aromatherapy diffuser','silk pillowcase','mechanical keyboard hot-swappable'
    ];

    function buildReason(q: string) {
      const parts: string[] = [];
      if (surveySummary.about) parts.push(`ties to interests (${surveySummary.about.slice(0,60)}…)`);
      if (surveySummary.relationship) parts.push(`fits a ${surveySummary.relationship.toLowerCase()} gift`);
      if (surveySummary.occasion) parts.push(`works for ${surveySummary.occasion.toLowerCase()}`);
      return `Good coverage on Amazon; ${parts.join(', ')}. Start here and refine by ratings/price.`;
    }

    const need = Math.max(0, 5 - inBandUnique.length);
    const usedFillers = new Set<string>();
    const fillers = [];
    for (let i = 0; i < need; i++) {
      const term = FILLER_SEEDS[(i * 3) % FILLER_SEEDS.length];
      if (usedFillers.has(term)) continue;
      usedFillers.add(term);
      fillers.push({
        title: term.replace(/\b\w/g, m => m.toUpperCase()),
        oneLiner: 'Popular, well-reviewed options in this category.',
        retailer: 'amazon.com',
        query: term,
        idHint: '',
        priceUsd: Math.round((minBudget + maxBudget) / 2),
        priceBand,
        reason: buildReason(term),
      });
    }

    const finalFive = [...inBandUnique, ...fillers].slice(0, 5);

    // 4) Map to frontend shape with bulletproof Amazon URL
    const out = finalFive.map(s => {
      const name = s.title || 'Gift Idea';
      const query = s.query || name;
      const url = buildRetailerLink('amazon.com', query, s.idHint);
      return {
        name,
        estimated_price: priceBand, // band, since we link to search
        store_or_brand: 'amazon.com',
        description: s.reason || s.oneLiner || 'Curated Amazon search.',
        image_url: '/retailers/generic-store.svg',
        suggested_platform: 'amazon.com',
        search_query: query,
        one_liner: s.oneLiner || '',
        id_hint: s.idHint,
        url, // always present
      };
    });

    return NextResponse.json(out);
  } catch (err) {
    console.error('API Error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
