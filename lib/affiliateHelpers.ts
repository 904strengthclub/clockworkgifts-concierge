// /lib/affiliateHelpers.ts

import { GiftIdea } from './gemini';

const platformSearchMap: Record<string, (query: string) => string> = {
  amazon: (q) => `https://www.amazon.com/s?k=${encodeURIComponent(q)}`,
  etsy: (q) => `https://www.etsy.com/search?q=${encodeURIComponent(q)}`,
  rei: (q) => `https://www.rei.com/search?q=${encodeURIComponent(q)}`,
  nordstrom: (q) => `https://www.nordstrom.com/sr?keyword=${encodeURIComponent(q)}`,
  'crate and barrel': (q) => `https://www.crateandbarrel.com/search?query=${encodeURIComponent(q)}`,
  google: (q) => `https://www.google.com/search?q=${encodeURIComponent(q)}`,
};

export async function appendAffiliateLinks(gifts: GiftIdea[]): Promise<GiftIdea[]> {
  return gifts.map((gift) => {
    const platform = gift.suggested_platform.toLowerCase().trim();
    const query = gift.search_query || `${gift.name} ${gift.store_or_brand}`;

    const generator = platformSearchMap[platform] || platformSearchMap['google'];
    const searchUrl = generator(query);

    return {
      ...gift,
      direct_purchase_url: searchUrl,
    };
  });
}
