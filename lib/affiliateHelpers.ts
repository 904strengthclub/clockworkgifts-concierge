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
  // Add more stores as needed
};

function isLikelyInvalid(url: string): boolean {
  return (
    !url ||
    url.length < 12 ||
    url.includes('example.com') ||
    url.includes('placeholder') ||
    url.endsWith('.com') || // homepage, not product
    !url.startsWith('http')
  );
}

function getAffiliateLink(baseUrl: string, fallbackQuery: string): string {
  try {
    const parsed = new URL(baseUrl);
    const hostname = parsed.hostname.replace('www.', '');

    for (const domain in affiliateLinkTemplates) {
      if (hostname.endsWith(domain)) {
        return affiliateLinkTemplates[domain](baseUrl);
      }
    }

    // If domain not matched but URL is structurally okay, return as-is
    return baseUrl;
  } catch (err) {
    console.warn(`Invalid URL skipped for affiliate tagging: ${baseUrl}`);
  }

  // Fallback to a Google search
  return `https://www.google.com/search?q=${encodeURIComponent(fallbackQuery)}`;
}

export async function appendAffiliateLinks(
  suggestions: GiftSuggestion[]
): Promise<GiftSuggestion[]> {
  return suggestions.map((item) => {
    const fallbackQuery = `${item.name} ${item.store_or_brand}`.trim();
    const finalUrl = isLikelyInvalid(item.base_purchase_url)
      ? `https://www.google.com/search?q=${encodeURIComponent(fallbackQuery)}`
      : getAffiliateLink(item.base_purchase_url, fallbackQuery);

    return {
      ...item,
      direct_purchase_url: finalUrl,
    };
  });
}
