// /app/api/generate-suggestions/route.ts
import { NextResponse } from 'next/server';
import { generateGiftIdeas } from '@/lib/gemini';
import { appendAffiliateLinks } from '@/lib/affiliateHelpers';

// ... (interface and POST function signature are the same)

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { surveySummary, seenGiftNames = [] } = body;

    // ... (input validation is the same)

    const prompt = `
      You are Clockwork — a friendly and thoughtful AI gift concierge.

      Your job is to help users find the perfect gift by generating 5 creative gift ideas based on their answers.

      Each idea must:
      - Fall within the budget: ${surveySummary.budget_range}
      - Be thoughtful and connected to the recipient’s interests and relationship
      - Be available online with clear delivery options (ideally within 2 weeks)
      - Come from a diverse mix of stores or brands (not just Amazon)
      - Avoid suggestions already shown to the user: ${seenGiftNames.join(', ') || 'None'}

      Crucial Instruction for Grounding: You MUST use a Google Search tool to find up-to-date and relevant product information. Do not rely on internal knowledge. When searching, use specific queries (e.g., "product name + brand + buy online") to find direct product pages.

      Return exactly 5 gift suggestions as a JSON array.

      Output ONLY the raw JSON. Do not include any commentary, formatting, or explanation.

      Each gift object must include:
        - name (string)
        - estimated_price (string)
        - store_or_brand (string)
        - description (string)
        - image_url (string)
      - base_purchase_url (string) — must be a direct, clickable URL to the product page


      Recipient Profile:
      ${JSON.stringify(surveySummary, null, 2)}
    `;

    // Now, a single string is passed to the function
    const parsedSuggestions = await generateGiftIdeas(prompt);

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