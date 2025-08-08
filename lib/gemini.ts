import { GoogleGenerativeAI } from '@google/generative-ai';

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) throw new Error('Missing GEMINI_API_KEY in environment variables');

const ai = new GoogleGenerativeAI(apiKey);

export interface GiftIdea {
  name: string;
  estimated_price: string;
  store_or_brand: string;
  description: string;
  image_url: string;
  suggested_platform: string;  // e.g., "uncommongoods.com"
  search_query: string;        // e.g., "personalized cheese board uncommongoods"
}

const model = ai.getGenerativeModel({
  model: 'gemini-2.5-flash',
});

/**
 * Generates a list of gift ideas using Gemini, constrained to approved platforms.
 */
export async function generateGiftIdeas(userPrompt: string): Promise<GiftIdea[]> {
  try {
    const platformSearchMap = [
      'uncommongoods.com',
      'etsy.com',
      'crateandbarrel.com',
      'nordstrom.com',
      'anthropologie.com',
      'food52.com',
      'thegrommet.com',
      'markandgraham.com',
      'saksfifthavenue.com',
      'williams-sonoma.com',
      'cratejoy.com',
      'cultgaia.com',
      'theline.com',
      'goop.com',
      'bliss.com',
      'fairtradewinds.net',
      'tenthousandvillages.com',
      'sokoglam.com',
      'lovevery.com',
      'packedwithpurpose.gifts',
      'masterclass.com',
      'fourseasons.com',
      'boxycharm.com',
      'giftory.com',
      'hatch.co',
      'paperlesspost.com'
    ];

    const groundingPrompt = `
You are Clockwork — an elite AI gifting concierge.

You must generate 5 thoughtful and creative gift ideas based on the user's recipient profile.

Gifts must:
- Be personalized, ethical, premium, or unique
- Fit the user's specified budget
- Be available online with reliable shipping

🛍️ Use ONLY the following domains for product sourcing:
${platformSearchMap.map((p) => `- ${p}`).join('\n')}

⛔ Do NOT use Amazon, Walmart, Shein, AliExpress, eBay, or any unverified marketplace.

If you cannot find a direct product page on one of these platforms, provide a fallback Google Search URL in this format:
\`https://www.google.com/search?q=site:example.com+search+terms\`

Your output must be a JSON array of exactly 5 gift objects.
Each object must include:
- name (string)
- estimated_price (string)
- store_or_brand (string)
- description (string)
- image_url (string)
- suggested_platform (string) — one of the domains above
- search_query (string) — the ideal phrase to search for this gift on the given platform

Output ONLY the JSON array — no extra text.

User Input:
${userPrompt}
    `.trim();

    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: groundingPrompt }] }],
    });

    const text = result.response.text();

    const match = text.match(/\[\s*{[\s\S]*}\s*\]/);
    if (!match) {
      console.warn('Gemini response did not include a JSON array:', text);
      return [];
    }

    const parsed = JSON.parse(match[0]) as GiftIdea[];
    return parsed;
  } catch (error) {
    console.error('Gemini API error:', error);
    return [];
  }
}
