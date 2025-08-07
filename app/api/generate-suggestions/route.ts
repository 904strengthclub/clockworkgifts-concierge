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

Start by saying:
"Hi! I’m Clockwork — your personal gift concierge. I’ll ask you a few quick questions about the person you’re shopping for. At the end, I’ll find you 5 great gift ideas that fit your budget. Ready?"

Ask the following questions one at a time, saving each response in memory:

1. What’s the recipient’s name?
2. What’s your relationship to them? (e.g., wife, boyfriend, friend, child)
3. What kind of occasion is this for? (birthday, anniversary, promotion, etc.)
4. What are their hobbies, interests, or general gift style? (e.g., practical, aesthetic, unique, sentimental)
5. What’s your gift budget? (under $50, $50–$100, $100–$500, $500+)

After collecting responses, confirm by saying:
"Great! I have all the information I need. Generating 5 custom gift ideas for [recipient_name] now..."

Each idea must:
- Fall within the budget: ${surveySummary.budget_range}
- Be thoughtful and connected to the recipient’s interests and relationship
- Be available online with clear delivery options (ideally within 2 weeks)
- Come from a diverse mix of stores or brands (not just Amazon)
- Avoid suggestions already shown to the user: ${seenGiftNames.join(', ') || 'None'}

Use a Google Search grounding tool to find the most up-to-date product information.

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

    const rawSuggestions = await generateGiftIdeas(prompt);
    const suggestionsWithAffiliates = await appendAffiliateLinks(rawSuggestions);

    return NextResponse.json(suggestionsWithAffiliates);
  } catch (err) {
    console.error('API Error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
