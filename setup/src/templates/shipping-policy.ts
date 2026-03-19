/**
 * Shipping Policy template.
 *
 * Base template — will be rewritten by Claude AI for uniqueness per store.
 */

import type { StoreConfig } from "../config/store-config.js";
import { getStoreBaseUrl } from "../config/store-config.js";
import { buildContactBlock } from "../utils/contact-block.js";

export function generateShippingPolicy(config: StoreConfig): string {
  const base = getStoreBaseUrl(config);
  const lastUpdated = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  return `
<p><em>Last updated: ${lastUpdated}</em></p>

<h2>Delivery &amp; Shipping Policy</h2>
<p>Thank you for shopping with ${config.storeName}! We ship every order across the ${config.shippingRegions} at no charge. Fast, dependable delivery matters to us, and this page covers all the details about how your order gets from our warehouse to your door.</p>

<h2>Delivery Coverage</h2>
<p>We ship to all addresses within the ${config.shippingRegions}. Every package originates from our warehouse locations inside the United States.</p>

<h2>Daily Cutoff for Orders</h2>
<p>Place your order before ${config.orderCutoffTime} on a standard business day and it will move into processing the same day. Orders received after that time, or on weekends and public holidays, will start processing the next available business day.</p>

<h2>Handling &amp; Processing Time</h2>
<p>Once your order is confirmed, our team requires ${config.handlingTime} to prepare, package and transfer it to the shipping carrier. This handling window is distinct from transit time. It represents the work done before your parcel departs our warehouse.</p>

<h2>Carrier Transit Time</h2>
<p>After your order has been packed and collected by the carrier, you can expect a transit time of ${config.transitTime}. This is the period the carrier takes to move your parcel from our warehouse to your specified delivery address.</p>

<h2>Overall Estimated Delivery Time</h2>
<p>Counting from the moment you finalize your purchase through to arrival at your doorstep, the total estimated delivery time is ${config.estimatedDeliveryTime}. This timeframe includes both our handling period and the carrier's transit window combined.</p>

<h2>Our Shipping Carriers</h2>
<p>We entrust your orders to established carrier partners: ${config.carriers}. Which carrier handles your particular shipment is determined by your delivery location, the size and weight of your package and current carrier capacity.</p>

<h2>Complimentary Shipping on All Orders</h2>
<p>Every order shipped within the ${config.shippingRegions} is delivered free of charge. There is no minimum spend required. Shipping costs you nothing no matter what your order total is. You will not encounter any shipping fees during checkout.</p>

<h2>Tracking Your Shipment</h2>
<p>The moment your order leaves our facility, we will email you a tracking number. You can use it to follow your package on the carrier's tracking page, or head to our <strong><a href="${base}/apps/track123" title="Track Your Order">Track Your Order</a></strong> page to view live status updates.</p>
<p>Please note that tracking information can take up to 24 hours after you receive the shipping confirmation email before it appears in the carrier's tracking system.</p>

<h2>Potential Shipping Delays</h2>
<p>While we do everything we can to hit our estimated delivery windows, occasional delays may occur because of circumstances beyond our control, including:</p>
<ul>
  <li>Severe weather conditions</li>
  <li>Natural catastrophes or emergencies</li>
  <li>Carrier operational disruptions or volume surges</li>
  <li>High-demand shipping periods (holidays, sales events)</li>
  <li>Incorrect or incomplete shipping addresses</li>
</ul>
<p>Should your order experience a significant delay, reach out to us at <strong><a href="mailto:${config.supportEmail}" title="${config.supportEmail}">${config.supportEmail}</a></strong> and we will work to resolve the situation. If a product arrives damaged or you wish to initiate a return, please refer to our <strong><a href="${base}/policies/refund-policy" title="Refund and Return Policy">Refund &amp; Return Policy</a></strong> for detailed instructions.</p>

<h2>International Orders</h2>
<p>Currently, we only ship within the ${config.shippingRegions}. International delivery is not available at this time. We are working toward broadening our shipping capabilities and hope to serve international customers soon. If you have any questions, please don't hesitate to <strong><a href="${base}/pages/contact-us" title="Contact Us">contact us</a></strong>.</p>

${buildContactBlock(config)}`;
}
