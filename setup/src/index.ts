#!/usr/bin/env node

import inquirer from 'inquirer';
import chalk from 'chalk';
import ora from 'ora';
import { StoreConfig, saveConfig, loadConfig, listConfigs } from './config/store-config.js';
import { defaults as DEFAULTS } from './config/defaults.js';
import { createShopifyClient } from './shopify/client.js';
import { createAllPages } from './shopify/pages.js';
import { updateAllPolicies } from './shopify/policies.js';
import { createFooterMenus } from './shopify/menus.js';
import { createDefaultRedirects } from './shopify/redirects.js';
import { rewriteContent } from './ai/rewriter.js';
import { generateAboutUs } from './ai/about-us-gen.js';
import { buildContactBlock } from './utils/contact-block.js';
import { generateRefundPolicy } from './templates/refund-policy.js';
import { generateShippingPolicy } from './templates/shipping-policy.js';
import { generatePrivacyPolicy } from './templates/privacy-policy.js';
import { generateTermsOfService } from './templates/terms-of-service.js';
import { generateBillingTerms } from './templates/billing-terms.js';
import { generateFaq } from './templates/faq.js';
import { generateContactUs } from './templates/contact-us.js';
import { generateTrackOrder } from './templates/track-order.js';
import { configureCheckout } from './playwright/checkout.js';

async function main() {
  console.log(chalk.bold.cyan('\n╔══════════════════════════════════════════╗'));
  console.log(chalk.bold.cyan('║   Shopify Store Setup CLI for GMC        ║'));
  console.log(chalk.bold.cyan('╚══════════════════════════════════════════╝\n'));

  const existingConfigs = await listConfigs();

  let config: StoreConfig;

  if (existingConfigs.length > 0) {
    const { action } = await inquirer.prompt([{
      type: 'list',
      name: 'action',
      message: 'What would you like to do?',
      choices: [
        { name: 'Set up a new store', value: 'new' },
        { name: 'Run setup on an existing store config', value: 'existing' },
        { name: 'Edit an existing store config', value: 'edit' },
      ],
    }]);

    if (action === 'existing' || action === 'edit') {
      const { selectedStore } = await inquirer.prompt([{
        type: 'list',
        name: 'selectedStore',
        message: 'Select a store:',
        choices: existingConfigs.map(c => ({ name: c.storeName, value: c.storeName })),
      }]);
      const loaded = await loadConfig(selectedStore);
      if (!loaded) {
        console.log(chalk.red(`Config for "${selectedStore}" not found.`));
        process.exit(1);
      }
      config = loaded;
      if (action === 'edit') {
        config = await collectStoreConfig(config);
        await saveConfig(config);
        console.log(chalk.green('\nConfig updated successfully.'));
      }
    } else {
      config = await collectStoreConfig();
      await saveConfig(config);
    }
  } else {
    console.log(chalk.yellow('No saved store configs found. Let\'s set up a new store.\n'));
    config = await collectStoreConfig();
    await saveConfig(config);
  }

  // Select which steps to run
  const { steps } = await inquirer.prompt([{
    type: 'checkbox',
    name: 'steps',
    message: 'Which steps do you want to run?',
    choices: [
      { name: 'Generate unique content (Claude AI)', value: 'ai', checked: true },
      { name: 'Create/update pages (Shopify API)', value: 'pages', checked: true },
      { name: 'Set legal policies (Shopify API)', value: 'policies', checked: true },
      { name: 'Create footer menus (Shopify API)', value: 'menus', checked: true },
      { name: 'Create URL redirects (Shopify API)', value: 'redirects', checked: true },
      { name: 'Configure checkout appearance (Playwright)', value: 'checkout', checked: false },
    ],
  }]);

  const client = createShopifyClient(config);

  // Step 1: Generate content
  let content = generateBaseContent(config);

  if (steps.includes('ai')) {
    content = await generateAIContent(config, content);
  }

  // Step 2: Create/update pages
  if (steps.includes('pages')) {
    await runCreatePages(client, content);
  }

  // Step 3: Set legal policies
  if (steps.includes('policies')) {
    await runSetPolicies(client, content);
  }

  // Step 4: Create footer menus
  if (steps.includes('menus')) {
    await runCreateMenus(client, config);
  }

  // Step 5: Create URL redirects
  if (steps.includes('redirects')) {
    await runCreateRedirects(client);
  }

  // Step 6: Checkout appearance
  if (steps.includes('checkout')) {
    await runCheckoutConfig(config);
  }

  console.log(chalk.bold.green('\n✅ Store setup complete!\n'));
  printVerificationChecklist(config);
}

