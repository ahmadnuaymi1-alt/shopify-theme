/**
 * Refund & Return Policy template.
 *
 * Base template — will be rewritten by Claude AI for uniqueness per store.
 */

import type { StoreConfig } from "../config/store-config.js";
import { getStoreBaseUrl } from "../config/store-config.js";
import { buildContactBlock } from "../utils/contact-block.js";

export function generateRefundPolicy(config: StoreConfig): string {
  const base = getStoreBaseUrl(config);
  const lastUpdated = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  return `
<p><em>Last updated: ${lastUpdated}</em></p>

<h2>Returns &amp; Refunds Policy</h2>
<p>At ${config.storeName}, we take your happiness with every order seriously. Should a purchase fall short of what you expected, we work to make things right. Below you will find a complete overview of how our returns and refunds work, giving you peace of mind when you shop.</p>

<h2>Time Frame for Returns</h2>
<p>You may request a return within ${config.returnWindow} after your order has been delivered. Please note that this period is measured from the date of delivery, not from the date the order was placed.</p>

<h2>Conditions for Return Eligibility</h2>
<p>To qualify for a return, every item must satisfy the following conditions:</p>
<ul>
  <li>The item must be unused, unlaundered and in the same condition as when it was received.</li>
  <li>It must be sent back in its original packaging.</li>
  <li>All original tags need to remain attached to the product.</li>
  <li>You must include a receipt or equivalent proof of purchase.</li>
</ul>

<h2>Who Covers Return Shipping</h2>
<p>Responsibility for return shipping depends on the circumstances behind the return:</p>
<h3>Defective or Wrong Items</h3>
<p>Should your order arrive with damage, a defect or the wrong product, you will not bear any return shipping costs. We will provide a prepaid return label or arrange a pickup at our expense.</p>
<h3>Buyer's Decision</h3>
<p>When you return an item because you chose the wrong variant, it was not what you expected or you had a change of heart, the cost of return shipping falls on you. In that case, your refund will only cover the price of the item itself.</p>

<h2>Non-Returnable Products</h2>
<p>Some products cannot be returned for hygiene or safety reasons. These will be clearly marked as final sale on their individual product pages.</p>

<h2>How to Begin a Return</h2>
<p>To initiate a return, please complete the following steps:</p>
<ol>
  <li>Email <strong><a href="mailto:${config.supportEmail}" title="${config.supportEmail}">${config.supportEmail}</a></strong> with your order number and an explanation of why you wish to return the item.</li>
  <li>A member of our support team will respond within ${config.responseTime}, providing you with step-by-step return instructions and a shipping address for the return.</li>
  <li>Pack the item securely using its original packaging and send it to the address specified in our reply.</li>
  <li>Once we have received and reviewed the returned item, we will inform you whether your refund request has been approved or denied.</li>
</ol>
<p>Always return items to the address given by our team. Do not ship them to the manufacturer or any other location.</p>

<h2>How Refunds Are Processed</h2>
<p>After your returned item arrives and passes our review, we will send you a confirmation email. When the return is approved, your refund will be credited within ${config.refundProcessingTime} to the same payment method you used during checkout.</p>
<p>This ${config.refundProcessingTime.replace(/s$/, '').replace(/\s+/g, '-')} window represents ${config.storeName}'s internal processing time only. Once we have issued the refund, your bank or card provider may require additional days to reflect the credit in your account. If you have questions about shipping timelines, please check our <strong><a href="${base}/policies/shipping-policy" title="Shipping Policy">Shipping Policy</a></strong>.</p>

<h2>Restocking Fees</h2>
<p>No restocking fee is applied to any returned product. We want the return process to be simple and hassle-free for every customer.</p>

<h2>Product Exchanges</h2>
<p>Should you need to exchange an item for a different size, color or alternative product, get in touch with us at <strong><a href="mailto:${config.supportEmail}" title="${config.supportEmail}">${config.supportEmail}</a></strong>. We will guide you through the exchange procedure. For the quickest resolution, we suggest sending back the original item following the return steps above and placing a new order for the replacement.</p>

<h2>Damaged or Defective Goods</h2>
<p>If your delivery arrives with visible damage or a manufacturing defect, please <strong><a href="${base}/pages/contact-us" title="Contact Us">contact us</a></strong> immediately at <strong><a href="mailto:${config.supportEmail}" title="${config.supportEmail}">${config.supportEmail}</a></strong> and provide:</p>
<ul>
  <li>The order number associated with your purchase</li>
  <li>A short explanation of the issue</li>
  <li>Photographs that clearly show the damage or defect</li>
</ul>
<p>We will arrange a replacement or provide a complete refund at no additional charge. As described in the Who Covers Return Shipping section above, you will never need to pay return postage for items that arrived damaged or defective.</p>

<h2>Delayed or Missing Refunds</h2>
<p>If you have not received your refund within the anticipated time frame, we recommend these steps:</p>
<ol>
  <li>Double-check your bank or credit card statement. It can sometimes take several business days for refunds to appear.</li>
  <li>Contact your bank or card issuer directly, as their processing times may vary.</li>
  <li>If you have taken both steps and the refund still has not arrived, please email <strong><a href="mailto:${config.supportEmail}" title="${config.supportEmail}">${config.supportEmail}</a></strong> so we can look into it for you.</li>
</ol>

${buildContactBlock(config)}`;
}
