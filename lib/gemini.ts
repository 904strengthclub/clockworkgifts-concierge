import { GoogleGenerativeAI } from '@google/generative-ai';

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  throw new Error('Missing GEMINI_API_KEY in environment variables');
}

const genAI = new GoogleGenerativeAI(apiKey);

export async function generateGiftIdeas(history: string[]) {
  try {
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.0-flash',
    });

    const result = await model.generateContent(history);
    const response = result.response;
    const text = response.text();

    // 🧹 Remove markdown code block formatting: ```json ... ```
    const cleaned = text.replace(/^```json\s*|\s*```$/g, '').trim();

    try {
      const parsed = JSON.parse(cleaned);
      return parsed;
    } catch (err) {
      console.error('❌ Failed to parse Gemini response as JSON:', cleaned);
      throw err;
    }
  } catch (error) {
    console.error('Error generating gift ideas:', error);
    throw error;
  }
}
