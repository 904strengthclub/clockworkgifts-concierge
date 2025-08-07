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
      typeof surveySummary.budget_range !== 'string'
    ) {
      return NextResponse.json(
        { error: 'Missing or invalid surveySummary input' },
        { status: 400 }
      );
    }

    const prompt = `
You are Clockwork — a friendly and thoughtful AI gift concierge.

The user has answered the following 5 questions about their gift recipient:

1. What’s the recipient’s name?
→ ${surveySummary.recipient_name}

2. What’s your relationship to them?
→ ${surveySummary.relationship}

3. What kind of occasion is this for?
→ ${surveySummary.occasion_type}

4. What are their hobbies, interests, or general gift style?
→ ${surveySummary.hobbies_style}

5. What’s your gift budget?
→ ${surveySummary.budget_range}

Now, based on this profile, generate 5 creative gift ideas.

Each idea must:
- Fall within the budget.
- Be thoughtful and connected to the recipient’s interests and relationship.
- Be available online with clear delivery options (ideally within 2 weeks).
- Come from a diverse mix of stores or brands (not just Amazon).
- Avoid suggestions already shown to the user: ${seenGiftNames.join(', ') || 'None'}.

Use a Google Search grounding tool to find the most up-to-date product information.

Return ONLY a JSON array of 5 gift objects.

Each gift must include:
- name (string)
- estimated_price (string)
- store_or_brand (string)
- description (string)
- image_url (string)
- base_purchase_url (string — unaffiliated URL)
`;

    const rawSuggestions = await generateGiftIdeas(prompt);
    const suggestionsWithAffiliates = await appendAffiliateLinks(rawSuggestions);

    return NextResponse.json(suggestionsWithAffiliates);
  } catch (err) {
    console.error('API Error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
