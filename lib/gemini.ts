// /lib/gemini.ts
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function generateGiftIdeas(prompt: string): Promise<any> {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Try to parse structured JSON from the result
    const jsonStart = text.indexOf("[");
    const jsonEnd = text.lastIndexOf("]") + 1;
    if (jsonStart !== -1 && jsonEnd !== -1) {
      const jsonString = text.substring(jsonStart, jsonEnd);
      return JSON.parse(jsonString);
    } else {
      return { error: "No valid JSON found in Gemini response." };
    }
  } catch (error) {
    console.error("Gemini API Error:", error);
    return { error: "Failed to generate content from Gemini API." };
  }
}
