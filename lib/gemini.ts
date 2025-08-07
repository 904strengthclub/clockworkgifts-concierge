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
    return response.text();
  } catch (error) {
    console.error('Error generating gift ideas:', error);
    throw error;
  }
}
