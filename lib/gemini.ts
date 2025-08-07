import { GoogleGenerativeAI } from '@google/generative-ai';
import { GoogleSearch } from '@google/generative-ai/server';

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  throw new Error('Missing GEMINI_API_KEY in environment variables');
}

const genAI = new GoogleGenerativeAI(apiKey);

export async function generateGiftIdeasWithConversation(history: string[]) {
  try {
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.0-flash',
      tools: [new GoogleSearch()],
    });

    const result = await model.generateContent(history);
    return result.response.text();
  } catch (error) {
    console.error('Error generating gift ideas:', error);
    throw error;
  }
}
