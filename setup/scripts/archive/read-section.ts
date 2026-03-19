import { loadConfig } from './src/config/store-config.js';

const API_VERSION = '2025-01';

async function run() {
  const config = await loadConfig('Kind Clouds');
  if (!config) { console.error('No config'); process.exit(1); }

  const STORE = config.shopifyStoreUrl;
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
  const themeId = mainTheme.id;
  console.log(`Theme: ${mainTheme.name} (ID: ${themeId})`);

  // Read the image-with-text section
  const key = process.argv[2] || 'sections/image-with-text.liquid';
  console.log(`\nReading: ${key}\n`);

  const assetRes = await fetch(
    `https://${STORE}/admin/api/${API_VERSION}/themes/${themeId}/assets.json?asset[key]=${encodeURIComponent(key)}`,
    { headers: { 'X-Shopify-Access-Token': token } }
  );
  const assetData = await assetRes.json() as any;
  if (assetData.errors) {
    console.error('Error:', assetData.errors);
  } else {
    console.log(assetData.asset.value);
  }
}

run();
