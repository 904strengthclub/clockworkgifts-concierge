// app/api/generate-suggestions/route.ts
import { NextResponse } from 'next/server';
import { generateGiftIdeasStructured } from '@/lib/gemini';
import { appendAffiliateLinks, mapBudgetToPriceBand } from '@/lib/affiliateHelpers';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { surveySummary, seenGiftNames = [] } = body;

    if (!surveySummary || !surveySummary.budget) {
      return NextResponse.json({ error: 'Missing surveySummary or budget' }, { status: 400 });
    }

    // Build system prompt
    const systemInstruction = `
      You are Clockwork — a friendly and thoughtful AI gift concierge.
      Your job is to help users find the perfect gift by generating 5 creative gift ideas.
      Ideas must match recipient profile, occasion, and budget.
      Avoid repeats from seenGiftNames.

      Recipient Profile:
      ${JSON.stringify(surveySummary, null, 2)}

      Seen Gift Names:
      ${JSON.stringify(seenGiftNames, null, 2)}
    `;

    const history = [
      { role: 'user', parts: [{ text: systemInstruction }] }
    ];

    // Derive min/max price band from budget
    const { min, max } = mapBudgetToPriceBand(surveySummary.budget);

    // Pass min/max budget to Gemini
    const ideas = await generateGiftIdeasStructured(history, min, max);

    // Append affiliate links with min/max price constraints
    const ideasWithLinks = appendAffiliateLinks(ideas, min, max);

    return NextResponse.json({ ideas: ideasWithLinks });
  } catch (error) {
    console.error('Error generating gift ideas:', error);
    return NextResponse.json({ error: 'Failed to generate gift ideas' }, { status: 500 });
  }
}
