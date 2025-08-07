import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function generateGiftIdeas(prompt: string) {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

    console.log('🔍 Prompt sent to Gemini:\n', prompt); // ✅ Log prompt

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    
    console.log('📨 Raw output from Gemini:\n', text); // ✅ Log Gemini output

    // Try parsing JSON from output
    const jsonStart = text.indexOf('[');
    const jsonEnd = text.lastIndexOf(']');
    if (jsonStart === -1 || jsonEnd === -1) {
      console.warn('⚠️ No JSON detected in Gemini response.');
      return [];
    }

    const jsonString = text.substring(jsonStart, jsonEnd + 1);
    return JSON.parse(jsonString);
  } catch (err) {
    console.error('❌ Error generating gift ideas:', err);
    return [];
  }
}
