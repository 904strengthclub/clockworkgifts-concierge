// lib/gemini.ts
import { GoogleGenerativeAI, Content, GenerativeModel, Tool } from '@google/generative-ai';

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  throw new Error('Missing GEMINI_API_KEY in environment variables');
}

const genAI = new GoogleGenerativeAI(apiKey);

export async function generateGiftIdeasWithConversation(history: Content[]) {
  try {
    const model: GenerativeModel = genAI.getGenerativeModel({
      model: 'gemini-2.0-flash',
      // We use 'as unknown as Tool[]' to bypass the type checking.
      // This is necessary because the library's Tool type doesn't yet
      // recognize the 'googleSearch' property, but the functionality
      // still works.
      tools: [{ googleSearch: {} }] as unknown as Tool[], // <--- THIS IS THE FIX
    });

    const result = await model.generateContent({ contents: history });
    const response = result.response;
    const text = response.text();

    return text;
  } catch (error) {
    console.error('Error generating gift ideas:', error);
    throw error;
  }
}