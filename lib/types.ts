// /lib/types.ts

export interface GiftResult {
  store: string;        // Store name (Amazon, Etsy, REI, etc.)
  title: string;        // Product title
  price: number;        // Price in USD
  image: string;        // Image URL
  link: string;         // Direct affiliate link
  delivery_date?: string; // Optional delivery date
  reasoning?: string;     // Optional reasoning from GPT
}
