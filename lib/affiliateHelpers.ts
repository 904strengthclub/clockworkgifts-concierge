// lib/affiliateHelpers.ts

/**
 * Builds an Amazon search link with optional price constraints.
 * Price constraints are applied using Amazon's low-price/high-price parameters.
 * The keyword is URL-encoded to ensure valid search URLs.
 */
export function buildAmazonSearchLink(keyword: string, minPrice?: number, maxPrice?: number) {
  const encodedKeyword = encodeURIComponent(keyword.trim());
  let url = `https://www.amazon.com/s?k=${encodedKeyword}`;

  if (minPrice !== undefined && maxPrice !== undefined) {
    url += `&low-price=${minPrice}&high-price=${maxPrice}`;
  }

  return url;
}

/**
 * Maps a budget value into a min/max price range with +0% / -20% band.
 */
export function mapBudgetToPriceBand(budget: number) {
  const min = Math.max(0, Math.floor(budget * 0.8)); // 20% below budget
  const max = Math.floor(budget); // No over-budget allowance
  return { min, max };
}

/**
 * Appends affiliate tags and ensures min/max price are preserved.
 * Accepts an array of gift ideas and returns updated array with affiliate search links.
 */
export function appendAffiliateLinks(
  ideas: { name: string; description: string; amazonSearchUrl?: string }[],
  minPrice?: number,
  maxPrice?: number
) {
  const affiliateTag = 'clockworkgift-20';

  return ideas.map((idea) => {
    // Build a search URL from the gift name if not already provided
    const searchUrl = buildAmazonSearchLink(idea.name, minPrice, maxPrice);

    // Append affiliate tag to the URL
    const finalUrl = `${searchUrl}&tag=${affiliateTag}`;

    return {
      ...idea,
      amazonSearchUrl: finalUrl,
    };
  });
}
