#!/usr/bin/env npx tsx
/**
 * Quick runner — generate ALL content (policies + info pages) and push to Shopify.
 */

import { loadConfig, getStoreBaseUrl } from './src/config/store-config.js';
import { createShopifyClient } from './src/shopify/client.js';
import { updateAllPolicies } from './src/shopify/policies.js';
import { createAllPages } from './src/shopify/pages.js';
import { createContactRedirects } from './src/shopify/redirects.js';
import { generateRefundPolicy } from './src/templates/refund-policy.js';
import { generateShippingPolicy } from './src/templates/shipping-policy.js';
import { generatePrivacyPolicy } from './src/templates/privacy-policy.js';
import { generateTermsOfService } from './src/templates/terms-of-service.js';
import { generateBillingTerms } from './src/templates/billing-terms.js';
import { generateFaq } from './src/templates/faq.js';
import { generateAboutUs } from './src/templates/about-us.js';
import { generateContactUs } from './src/templates/contact-us.js';
import chalk from 'chalk';

async function main() {
  const storeName = process.argv[2] || 'Kind Clouds';
  const config = await loadConfig(storeName);
  if (!config) {
    console.error(chalk.red(`Config not found for ${storeName}`));
    process.exit(1);
  }

  const client = createShopifyClient(config);

  // --- Policies ---
  console.log(chalk.bold.cyan('\n=== Pushing 4 Legal Policies ===\n'));

  await updateAllPolicies(client, {
    REFUND_POLICY: generateRefundPolicy(config),
    PRIVACY_POLICY: generatePrivacyPolicy(config),
    TERMS_OF_SERVICE: generateTermsOfService(config),
    SHIPPING_POLICY: generateShippingPolicy(config),
  });

  // --- Info Pages ---
  console.log(chalk.bold.cyan('\n=== Pushing 4 Info Pages ===\n'));

  await createAllPages(client, [
    { title: 'About Us', handle: 'about-us', bodyHtml: generateAboutUs(config) },
    { title: 'FAQs', handle: 'faqs', bodyHtml: generateFaq(config), templateSuffix: 'faqs' },
    { title: 'Contact Us', handle: 'contact-us', bodyHtml: generateContactUs(config), templateSuffix: 'contact' },
    { title: 'Billing Terms and Conditions', handle: 'billing-terms-and-conditions', bodyHtml: generateBillingTerms(config) },
  ]);

  // --- Contact Redirects ---
  console.log(chalk.bold.cyan('\n=== Setting Up Contact Redirects ===\n'));
  await createContactRedirects(client, getStoreBaseUrl(config));

  console.log(chalk.bold.green('\n All content pushed successfully!'));
}

main().catch((err) => {
  console.error(chalk.red(`\nFailed: ${err.message}`));
  process.exit(1);
});
