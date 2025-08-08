// /lib/affiliateHelpers.ts

interface GiftSuggestion {
  name: string;
  estimated_price: string;
  store_or_brand: string;
  description: string;
  image_url: string;
  base_purchase_url: string;
  direct_purchase_url?: string;
}

const affiliateLinkTemplates: Record<string, (url: string) => string> = {
  'amazon.com': (url) => `${url}?tag=clockworkgift-20`,
  // Add more affiliate-enabled domains if you can verify them
};

function getAffiliateLinkOrSearch(baseUrl: string, fallbackQuery: string): string {
  try {
    const parsed = new URL(baseUrl);
    const hostname = parsed.hostname.replace('www.', '');

    for (const domain in affiliateLinkTemplates) {
      if (hostname.endsWith(domain)) {
        return affiliateLinkTemplates[domain](baseUrl);
      }
    }
  } catch {
    // Ignore malformed URLs
  }

  // Fallback: Always return search
  return `https://www.google.com/search?q=${encodeURIComponent(fallbackQuery)}`;
}

export async function appendAffiliateLinks(
  suggestions: GiftSuggestion[]
): Promise<GiftSuggestion[]> {
  return suggestions.map((item) => {
    const fallbackQuery = `${item.name} ${item.store_or_brand}`.trim();
    const finalUrl = getAffiliateLinkOrSearch(item.base_purchase_url, fallbackQuery);

    return {
      ...item,
      direct_purchase_url: finalUrl,
    };
  });
}
