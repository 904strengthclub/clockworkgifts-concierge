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

// Mapping of store domains to affiliate link templates
const affiliateLinkTemplates: Record<string, (url: string) => string> = {
  'amazon.com': (url) => `${url}?tag=clockworkgift-20`,
  'williams-sonoma.com': (url) => `${url}?cm_mmc=affiliate--clockworkgift-20`,
  'uncommongoods.com': (url) => `${url}?utm_source=affiliate&utm_medium=clockworkgift-20`,
  // Add more stores and affiliate formats here as needed
};

function getAffiliateLink(baseUrl: string): string {
  try {
    const parsed = new URL(baseUrl);
    const hostname = parsed.hostname.replace('www.', '');

    for (const domain in affiliateLinkTemplates) {
      if (hostname.endsWith(domain)) {
        return affiliateLinkTemplates[domain](baseUrl);
      }
    }
  } catch (err) {
    console.warn(`Invalid URL skipped for affiliate tagging: ${baseUrl}`);
  }

  return baseUrl; // fallback to original if no affiliate template found
}

export async function appendAffiliateLinks(
  suggestions: GiftSuggestion[]
): Promise<GiftSuggestion[]> {
  return suggestions.map((item) => ({
    ...item,
    direct_purchase_url: getAffiliateLink(item.base_purchase_url),
  }));
}