// --- Content Generation ---

interface GeneratedContent {
  aboutUs: string;
  faq: string;
  contactUs: string;
  trackOrder: string;
  billingTerms: string;
  refundPolicy: string;
  shippingPolicy: string;
  privacyPolicy: string;
  termsOfService: string;
}

function generateBaseContent(config: StoreConfig): GeneratedContent {
  return {
    aboutUs: '', // Will be generated by AI or left for AI step
    faq: generateFaq(config),
    contactUs: generateContactUs(config),
    trackOrder: generateTrackOrder(config),
    billingTerms: generateBillingTerms(config),
    refundPolicy: generateRefundPolicy(config),
    shippingPolicy: generateShippingPolicy(config),
    privacyPolicy: generatePrivacyPolicy(config),
    termsOfService: generateTermsOfService(config),
  };
}

async function generateAIContent(config: StoreConfig, content: GeneratedContent): Promise<GeneratedContent> {
  console.log(chalk.bold.blue('\n📝 Step 1: Generating unique content with Claude AI...\n'));

  if (!process.env.ANTHROPIC_API_KEY) {
    console.log(chalk.yellow('⚠️  ANTHROPIC_API_KEY not set. Skipping AI rewriting, using base templates.'));
    content.aboutUs = content.aboutUs || generateBaseAboutUs(config);
    return content;
  }

  // Generate About Us from scratch
  const aboutSpinner = ora('Generating About Us page...').start();
  try {
    content.aboutUs = await generateAboutUs(config);
    aboutSpinner.succeed('About Us page generated');
  } catch (err) {
    aboutSpinner.fail('Failed to generate About Us');
    console.log(chalk.red(`  ${err}`));
    content.aboutUs = generateBaseAboutUs(config);
  }

  // Rewrite each template for uniqueness
  const pagesToRewrite: Array<{ key: keyof GeneratedContent; label: string }> = [
    { key: 'refundPolicy', label: 'Refund Policy' },
    { key: 'shippingPolicy', label: 'Shipping Policy' },
    { key: 'privacyPolicy', label: 'Privacy Policy' },
    { key: 'termsOfService', label: 'Terms of Service' },
    { key: 'billingTerms', label: 'Billing Terms' },
    { key: 'faq', label: 'FAQ' },
  ];

  for (const page of pagesToRewrite) {
    const spinner = ora(`Rewriting ${page.label}...`).start();
    try {
      content[page.key] = await rewriteContent(content[page.key], page.label, config);
      spinner.succeed(`${page.label} rewritten`);
    } catch (err) {
      spinner.fail(`Failed to rewrite ${page.label}, using base template`);
      console.log(chalk.red(`  ${err}`));
    }
  }

  return content;
}

function generateBaseAboutUs(config: StoreConfig): string {
  const contactBlock = buildContactBlock(config);
  return `
<h2>Welcome to ${config.storeName}</h2>
<p>${config.storeName} is a ${config.brandNiche} store operated by ${config.businessEntityName}. We are dedicated to bringing you carefully curated products that enhance your everyday life.</p>
<h2>Our Mission</h2>
<p>We believe that everyone deserves access to quality ${config.brandNiche} products without breaking the bank. Our team works hard to source the best items and deliver them to your doorstep with care.</p>
<h2>Why Shop With Us</h2>
<p>When you shop with ${config.storeName}, you get more than just products. You get a team that stands behind every order with dedicated customer support and hassle-free returns.</p>
${contactBlock}
`.trim();
}

// --- Shopify API Steps ---

async function runCreatePages(client: ReturnType<typeof createShopifyClient>, content: GeneratedContent) {
  console.log(chalk.bold.blue('\n📄 Step 2: Creating/updating pages...\n'));

  const pages = [
    { title: 'About Us', handle: 'about-us', bodyHtml: content.aboutUs },
    { title: 'FAQ', handle: 'faq', bodyHtml: content.faq },
    { title: 'Contact Us', handle: 'contact-us', bodyHtml: content.contactUs },
    { title: 'Track Your Order', handle: 'track-your-order', bodyHtml: content.trackOrder },
    { title: 'Billing Terms and Conditions', handle: 'billing-terms-and-conditions', bodyHtml: content.billingTerms },
  ];

  await createAllPages(client, pages);
}

