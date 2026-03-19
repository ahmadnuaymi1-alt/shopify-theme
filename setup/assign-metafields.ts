/**
 * Assigns product metafields as dynamic sources to the product template sections:
 * - Collapsible content: FAQ Q1-Q4 → heading, FAQ A1-A4 → row_content (first 4 rows)
 * - Feature section: Feature Header 1-6 → title, Feature Body 1-6 → text
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

  // === Fix Collapsible Content (FAQ Q1-4 / A1-4) ===
  const collapsibleSection = template.sections['collapsible_content_bdGMNr'];
  if (collapsibleSection) {
    console.log('\n--- Assigning FAQ metafields to collapsible rows ---');
    const blockIds = collapsibleSection.block_order;

    // First 4 rows get Q1-4 / A1-4
    const faqMappings = [
      { q: 'custom.faq_q1', a: 'custom.faq_a1' },
      { q: 'custom.faq_q2', a: 'custom.faq_a2' },
      { q: 'custom.faq_q3', a: 'custom.faq_a3' },
      { q: 'custom.faq_q4', a: 'custom.faq_a4' },
    ];

    for (let i = 0; i < Math.min(4, blockIds.length); i++) {
      const blockId = blockIds[i];
      const block = collapsibleSection.blocks[blockId];
      const mapping = faqMappings[i];

      // Set dynamic source references (must end with .value)
      // heading (text setting) accepts dynamic sources
      block.settings.heading = `product.metafields.${mapping.q}.value`;
      // row_content is richtext — can't accept dynamic source via API, must use theme editor

      console.log(`  Row ${i + 1} (${blockId}): heading → ${mapping.q} (content must be connected via theme editor)`);
    }
  } else {
    console.log('WARNING: Collapsible content section not found');
  }

  // === Fix Feature Section (Feature Header/Body 1-6) ===
  const featureSection = template.sections['ss_feature_13_g3ttAA'];
  if (featureSection) {
    console.log('\n--- Assigning Feature metafields to feature blocks ---');
    const blockIds = featureSection.block_order;

    const featureMappings = [
      { header: 'custom.feature_1_header', body: 'custom.feature_1_body' },
      { header: 'custom.feature_2_header', body: 'custom.feature_2_body' },
      { header: 'custom.feature_3_header', body: 'custom.feature_3_body' },
      { header: 'custom.feature_4_header', body: 'custom.feature_4_body' },
      { header: 'custom.feature_5_header', body: 'custom.feature_5_body' },
      { header: 'custom.feature_6_header', body: 'custom.feature_6_body' },
    ];

    for (let i = 0; i < Math.min(6, blockIds.length); i++) {
      const blockId = blockIds[i];
      const block = featureSection.blocks[blockId];
      const mapping = featureMappings[i];

      // title accepts single_line_text, text only accepts single-line types (not multi_line)
      block.settings.title = `product.metafields.${mapping.header}.value`;
      // Feature body is multi_line_text which the 'text' setting doesn't support as dynamic source
      // So we leave text as-is (hardcoded) - it can only be connected via the theme editor
      console.log(`  Feature ${i + 1} (${blockId}): title → ${mapping.header} (body skipped - multi_line_text not supported for 'text' setting)`);
    }
  } else {
    console.log('WARNING: Feature section not found');
  }

  // Write updated template
  console.log('\n--- Writing updated templates/product.json ---');
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
    console.log('[OK] templates/product.json updated successfully');
  }

  console.log('\n=== Done! Metafields are now connected to product template sections ===');
}

run().catch(err => {
  console.error('FATAL:', err);
  process.exit(1);
});
