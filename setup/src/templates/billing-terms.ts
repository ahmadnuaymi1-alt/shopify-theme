/**
 * Billing Terms & Conditions template.
 *
 * Base template — will be rewritten by Claude AI for uniqueness per store.
 */

import type { StoreConfig } from "../config/store-config.js";
import { getStoreBaseUrl } from "../config/store-config.js";
import { buildContactBlock } from "../utils/contact-block.js";

export function generateBillingTerms(config: StoreConfig): string {
  const base = getStoreBaseUrl(config);
  const lastUpdated = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  return `
<p><em>Last updated: ${lastUpdated}</em></p>

<h2>Billing Terms &amp; Conditions</h2>
<p>This page outlines the billing terms and conditions that apply to all purchases made through ${config.storeName}, operated by ${config.businessEntityName}. By completing an order with us, you accept the billing terms laid out below.</p>

<h2>How Payments Are Processed</h2>
<p>Your payment is collected the moment your order is placed. The charge will correspond to the checkout total, which reflects the item price. Since we offer free shipping on all US orders and do not impose sales tax or VAT, the amount displayed on the product page is the exact sum you will be charged. After the payment goes through, you will receive a confirmation email with your order summary and payment breakdown.</p>

<h2>Payment Methods We Accept</h2>
<p>You can use any of the following payment methods during checkout:</p>
<ul>
${config.paymentMethods.split(', ').map(m => `  <li>${m}</li>`).join('\n')}
</ul>
<p>Any payment method you use must be valid and fully authorized at the time of purchase. If your payment cannot be processed, we will not be able to fulfill your order.</p>

<h2>Currency</h2>
<p>All prices displayed on our website are listed in ${config.currency}. If you are placing an order from outside the United States, your bank or card issuer may apply separate fees for currency conversion. These charges are beyond the control of ${config.storeName}.</p>

<h2>Taxes &amp; Total Pricing</h2>
<p>The price you see on our site is the full amount owed. We do not tack on sales tax, VAT or any other government-imposed fees to your order. There are no hidden charges. The price displayed is the price you pay.</p>
<p>Every order shipped within the United States includes free delivery. No shipping fees will be added at checkout. For complete information about how we ship, please refer to our <strong><a href="${base}/policies/shipping-policy" title="Shipping Policy">Shipping Policy</a></strong>.</p>

<h2>Billing Discrepancies</h2>
<p>If you believe you were charged incorrectly, please contact us without delay at <strong><a href="mailto:${config.supportEmail}" title="${config.supportEmail}">${config.supportEmail}</a></strong>. Provide your order number along with a description of the billing issue. We will investigate and, if an error occurred, issue a correction or refund right away.</p>
<p>We retain the right to fix any pricing or billing inaccuracies, even after payment has been completed. If a correction results in a higher total, we will reach out to you before processing the additional amount and give you the option to cancel the order. You can also consult our <strong><a href="${base}/policies/refund-policy" title="Refund and Return Policy">Refund &amp; Return Policy</a></strong> for further details on how refunds work.</p>

<h2>Subscriptions &amp; Recurring Charges</h2>
<p>Currently, ${config.storeName} does not offer subscription products and does not engage in recurring billing. Each purchase is processed as a standalone, one-time payment. If we introduce subscription services down the line, this section will be updated, and you will be notified before any automatic charges apply to your account.</p>

<h2>Chargebacks</h2>
<p>If you see an unfamiliar charge on your statement, we strongly encourage you to <strong><a href="${base}/pages/contact-us" title="Contact Us">contact us</a></strong> at <strong><a href="mailto:${config.supportEmail}" title="${config.supportEmail}">${config.supportEmail}</a></strong> before initiating a chargeback through your bank or card company. We work to resolve billing disagreements quickly and equitably.</p>
<p>Submitting an unauthorized chargeback could result in:</p>
<ul>
  <li>Suspension of your account</li>
  <li>Collection of any outstanding balances</li>
  <li>Refusal of future orders</li>
</ul>
<p>We will cooperate fully with any chargeback investigation and provide all relevant transaction records to your financial institution as needed.</p>

${buildContactBlock(config)}`;
}