async function runSetPolicies(client: ReturnType<typeof createShopifyClient>, content: GeneratedContent) {
  console.log(chalk.bold.blue('\n📜 Step 3: Setting legal policies...\n'));

  await updateAllPolicies(client, {
    REFUND_POLICY: content.refundPolicy,
    PRIVACY_POLICY: content.privacyPolicy,
    TERMS_OF_SERVICE: content.termsOfService,
    SHIPPING_POLICY: content.shippingPolicy,
  });
}

async function runCreateMenus(client: ReturnType<typeof createShopifyClient>, config: StoreConfig) {
  console.log(chalk.bold.blue('\n🔗 Step 4: Creating footer menus...\n'));
  await createFooterMenus(client, config);
}

async function runCreateRedirects(client: ReturnType<typeof createShopifyClient>) {
  console.log(chalk.bold.blue('\n↪️  Step 5: Creating URL redirects...\n'));
  await createDefaultRedirects(client);
}

async function runCheckoutConfig(config: StoreConfig) {
  console.log(chalk.bold.blue('\n🎨 Step 6: Configuring checkout appearance...\n'));

  if (!config.shopifyAdminEmail || !config.shopifyAdminPassword) {
    console.log(chalk.yellow('⚠️  Shopify admin credentials not provided. Skipping checkout configuration.'));
    return;
  }

  try {
    await configureCheckout(config);
    console.log(chalk.green('Checkout appearance configured successfully.'));
  } catch (err) {
    console.log(chalk.red(`Failed to configure checkout: ${err}`));
  }
}

// --- Verification Checklist ---

function printVerificationChecklist(config: StoreConfig) {
  console.log(chalk.bold.white('📋 Verification Checklist:\n'));
  console.log(chalk.white(`  1. Visit pages and verify content renders correctly:`));
  console.log(chalk.gray(`     - https://${config.shopifyStoreUrl}/pages/about-us`));
  console.log(chalk.gray(`     - https://${config.shopifyStoreUrl}/pages/faqs`));
  console.log(chalk.gray(`     - https://${config.shopifyStoreUrl}/pages/contact-us`));
  console.log(chalk.gray(`     - https://${config.shopifyStoreUrl}/apps/track123`));
  console.log(chalk.gray(`     - https://${config.shopifyStoreUrl}/pages/billing-terms-and-conditions`));
  console.log(chalk.white(`  2. Check all hyperlinks (mailto, tel, internal pages)`));
  console.log(chalk.white(`  3. Verify footer menus appear with correct links`));
  console.log(chalk.white(`  4. Test URL redirects:`));
  console.log(chalk.gray(`     - https://${config.shopifyStoreUrl}/collections/vendors → /`));
  console.log(chalk.gray(`     - https://${config.shopifyStoreUrl}/collections/types → /`));
  console.log(chalk.gray(`     - https://${config.shopifyStoreUrl}/collections/all → /collections`));
  console.log(chalk.white(`  5. Run GMC Scout scan — target 100% compliance`));
  console.log(chalk.white(`  6. Check About Us on undetectable.ai — target 90%+ human score`));
  console.log(chalk.white(`  7. Verify checkout button color (if Playwright step ran)`));
  console.log();
}

// --- Config Collection ---

