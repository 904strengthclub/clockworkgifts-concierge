import { GoogleGenerativeAI } from '@google/generative-ai';
import type { Content } from '@google/generative-ai';

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  throw new Error('Missing GEMINI_API_KEY in environment variables');
}

const genAI = new GoogleGenerativeAI(apiKey);

// Accept a single prompt string
export async function generateGiftIdeas(prompt: string): Promise<any[]> {
  try {
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.0-flash',
    });

    // Format the prompt as a conversation with a single user message
    const conversation: Content[] = [
      {
        role: 'user',
        parts: [{ text: prompt }],
      },
    ];

    const result = await model.generateContent({
      contents: conversation,
    });

    const text = result.response.text();

    // 🧼 Clean up markdown formatting if any
    const cleanedText = text
      .replace(/^```json/, '')
      .replace(/^```/, '')
      .replace(/```$/, '')
      .trim();

    const parsed = JSON.parse(cleanedText);

    if (!Array.isArray(parsed)) {
      throw new Error('Gemini output was not a valid array.');
    }

    return parsed;
  } catch (error) {
    console.error('Error in generateGiftIdeas:', error);
    throw error;
  }
}
