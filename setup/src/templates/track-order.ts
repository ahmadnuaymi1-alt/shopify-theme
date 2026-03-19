/**
 * Track Your Order page template.
 *
 * Base template — will be rewritten by Claude AI for uniqueness per store.
 */

import type { StoreConfig } from "../config/store-config.js";
import { getStoreBaseUrl } from "../config/store-config.js";
import { buildContactBlock } from "../utils/contact-block.js";

export function generateTrackOrder(config: StoreConfig): string {
  const base = getStoreBaseUrl(config);
  const lastUpdated = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  return `
<p><em>Last updated: ${lastUpdated}</em></p>

<h2>Track Your Order</h2>
<p>There's nothing quite like anticipating a delivery! Here you'll find all the information you need to monitor your shipment from ${config.storeName}.</p>

<h2>Steps to Track Your Package</h2>
<p>Keeping tabs on your order is simple. Here's what to do:</p>
<ol>
  <li>Check your inbox: The moment your order is shipped, we'll email you a shipping notification containing your tracking number and a direct link to the carrier's tracking page.</li>
  <li>Click the tracking link: Use the link in your email to see real-time updates on your package through the carrier's website.</li>
  <li>Visit the carrier's site: Alternatively, you can go straight to the carrier's website and type in your tracking number. We ship through ${config.carriers}.</li>
</ol>

<h2>Shipping Confirmation &amp; Tracking Details</h2>
<p>After your order has been prepared and handed off to the carrier, we'll send you a confirmation email that includes:</p>
<ul>
  <li>Your order number</li>
  <li>The tracking number assigned to your shipment</li>
  <li>A direct link to follow your package on the carrier's site</li>
  <li>An estimated arrival date</li>
</ul>
<p>Please note that tracking information can take up to 24 hours to become visible in the carrier's system once your shipping notification is sent. During peak periods, this delay may be a bit longer.</p>

<h2>Standard Tracking Timeline</h2>
<p>Here's a look at the typical stages your order goes through from placement to arrival:</p>
<ol>
  <li>Order Placed: Your order is received and a confirmation email is sent to you immediately.</li>
  <li>Processing: We select, package and get your items ready for shipment (${config.handlingTime}).</li>
  <li>Shipped: Your package is transferred to the carrier, and you receive a shipping notification with your tracking details.</li>
  <li>In Transit: Your order is making its way to you (${config.transitTime}).</li>
  <li>Delivered: Your package reaches your door! The overall estimated delivery timeframe is ${config.estimatedDeliveryTime}.</li>
</ol>

<h2>Tracking Not Showing Updates?</h2>
<p>Don't worry. Tracking information doesn't always update in real time. Below are some frequent situations and what you can do:</p>
<ul>
  <li>Just shipped: Tracking data can take up to 24 hours to populate once the carrier picks up your package. Allow a little time for it to appear.</li>
  <li>In transit with no new scans: Sometimes packages pass through areas without scanning equipment. If there's been no activity for 3 to 4 business days, let us know.</li>
  <li>Held at a facility: Severe weather, public holidays or high carrier volume can cause brief delays. Check the carrier's site for any service alerts affecting your area.</li>
  <li>Marked as delivered but not found: Search around your property, check with neighbors and inspect common drop-off locations (mailroom, front porch, garage, etc.). If you still can't locate the package, contact us immediately.</li>
</ul>
<p>If your tracking hasn't moved for an extended time or something seems off, send us an email at <strong><a href="mailto:${config.supportEmail}" title="${config.supportEmail}">${config.supportEmail}</a></strong> or call us at <strong><a href="tel:${config.supportPhone.replace(/[\s()-]/g, '')}" title="${config.supportPhone}">${config.supportPhone}</a></strong>. We'll investigate and get back to you with an update.</p>

<h2>Additional Assistance</h2>
<p>For more about our shipping process, estimated timelines and carrier partners, visit our <strong><a href="${base}/policies/shipping-policy" title="Shipping Policy">Shipping Policy</a></strong>. If your order is eligible for a return, our <strong><a href="${base}/policies/refund-policy" title="Refund and Return Policy">Refund &amp; Return Policy</a></strong> covers everything you need to know. For anything else, our <strong><a href="${base}/pages/contact-us" title="Contact Us">Contact Us</a></strong> page is the fastest way to reach our team.</p>

${buildContactBlock(config)}`;
}
