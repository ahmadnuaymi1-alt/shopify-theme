/**
 * Shared "Contact" + contact information block appended to the bottom
 * of every policy and information page.
 *
 * Matches the vilvida.com footer format.
 * Hyperlinks in this block are underlined only (not bold).
 */

import type { StoreConfig } from "../config/store-config.js";
import { getStoreBaseUrl } from "../config/store-config.js";

/**
 * Build an HTML "Contact" section with links to FAQ / Contact Us,
 * followed by the store's contact details.
 *
 * Intended to be appended at the end of every template.
 */
export function buildContactBlock(config: StoreConfig, includeHeading: boolean = true): string {
  const base = getStoreBaseUrl(config);
  const addr = config.businessAddress;
  const fullAddress = `${addr.street}, ${addr.city}, ${addr.state}, ${addr.zip}, ${addr.country}`;
  const mapsUrl = `https://www.google.com/search?q=${fullAddress.replace(/ /g, '+')}`;

  const heading = includeHeading
    ? `<h2>Contact</h2>\n<p>If you have questions or need assistance, we're happy to help. Visit our <strong><a href="${base}/pages/faqs" title="FAQs">FAQs</a></strong> page or <strong><a href="${base}/pages/contact-us" title="Contact Us">Contact Us</a></strong> directly.</p>\n\n`
    : '';

  return `${heading}<p><strong>Contact Information</strong></p>
<p><strong>Store Name:</strong> ${config.storeName}<br>
<strong>Address:</strong> <a href="${mapsUrl}" target="_blank" rel="noopener noreferrer" title="${fullAddress}">${fullAddress}</a><br>
<strong>Email:</strong> <a href="mailto:${config.supportEmail}" title="${config.supportEmail}">${config.supportEmail}</a><br>
<strong>Number:</strong> <a href="tel:${config.supportPhone.replace(/[\s()-]/g, '')}" title="${config.supportPhone}">${config.supportPhone}</a><br>
<strong>Hours of Operation:</strong> ${config.customerServiceHours}</p>

<p>We aim to respond to all inquiries within ${config.responseTime}.</p>`;
}
