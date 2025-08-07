// /app/api/generate-suggestions/route.ts
import { NextResponse } from 'next/server';
import { generateGiftIdeas } from '@/lib/gemini';
import { appendAffiliateLinks } from '@/lib/affiliateHelpers';

interface SurveySummary {
  recipient_name: string;
  relationship: string;
  occasion_type: string;
  hobbies_style: string;
  budget_range: string;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { surveySummary, seenGiftNames = [] } = body;

    if (
      !surveySummary ||
      typeof surveySummary !== 'object' ||
      !('budget_range' in surveySummary)
    ) {
      return NextResponse.json(
        { error: 'Missing or invalid surveySummary input' },
        { status: 400 }
      );
    }

    const prompt = `
      Based on the following gift recipient profile, suggest 5 creative gift ideas.

      Constraints:
      - Gift ideas must fall within the specified budget: ${surveySummary.budget_range}.
      - Avoid suggesting gifts already shown to the user: ${seenGiftNames.join(', ') || 'None'}.
      - Include a mix of stores and brands.
      - Ensure gifts are thoughtful and relevant to the recipient profile.

      For each gift, return the following:
        - name
        - estimated_price
        - store_or_brand
        - description
        - image_url (grounded from Google)
        - base_purchase_url (grounded from Google)

      Return ONLY a JSON array of 5 gift objects, no commentary.

      Recipient Profile:
      ${JSON.stringify(surveySummary, null, 2)}
    `;

    const rawSuggestions = await generateGiftIdeas(prompt);
    const suggestionsWithAffiliates = await appendAffiliateLinks(rawSuggestions);

    return NextResponse.json(suggestionsWithAffiliates);
  } catch (err) {
    console.error('API Error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
