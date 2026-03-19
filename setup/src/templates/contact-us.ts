/**
 * Contact Us page template.
 *
 * Matches Vilvida's Contact Us format:
 * - Short intro paragraph
 * - Contact info block (Store Name, Address, Email, Number, Hours)
 * - Theme renders the contact form below (via templateSuffix: "contact")
 * - NO contact block at the bottom (footer handles that)
 */

import type { StoreConfig } from "../config/store-config.js";

export function generateContactUs(config: StoreConfig): string {
  const lastUpdated = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  const addr = config.businessAddress;
  const fullAddress = `${addr.street}, ${addr.city}, ${addr.state}, ${addr.zip}, ${addr.country}`;
  const mapsUrl = `https://www.google.com/search?q=${fullAddress.replace(/ /g, '+')}`;

  return `
<p><em>Last updated: ${lastUpdated}</em></p>

<p>Kindly use this form to submit any of your queries. We aim to respond to inquiries within ${config.responseTime}.</p>

<p><strong>Store Name:</strong> ${config.storeName}<br>
<strong>Address:</strong> <a href="${mapsUrl}" target="_blank" rel="noopener noreferrer" title="${fullAddress}">${fullAddress}</a><br>
<strong>Email:</strong> <a href="mailto:${config.supportEmail}" title="${config.supportEmail}">${config.supportEmail}</a><br>
<strong>Number:</strong> <a href="tel:${config.supportPhone.replace(/[\s()-]/g, '')}" title="${config.supportPhone}">${config.supportPhone}</a><br>
<strong>Hours of Operation:</strong> ${config.customerServiceHours}</p>`;
}
