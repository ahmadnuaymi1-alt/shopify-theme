#!/usr/bin/env npx tsx
/**
 * Quick runner — generate policy HTML and push to Shopify.
 */

import { loadConfig } from './src/config/store-config.js';
import { createShopifyClient } from './src/shopify/client.js';
import { updateAllPolicies } from './src/shopify/policies.js';
import { generateRefundPolicy } from './src/templates/refund-policy.js';
import { generateShippingPolicy } from './src/templates/shipping-policy.js';
import { generatePrivacyPolicy } from './src/templates/privacy-policy.js';
import { generateTermsOfService } from './src/templates/terms-of-service.js';
import chalk from 'chalk';

async function main() {
  const config = await loadConfig('Royal Reform');
  if (!config) {
    console.error(chalk.red('Config not found for Royal Reform'));
    process.exit(1);
  }

  console.log(chalk.bold.cyan('\nGenerating policies for Royal Reform...\n'));

  const refund = generateRefundPolicy(config);
  const shipping = generateShippingPolicy(config);
  const privacy = generatePrivacyPolicy(config);
  const tos = generateTermsOfService(config);

  console.log(chalk.green('Templates generated. Pushing to Shopify...\n'));

  const client = createShopifyClient(config);

  await updateAllPolicies(client, {
    REFUND_POLICY: refund,
    PRIVACY_POLICY: privacy,
    TERMS_OF_SERVICE: tos,
    SHIPPING_POLICY: shipping,
  });

  console.log(chalk.bold.green('\nAll 4 policies updated successfully!'));
}

main().catch((err) => {
  console.error(chalk.red(`\nFailed: ${err.message}`));
  process.exit(1);
});
