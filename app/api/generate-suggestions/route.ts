// /app/api/generate-suggestions/route.ts
import { NextResponse } from 'next/server';
import { generateGiftIdeasWithConversation } from '@/lib/gemini';
import { appendAffiliateLinks } from '@/lib/affiliateHelpers';

// ... (interface and POST function signature are the same)

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { surveySummary, seenGiftNames = [] } = body;

    // ... (input validation is the same)

    const systemInstruction = `
      You are Clockwork — a friendly and thoughtful AI gift concierge.

      Your job is to help users find the perfect gift by generating 5 creative gift ideas based on their answers.

      ... (the rest of your prompt) ...

      Recipient Profile:
      ${JSON.stringify(surveySummary, null, 2)}
    `;

    // The Gemini API expects an array of objects, not an array of strings
    const history = [
      { role: 'user', parts: [{ text: systemInstruction }] },
      // The Gemini API allows multiple 'user' parts in a single turn.
      // You can also add other user-provided data here if needed.
    ];

    // This line is now correct, as the function signature and the argument's type match
    const suggestionsString = await generateGiftIdeasWithConversation(history);

    let parsedSuggestions;
    try {
      // This line is also now correct, as suggestionsString is a JSON string
      parsedSuggestions = JSON.parse(suggestionsString);
    } catch (parseError) {
      console.error('JSON Parse Error:', parseError, 'Raw Gemini output:', suggestionsString);
      return NextResponse.json(
        { error: 'Invalid JSON returned from Gemini.' },
        { status: 502 }
      );
    }

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