// lib/gemini.ts
import { GoogleGenerativeAI, Tool, SchemaType, FunctionDeclaration } from '@google/generative-ai';

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

// Define the function declaration using correct typing
const createGiftIdeasFunction: FunctionDeclaration = {
  name: 'createGiftIdeas',
  description: 'Generates a list of 5 gift ideas based on a user profile.',
  parameters: {
    type: SchemaType.OBJECT,
    properties: {
      gifts: {
        type: SchemaType.ARRAY,
        description: 'An array of gift idea objects.',
        items: {
          type: SchemaType.OBJECT,
          properties: {
            name: { type: SchemaType.STRING, description: 'The name of the gift' },
            estimated_price: { type: SchemaType.STRING, description: 'The estimated price of the gift' },
            store_or_brand: { type: SchemaType.STRING, description: 'The store or brand where the gift can be purchased' },
            description: { type: SchemaType.STRING, description: 'A brief description of the gift' },
            image_url: { type: SchemaType.STRING, description: 'A direct URL to an image of the gift' },
            base_purchase_url: { type: SchemaType.STRING, description: 'A direct URL to the product page for the gift' },
          },
          required: [
            'name',
            'estimated_price',
            'store_or_brand',
            'description',
            'image_url',
            'base_purchase_url',
          ],
        },
      },
    },
    required: ['gifts'],
  },
};

const model = ai.getGenerativeModel({
  model: 'gemini-2.5-flash',
  tools: [
    {
      functionDeclarations: [createGiftIdeasFunction],
    },
    {
      googleSearch: {}, // Included for grounding
    } as Tool,
  ],
});

/**
 * Generates a list of gift ideas based on a user prompt.
 * @param prompt - Natural language prompt containing user profile
 * @returns Promise<GiftIdea[]>
 */
export async function generateGiftIdeas(prompt: string): Promise<GiftIdea[]> {
  try {
    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
    });

    const call = result.response.functionCall();

    if (call?.name === 'createGiftIdeas' && Array.isArray((call.args as any).gifts)) {
      return (call.args as { gifts: GiftIdea[] }).gifts;
    }

    console.warn('Unexpected Gemini response:', call);
    return [];
  } catch (error) {
    console.error('Error generating gift ideas:', error);
    return [];
  }
}
