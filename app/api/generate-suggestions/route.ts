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

Your job is to help users find the perfect gift by asking a few questions about the person they're shopping for. You then generate 5 creative gift ideas based on their answers.

Each idea must:
- Fall within the budget: ${surveySummary.budget_range}
- Be thoughtful and connected to the recipient’s interests and relationship
- Be available online with clear delivery options (ideally within 2 weeks)
- Come from a diverse mix of stores or brands (not just Amazon)
- Avoid suggestions already shown to the user: ${seenGiftNames.join(', ') || 'None'}

Return ONLY a JSON array of 5 gift objects.
Each gift must include:
- name (string)
- estimated_price (string)
- store_or_brand (string)
- description (string)
- image_url (string)
- base_purchase_url (string - unaffiliated URL)

Recipient Profile:
${JSON.stringify(surveySummary, null, 2)}
    `;

    const rawText = await generateGiftIdeas([prompt]);

    const parsedSuggestions = rawText;

    if (!Array.isArray(parsedSuggestions) || parsedSuggestions.length === 0) {
      return NextResponse.json(
        { error: 'No suggestions returned from Gemini.' },
        { status: 502 }
      );
    }

    const suggestionsWithAffiliates = await appendAffiliateLinks(parsedSuggestions);
    return NextResponse.json(suggestionsWithAffiliates);
  } catch (err) {
    console.error('API Error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