async function collectStoreConfig(existing?: StoreConfig): Promise<StoreConfig> {
  const d = existing || {} as Partial<StoreConfig>;

  console.log(chalk.bold.white('Store Configuration\n'));
  console.log(chalk.gray('Only store-specific fields are prompted. Shipping, returns, billing,'));
  console.log(chalk.gray('customer service, and legal defaults are applied automatically.\n'));

  // Section 1: Shopify Connection
  console.log(chalk.bold.cyan('─── Shopify Connection ───\n'));
  console.log(chalk.gray('Create a custom app in the Shopify Dev Dashboard (dev.shopify.com),'));
  console.log(chalk.gray('configure Admin API scopes, install it, then copy the Client ID & Secret.\n'));
  const connection = await inquirer.prompt([
    {
      type: 'input',
      name: 'shopifyStoreUrl',
      message: 'Store URL (e.g., mystore.myshopify.com):',
      default: d.shopifyStoreUrl,
      validate: (v: string) => v.includes('.myshopify.com') || 'Must be a .myshopify.com URL',
    },
    {
      type: 'input',
      name: 'shopifyClientId',
      message: 'Client ID:',
      default: d.shopifyClientId,
      validate: (v: string) => v.length > 0 || 'Required',
    },
    {
      type: 'password',
      name: 'shopifyClientSecret',
      message: 'Client Secret:',
      default: d.shopifyClientSecret,
      validate: (v: string) => v.length > 0 || 'Required',
    },
  ]);

  // Section 2: Brand & Contact
  console.log(chalk.bold.cyan('\n─── Brand & Contact ───\n'));
  const brand = await inquirer.prompt([
    {
      type: 'input',
      name: 'storeName',
      message: 'Public store name (e.g., "Vilvida"):',
      default: d.storeName,
      validate: (v: string) => v.length > 0 || 'Required',
    },
    {
      type: 'input',
      name: 'businessEntityName',
      message: 'Business entity name (e.g., "AWRR Stores LLC"):',
      default: d.businessEntityName,
      validate: (v: string) => v.length > 0 || 'Required',
    },
    {
      type: 'input',
      name: 'brandNiche',
      message: 'Brand niche (e.g., "home decor", "kids products"):',
      default: d.brandNiche,
      validate: (v: string) => v.length > 0 || 'Required',
    },
    {
      type: 'input',
      name: 'supportEmail',
      message: 'Support email:',
      default: d.supportEmail,
      validate: (v: string) => v.includes('@') || 'Must be a valid email',
    },
    {
      type: 'input',
      name: 'supportPhone',
      message: 'Support phone (e.g., +1-555-123-4567):',
      default: d.supportPhone,
      validate: (v: string) => v.length > 0 || 'Required',
    },
  ]);

  // Section 3: Business Address
  console.log(chalk.bold.cyan('\n─── Business Address (must match GMC exactly) ───\n'));
  const address = await inquirer.prompt([
    {
      type: 'input',
      name: 'street',
      message: 'Street:',
      default: d.businessAddress?.street,
      validate: (v: string) => v.length > 0 || 'Required',
    },
    {
      type: 'input',
      name: 'city',
      message: 'City:',
      default: d.businessAddress?.city,
      validate: (v: string) => v.length > 0 || 'Required',
    },
    {
      type: 'input',
      name: 'state',
      message: 'State:',
      default: d.businessAddress?.state,
      validate: (v: string) => v.length > 0 || 'Required',
    },
    {
      type: 'input',
      name: 'zip',
      message: 'ZIP code:',
      default: d.businessAddress?.zip,
      validate: (v: string) => v.length > 0 || 'Required',
    },
    {
      type: 'input',
      name: 'country',
      message: 'Country:',
      default: d.businessAddress?.country || DEFAULTS.businessAddress.country,
    },
    {
      type: 'input',
      name: 'governingLawState',
      message: 'Governing law state (e.g., "Wyoming"):',
      default: d.governingLawState,
      validate: (v: string) => v.length > 0 || 'Required',
    },
  ]);

  // Section 4: Playwright (optional)
  console.log(chalk.bold.cyan('\n─── Shopify Admin Login (optional, for checkout config) ───\n'));
  const admin = await inquirer.prompt([
    {
      type: 'input',
      name: 'shopifyAdminEmail',
      message: 'Shopify admin email (optional):',
      default: d.shopifyAdminEmail || '',
    },
    {
      type: 'password',
      name: 'shopifyAdminPassword',
      message: 'Shopify admin password (optional):',
      default: d.shopifyAdminPassword || '',
    },
    {
      type: 'input',
      name: 'checkoutButtonColor',
      message: 'Checkout button color (hex):',
      default: d.checkoutButtonColor || DEFAULTS.checkoutButtonColor,
    },
    {
      type: 'input',
      name: 'checkoutLogoPath',
      message: 'Checkout logo file path (optional):',
      default: d.checkoutLogoPath || '',
    },
  ]);

  // Merge store-specific answers with standard defaults
  const config: StoreConfig = {
    ...DEFAULTS,
    shopifyStoreUrl: connection.shopifyStoreUrl,
    shopifyClientId: connection.shopifyClientId,
    shopifyClientSecret: connection.shopifyClientSecret,
    storeName: brand.storeName,
    businessEntityName: brand.businessEntityName,
    brandNiche: brand.brandNiche,
    supportEmail: brand.supportEmail,
    supportPhone: brand.supportPhone,
    businessAddress: {
      street: address.street,
      city: address.city,
      state: address.state,
      zip: address.zip,
      country: address.country,
    },
    governingLawState: address.governingLawState,
    shopifyAdminEmail: admin.shopifyAdminEmail || undefined,
    shopifyAdminPassword: admin.shopifyAdminPassword || undefined,
    checkoutButtonColor: admin.checkoutButtonColor,
    checkoutLogoPath: admin.checkoutLogoPath || undefined,
  };

  return config;
}

main().catch((err) => {
  console.error(chalk.red(`\nFatal error: ${err.message}`));
  process.exit(1);
});
