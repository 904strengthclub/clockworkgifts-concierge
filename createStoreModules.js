// createStoreModules.js
// Run with: node createStoreModules.js

const fs = require('fs');
const path = require('path');

const stores = [
  'amazon',
  'etsy',
  'rei',
  'dicks',
  'macys',
  'nordstrom',
  'bestbuy',
  'uncommongoods',
  'williams_sonoma',
  'crateandbarrel',
  'sephora',
  'omahasteaks'
];

const baseDir = path.join(__dirname, 'lib', 'stores');

// Create the directory if it doesn't exist
if (!fs.existsSync(baseDir)) {
  fs.mkdirSync(baseDir, { recursive: true });
}

stores.forEach(store => {
  const functionName = `search${store
    .replace(/(^\w|_\w)/g, s => s.replace('_', '').toUpperCase())}`;

  const content = `import { GiftResult } from '../types';

/**
 * Search ${store.charAt(0).toUpperCase() + store.slice(1)} API for gifts.
 * @param keywords Search keywords from GPT output.
 * @param priceBand Optional price band string.
 * @param category Optional category string.
 * @returns Promise<GiftResult[]>
 */
export async function ${functionName}(keywords: string, priceBand?: string, category?: string): Promise<GiftResult[]> {
  // TODO: Implement API call for ${store}
  // Return results in the GiftResult format
  return [];
}
`;

  fs.writeFileSync(path.join(baseDir, `${store}.ts`), content, 'utf8');
});

console.log('✅ Store modules created in /lib/stores/');
