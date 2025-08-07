// /lib/gemini.ts
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

/**
 * Generates 5 gift suggestions based on a structured prompt.
 * Extracts only the raw JSON array from the Gemini response.
 */
export async function generateGiftIdeas(prompt: string) {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

    const result = await model.generateContent(prompt);
    const text = result.response.text();

    // Log raw response for debugging (you can remove this after testing)
    console.log('Gemini raw output:', text);

    // Use regex to extract the first JSON array from the output
    const jsonMatch = text.match(/\[\s*{[\s\S]*?}\s*\]/);
    if (!jsonMatch) {
      throw new Error('No valid JSON array found in Gemini output');
    }

    const jsonString = jsonMatch[0];
    const suggestions = JSON.parse(jsonString);

    if (!Array.isArray(suggestions)) {
      throw new Error('Parsed result is not an array');
    }

    return suggestions;
  } catch (err) {
    console.error('Error in generateGiftIdeas:', err);
    return []; // fallback to empty array on failure
  }
}
