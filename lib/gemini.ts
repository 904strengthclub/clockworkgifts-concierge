// lib/gemini.ts
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
const model = genAI.getGenerativeModel({
  model: 'gemini-2.0-flash',
  generationConfig: { temperature: 0.8, maxOutputTokens: 800 },
});

export async function generateGiftIdeasStructured(
  history: any[],
  minBudget: number,
  maxBudget: number
) {
  try {
    const prompt = `
Generate exactly 5 creative gift ideas within the price range ${minBudget}–${maxBudget} USD.  
Each result must be unique and aimed at the recipient profile provided.  
Return only valid JSON in the format:
[
  {
    "name": "Gift Name",
    "description": "Short appealing description",
    "amazonSearchUrl": "https://www.amazon.com/s?k=search+terms&rh=p_36%3A${minBudget*100}-${maxBudget*100}"
  }
]
Notes:
- Use general keywords for search terms, no brand names unless very common.
- Use &rh=p_36%3A[minCents]-[maxCents] in Amazon URL to enforce price range.
- Do not include duplicate items.
`;

    const chat = model.startChat({ history });
    const result = await chat.sendMessage([{ text: prompt }]);

    const text = result.response.candidates?.[0]?.content?.parts?.[0]?.text || '[]';
    let parsed: any[] = [];

    try {
      parsed = JSON.parse(text);
    } catch (err) {
      console.warn('JSON parse error, returning empty list:', err);
    }

    return parsed;
  } catch (error) {
    console.error('Gemini API error:', error);
    return [];
  }
}
