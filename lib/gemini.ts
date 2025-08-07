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

    // 🧼 Clean: strip triple-backtick formatting if it exists
    const cleanedText = text
      .replace(/^```json/, '')
      .replace(/^```/, '')
      .replace(/```$/, '')
      .trim();

    // 🧪 Attempt to parse JSON output
    const parsed = JSON.parse(cleanedText);

    if (!Array.isArray(parsed)) {
      console.error('❌ Gemini response is not an array:', parsed);
      throw new Error('Gemini output was not a valid JSON array.');
    }

    return parsed;
  } catch (error) {
    console.error('Error generating gift ideas:', error);
    throw error;
  }
}
