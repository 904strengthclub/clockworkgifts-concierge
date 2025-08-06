import { GiftResult } from '../types';
import curatedProducts from '../data/amazon-curated.json';

/**
 * Returns curated Amazon products using static SiteStripe links.
 * Replace the placeholder values in amazon-curated.json with real links & images.
 *
 * @param keywords Optional keywords from GPT output (unused for MVP)
 * @param priceBand Optional price band string (unused for MVP)
 * @param category Optional category string (unused for MVP)
 * @returns Promise<GiftResult[]>
 */
export async function searchAmazon(
  keywords?: string,
  priceBand?: string,
  category?: string
): Promise<GiftResult[]> {
  // For MVP: return the full curated list.
  // In the future, filter this list based on keywords/category if desired.
  return curatedProducts as GiftResult[];
}
