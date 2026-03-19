/**
 * revert-metafields.ts
 * Reverts the dynamic source metafield references in templates/product.json
 * back to their original hardcoded values.
 */

import { loadConfig } from './src/config/store-config.js';

const API_VERSION = '2025-01';

async function run() {
  const config = await loadConfig('Kind Clouds');
  if (!config) { console.error('No config'); process.exit(1); }

  const STORE = config.shopifyStoreUrl;

  // Get access token
  const tokenRes = await fetch(`https://${STORE}/admin/oauth/access_token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=client_credentials&client_id=${config.shopifyClientId}&client_secret=${config.shopifyClientSecret}`,
  });
  const tokenData = await tokenRes.json() as any;
  const token = tokenData.access_token;
  console.log('[OK] Got access token');

  // Get main theme
  const themesRes = await fetch(`https://${STORE}/admin/api/${API_VERSION}/themes.json`, {
    headers: { 'X-Shopify-Access-Token': token },
  });
  const themesData = await themesRes.json() as any;
  const mainTheme = themesData.themes.find((t: any) => t.role === 'main');
  const themeId = mainTheme.id;
  console.log(`[OK] Main theme: ${mainTheme.name} (ID: ${themeId})`);

  // Read current product template
  const assetRes = await fetch(
    `https://${STORE}/admin/api/${API_VERSION}/themes/${themeId}/assets.json?asset[key]=${encodeURIComponent('templates/product.json')}`,
    { headers: { 'X-Shopify-Access-Token': token } }
  );
  const assetData = await assetRes.json() as any;
  const template = JSON.parse(assetData.asset.value);
  console.log('[OK] Read templates/product.json');

  let changed = false;

  // === Revert Collapsible Content headings ===
  const collapsibleSection = template.sections['collapsible_content_bdGMNr'];
  if (collapsibleSection) {
    console.log('\n--- Reverting collapsible row headings ---');
    const blockIds = collapsibleSection.block_order;
    for (let i = 0; i < Math.min(4, blockIds.length); i++) {
      const blockId = blockIds[i];
      const block = collapsibleSection.blocks[blockId];
      if (block.settings.heading && block.settings.heading.startsWith('product.metafields.')) {
        const oldVal = block.settings.heading;
        block.settings.heading = 'Collapsible row';
        console.log(`  ${blockId}: "${oldVal}" → "Collapsible row"`);
        changed = true;
      } else {
        console.log(`  ${blockId}: already "${block.settings.heading}" (no change)`);
      }
    }
  }

  // === Revert Feature Section titles ===
  const featureSection = template.sections['ss_feature_13_g3ttAA'];
  if (featureSection) {
    console.log('\n--- Reverting feature block titles ---');
    const blockIds = featureSection.block_order;
    const originalTitles = [
      'Eye Comfort',
      'Better Sleep',
      'Enhanced Protection',
      'Anti-Glare',
      'Touch Sensivity',
      'Easy Installation',
    ];
    for (let i = 0; i < Math.min(6, blockIds.length); i++) {
      const blockId = blockIds[i];
      const block = featureSection.blocks[blockId];
      if (block.settings.title && block.settings.title.startsWith('product.metafields.')) {
        const oldVal = block.settings.title;
        block.settings.title = originalTitles[i];
        console.log(`  ${blockId}: "${oldVal}" → "${originalTitles[i]}"`);
        changed = true;
      } else {
        console.log(`  ${blockId}: already "${block.settings.title}" (no change)`);
      }
    }
  }

  if (!changed) {
    console.log('\nNo changes needed — template already has original values.');
    return;
  }

  // Write reverted template
  console.log('\n--- Writing reverted templates/product.json ---');
  const writeRes = await fetch(`https://${STORE}/admin/api/${API_VERSION}/themes/${themeId}/assets.json`, {
    method: 'PUT',
    headers: {
      'X-Shopify-Access-Token': token,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      asset: {
        key: 'templates/product.json',
        value: JSON.stringify(template, null, 2),
      },
    }),
  });
  const writeData = await writeRes.json() as any;
  if (writeData.errors) {
    console.error('ERROR:', JSON.stringify(writeData.errors));
  } else {
    console.log('[OK] templates/product.json reverted successfully');
  }

  console.log('\n=== Done! Metafield assignments have been undone ===');
}

run().catch(err => {
  console.error('FATAL:', err);
  process.exit(1);
});
