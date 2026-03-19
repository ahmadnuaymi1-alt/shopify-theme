import { loadConfig } from './src/config/store-config.js';
import { createShopifyClient } from './src/shopify/client.js';
import { createAllPages } from './src/shopify/pages.js';
import { generateAboutUs } from './src/templates/about-us.js';

const config = await loadConfig('Nosura');
if (!config) { console.error('no config'); process.exit(1); }
const client = createShopifyClient(config);
await createAllPages(client, [
  { title: 'About Us', handle: 'about-us', bodyHtml: generateAboutUs(config) },
]);
console.log('Done - About Us re-pushed');
