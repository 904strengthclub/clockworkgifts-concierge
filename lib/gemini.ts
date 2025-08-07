// lib/gemini.ts
import { GoogleGenerativeAI, Tool, Part, Schema, SchemaType } from '@google/generative-ai';

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  throw new Error('Missing GEMINI_API_KEY in environment variables');
}

const ai = new GoogleGenerativeAI(apiKey);

// Define the schema for the JSON output we want from the model.
// Use SchemaType for the 'type' property
const giftIdeaSchema: Schema = {
  type: SchemaType.ARRAY,
  items: {
    type: SchemaType.OBJECT,
    properties: {
      name: { type: SchemaType.STRING },
      estimated_price: { type: SchemaType.STRING },
      store_or_brand: { type: SchemaType.STRING },
      description: { type: SchemaType.STRING },
      image_url: { type: SchemaType.STRING },
      base_purchase_url: { type: SchemaType.STRING },
    },
    required: ['name', 'estimated_price', 'store_or_brand', 'description', 'image_url', 'base_purchase_url'],
  },
};

// Create the GenerativeModel instance
const model = ai.getGenerativeModel({
  model: 'gemini-2.5-flash',
  tools: [
    {
      googleSearch: {},
    } as Tool,
  ],
  generationConfig: {
    responseMimeType: 'application/json',
    responseSchema: giftIdeaSchema,
  },
});

export async function generateGiftIdeas(prompt: string) {
  try {
    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt } as Part] }],
    });

    const response = result.response;
    const text = response.text();

    return text;
  } catch (error) {
    console.error('Error generating gift ideas:', error);
    throw error;
  }
}