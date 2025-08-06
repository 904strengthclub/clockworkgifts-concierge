import { GiftResult } from '../types';

/**
 * Search Nordstrom API for gifts.
 * @param keywords Search keywords from GPT output.
 * @param priceBand Optional price band string.
 * @param category Optional category string.
 * @returns Promise<GiftResult[]>
 */
export async function searchNordstrom(keywords: string, priceBand?: string, category?: string): Promise<GiftResult[]> {
  // TODO: Implement API call for nordstrom
  // Return results in the GiftResult format
  return [];
}
