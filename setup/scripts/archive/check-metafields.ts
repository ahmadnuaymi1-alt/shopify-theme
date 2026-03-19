import { loadConfig } from './src/config/store-config.js';
import { createShopifyClient } from './src/shopify/client.js';

async function run() {
  const config = await loadConfig('Kind Clouds');
  if (!config) { console.error('No config'); process.exit(1); }
  const client = createShopifyClient(config);

  // Get metafield definitions for products
  const defs = await client.query<any>(`{
    metafieldDefinitions(first: 50, ownerType: PRODUCT) {
      edges { node { name namespace key type { name } } }
    }
  }`);

  console.log('=== Product Metafield Definitions ===');
  for (const edge of defs.metafieldDefinitions.edges) {
    const d = edge.node;
    console.log(`  ${d.namespace}.${d.key} (${d.type.name}) - "${d.name}"`);
  }

  // Also get the main theme ID and read product template
  const STORE = config.shopifyStoreUrl;
  const API_VERSION = '2025-01';

  // Get access token
  const tokenRes = await fetch(`https://${STORE}/admin/oauth/access_token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=client_credentials&client_id=${config.shopifyClientId}&client_secret=${config.shopifyClientSecret}`,
  });
  const tokenData = await tokenRes.json() as any;
  const token = tokenData.access_token;

  // Get main theme
  const themesRes = await fetch(`https://${STORE}/admin/api/${API_VERSION}/themes.json`, {
    headers: { 'X-Shopify-Access-Token': token },
  });
  const themesData = await themesRes.json() as any;
  const mainTheme = themesData.themes.find((t: any) => t.role === 'main');
  console.log(`\nMain theme: ${mainTheme.name} (ID: ${mainTheme.id})`);

  // Read product template
  const templates = [
    'templates/product.json',
    'templates/product.default.json',
  ];

  for (const tpl of templates) {
    try {
      const assetRes = await fetch(
        `https://${STORE}/admin/api/${API_VERSION}/themes/${mainTheme.id}/assets.json?asset[key]=${encodeURIComponent(tpl)}`,
        { headers: { 'X-Shopify-Access-Token': token } }
      );
      const assetData = await assetRes.json() as any;
      if (assetData.asset) {
        console.log(`\n=== ${tpl} ===`);
        const parsed = JSON.parse(assetData.asset.value);
        const sections = parsed.sections || {};
        for (const [key, val] of Object.entries(sections)) {
          const s = val as any;
          console.log(`  Section "${key}": type="${s.type}"`);
          if (s.blocks) {
            for (const [bk, bv] of Object.entries(s.blocks)) {
              const b = bv as any;
              console.log(`    Block "${bk}": type="${b.type}"`);
              if (b.settings) {
                for (const [sk, sv] of Object.entries(b.settings)) {
                  const preview = typeof sv === 'string' && sv.length > 60 ? sv.substring(0, 60) + '...' : sv;
                  console.log(`      ${sk}: ${preview}`);
                }
              }
            }
          }
        }
      }
    } catch {
      // skip
    }
  }
}

run();
