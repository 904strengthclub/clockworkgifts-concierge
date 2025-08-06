import { NextRequest, NextResponse } from 'next/server';
import { GiftResult } from '@/lib/types';

// Import all store search functions
import { searchAmazon } from '@/lib/stores/amazon';
import { searchEtsy } from '@/lib/stores/etsy';
import { searchRei } from '@/lib/stores/rei';
import { searchDicks } from '@/lib/stores/dicks';
import { searchMacys } from '@/lib/stores/macys';
import { searchNordstrom } from '@/lib/stores/nordstrom';
import { searchBestbuy } from '@/lib/stores/bestbuy';
import { searchUncommongoods } from '@/lib/stores/uncommongoods';
import { searchWilliamsSonoma } from '@/lib/stores/williams_sonoma';
import { searchCrateandbarrel } from '@/lib/stores/crateandbarrel';
import { searchSephora } from '@/lib/stores/sephora';
import { searchOmahasteaks } from '@/lib/stores/omahasteaks';

export async function POST(req: NextRequest) {
  try {
    const { keywords, priceBand, category } = await req.json();

    if (!keywords || typeof keywords !== 'string') {
      return NextResponse.json({ error: 'Missing or invalid keywords' }, { status: 400 });
    }

    // Call all store search functions in parallel
    const results = await Promise.allSettled([
      searchAmazon(keywords, priceBand, category),
      searchEtsy(keywords, priceBand, category),
      searchRei(keywords, priceBand, category),
      searchDicks(keywords, priceBand, category),
      searchMacys(keywords, priceBand, category),
      searchNordstrom(keywords, priceBand, category),
      searchBestbuy(keywords, priceBand, category),
      searchUncommongoods(keywords, priceBand, category),
      searchWilliamsSonoma(keywords, priceBand, category),
      searchCrateandbarrel(keywords, priceBand, category),
      searchSephora(keywords, priceBand, category),
      searchOmahasteaks(keywords, priceBand, category)
    ]);

    // Flatten fulfilled results and filter out rejections
    const unified: GiftResult[] = results
      .filter(r => r.status === 'fulfilled')
      .flatMap((r: any) => r.value || []);

    return NextResponse.json({ results: unified });
  } catch (error) {
    console.error('Error in search-products route:', error);
    return NextResponse.json({ error: 'Search failed' }, { status: 500 });
  }
}
