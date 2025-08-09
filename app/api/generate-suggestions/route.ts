// /app/api/generate-suggestions/route.ts
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

function priceBandString(min: number, max: number) {
  return `$${Math.round(min)}–$${Math.round(max)}`;
}

// simple filler catalog to guarantee 5
const FILLER_KEYWORDS = [
  // broadly applicable, map well to Amazon searches
  'personalized gift',
  'premium coffee maker',
  'artisan jewelry',
  'spa gift set',
  'luxury blanket',
  'smartwatch',
  'wireless earbuds',
  'cookware set',
  'cocktail kit',
  'handmade leather wallet',
  'scented candle set',
  'fitness tracker',
  'board game strategy',
  'yoga mat premium',
  'instant camera',
];

function synthesizeFillers(
  needed: number,
  target: number,
  about?: string,
  relationship?: string,
  occasion?: string
) {
  const picks: { title: string; oneLiner: string; query: string; priceUsd: number; reason: string }[] = [];
  // bias terms a bit by context
  const bias: string[] = [];
  const aboutLower = (about || '').toLowerCase();
  if (aboutLower.includes('coffee')) bias.push('coffee');
  if (aboutLower.includes('hike') || aboutLower.includes('camp')) bias.push('outdoor');
  if (aboutLower.includes('cook') || aboutLower.includes('kitchen')) bias.push('cookware');
  if (aboutLower.includes('music')) bias.push('audio');
  if ((relationship || '').toLowerCase().includes('wife') || (relationship || '').toLowerCase().includes('girlfriend')) bias.push('jewelry');
  if ((occasion || '').toLowerCase().includes('anniversary')) bias.push('anniversary');

  // choose from fillers with bias first
  const pool = [...FILLER_KEYWORDS];
  if (bias.length) {
    bias.forEach(b => pool.unshift(`${b} gift`));
  }

  for (let i = 0; i < needed; i++) {
    const term = pool[(i * 3) % pool.length]; // deterministic-ish
    const title = term.split(' ').map(s => s[0].toUpperCase() + s.slice(1)).join(' ');
    const q = term;
    const reason = 'Fallback search seeded to match budget and interests; refine on Amazon filters if needed.';
    picks.push({
      title,
      oneLiner: 'Popular, well-reviewed options in this category.',
      query: q,
      priceUsd: target,
      reason,
    });
  }
  return picks;
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

    // 1) Ask model for 8–10, then filter
    let suggestions = await generateGiftIdeasStructured(userPrompt, minBudget, maxBudget);

    // 2) Strict in-band & unseen
    const unique = new Set<string>();
    const inBand = suggestions
      .filter(s => s.priceUsd >= minBudget && s.priceUsd <= maxBudget)
      .filter(s => !seenGiftNames.includes(s.title))
      .filter(s => {
        if (unique.has(s.title)) return false;
        unique.add(s.title);
        return true;
      });

    // 3) If < 5, synthesize fillers to top up
    const need = Math.max(0, 5 - inBand.length);
    const fillers = need
      ? synthesizeFillers(need, Math.round((minBudget + maxBudget) / 2), surveySummary.about, surveySummary.relationship, surveySummary.occasion)
      : [];

    const finalFive = [...inBand, ...fillers].slice(0, 5);

    // 4) Map to frontend shape with bulletproof Amazon URL
    const priceBand = priceBandString(minBudget, maxBudget);

    const out = finalFive.map(s => {
      const name = s.title || 'Gift Idea';
      const query = (s as any).query || name;
      const url = buildRetailerLink('amazon.com', query, (s as any).idHint);
      return {
        name,
        estimated_price: priceBand,
        store_or_brand: 'amazon.com',
        description: s.reason || s.oneLiner || 'Curated Amazon search.',
        image_url: '/retailers/generic-store.svg',
        suggested_platform: 'amazon.com',
        search_query: query,
        one_liner: s.oneLiner || '',
        id_hint: (s as any).idHint,
        url, // always present
      };
    });

    return NextResponse.json(out);
  } catch (err) {
    console.error('API Error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
