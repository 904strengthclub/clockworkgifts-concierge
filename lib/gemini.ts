// lib/gemini.ts
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
  base_purchase_url: string;
}

const model = ai.getGenerativeModel({
  model: 'gemini-2.5-flash',
});

/**
 * Generates a list of gift ideas using Gemini's raw prompt output.
 * Expects the model to return a JSON array of gift idea objects.
 */
export async function generateGiftIdeas(prompt: string): Promise<GiftIdea[]> {
  try {
    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
    });

    const text = result.response.text();

    // Attempt to extract JSON array from the response
    const match = text.match(/\[\s*{[\s\S]*}\s*\]/); // Greedy match for JSON array
    if (!match) {
      console.warn('No JSON array found in Gemini response:', text);
      return [];
    }

    const parsed = JSON.parse(match[0]) as GiftIdea[];
    return parsed;
  } catch (error) {
    console.error('Error generating gift ideas:', error);
    return [];
  }
}
