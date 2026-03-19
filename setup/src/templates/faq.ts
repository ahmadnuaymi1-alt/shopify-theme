/**
 * FAQ (Frequently Asked Questions) template.
 *
 * Base template — will be rewritten by Claude AI for uniqueness per store.
 */

import type { StoreConfig } from "../config/store-config.js";
import { getStoreBaseUrl } from "../config/store-config.js";
import { buildContactBlock } from "../utils/contact-block.js";

export function generateFaq(config: StoreConfig): string {
  const base = getStoreBaseUrl(config);
  const lastUpdated = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  return `
<p><em>Last updated: ${lastUpdated}</em></p>

<h2>Frequently Asked Questions</h2>
<p>Here are the answers to the most common inquiries we receive from shoppers. If your question isn't covered below, don't hesitate to <strong><a href="${base}/pages/contact-us" title="Contact Us">get in touch with us</a></strong>. Our team is ready to help!</p>

<h3>How can I order from your store?</h3>
<p>Shopping with us is straightforward. Look through our product selection, choose the items you'd like, pick the right size or option (if applicable) and click "Add to Cart." When you've finished shopping, go to your cart and proceed to checkout. Fill in your delivery address and payment information, then submit your order. You'll receive an order confirmation email once the transaction goes through.</p>

<h3>Which payment options are available?</h3>
<p>Our accepted payment methods include: ${config.paymentMethods}. All transactions are processed via a secure payment gateway, and your payment information is never stored on our systems.</p>

<h3>What is the expected delivery time?</h3>
<p>The total estimated delivery window is ${config.estimatedDeliveryTime}, which breaks down into two stages:</p>
<ul>
  <li>Processing time: ${config.handlingTime}. This includes verifying, packaging and handing off your order for shipment.</li>
  <li>Transit time: ${config.transitTime}. This is the duration the shipping carrier requires to bring your package to you after collection.</li>
</ul>
<p>Orders placed before ${config.orderCutoffTime} on working days begin processing on the same day. For full shipping details, refer to our <strong><a href="${base}/policies/shipping-policy" title="Shipping Policy">Shipping Policy</a></strong>.</p>

<h3>Is shipping free on all orders?</h3>
<p>Yes! Every order shipped within the ${config.shippingRegions} qualifies for free shipping. There is no minimum spend requirement. To learn more about our delivery options and timeframes, take a look at our <strong><a href="${base}/policies/shipping-policy" title="Shipping Policy">Shipping Policy</a></strong>.</p>

<h3>Am I able to cancel an order once it has been submitted?</h3>
<p>Cancellations are accepted within 24 hours of placing your order. To request a cancellation, contact our team at <strong><a href="mailto:${config.supportEmail}" title="${config.supportEmail}">${config.supportEmail}</a></strong> as soon as you can. After the 24-hour cancellation period has passed, your order enters the fulfillment pipeline and cannot be reversed.</p>

<h3>How do I check the status of my shipment?</h3>
<p>Once your order has been dispatched, we'll email you a tracking number. You can enter that number on the carrier's tracking page or use our <strong><a href="${base}/apps/track123" title="Track Your Order">Track Your Order</a></strong> page to monitor delivery progress. Please note that tracking information can take up to 24 hours after the dispatch notification to update.</p>

<h3>What are your return terms?</h3>
<p>We offer a ${config.returnWindow.replace(/s$/, '').replace(/\s+/g, '-')} return window that begins on the date of delivery. Returned products must be in their original, unworn condition with packaging intact and all tags still in place. Some items are excluded from returns and will be noted as such on their respective product pages. You can read the full terms on our <strong><a href="${base}/policies/refund-policy" title="Refund and Return Policy">Refund &amp; Return Policy</a></strong> page.</p>

<h3>What should I do if I'm dissatisfied with my order?</h3>
<p>If your purchase doesn't meet your expectations, you may send it back within ${config.returnWindow} from the date of delivery. Simply <strong><a href="${base}/pages/contact-us" title="Contact Us">contact us</a></strong> and we'll guide you through the return steps. All the specifics are outlined in our <strong><a href="${base}/policies/refund-policy" title="Refund and Return Policy">Refund &amp; Return Policy</a></strong>.</p>

<h3>What is the process for returning a product?</h3>
<p>To initiate a return, please follow these steps:</p>
<ol>
  <li>Email us at <strong><a href="mailto:${config.supportEmail}" title="${config.supportEmail}">${config.supportEmail}</a></strong> with your order number and a brief explanation of why you wish to return the product.</li>
  <li>A team member will respond within ${config.responseTime} providing return directions and the shipping address for sending the item back.</li>
  <li>Repack the item carefully in its original packaging and ship it to the address we provide.</li>
</ol>
<p>Once the returned product arrives and passes our inspection, we'll notify you whether the return has been accepted. See our <strong><a href="${base}/policies/refund-policy" title="Refund and Return Policy">Refund &amp; Return Policy</a></strong> for the full procedure.</p>

<h3>How soon will my refund be issued?</h3>
<p>After your return is received and approved, your refund will be processed within ${config.refundProcessingTime}. The funds will be returned to the original payment method you used at checkout. Be aware that your financial institution may require extra time before the credit appears on your statement.</p>

<h3>Do your products come with a warranty?</h3>
<p>We do not offer warranties or extended protection plans on any of our products. If you receive an item that is defective or does not match its description, you may return it within ${config.returnWindow} from the date of delivery under our <strong><a href="${base}/policies/refund-policy" title="Refund and Return Policy">Refund &amp; Return Policy</a></strong>. No restocking fee (${config.restockingFee}) applies to any return.</p>

<h3>Are international orders available?</h3>
<p>At this time, all shipments are limited to the ${config.shippingRegions}. We do not yet support international delivery, but we are exploring options to broaden our shipping coverage. Please check back periodically for updates, or <strong><a href="${base}/pages/contact-us" title="Contact Us">reach out to us</a></strong> if you'd like to be notified when international shipping becomes available.</p>

<h3>Is there a brick-and-mortar location where I can shop?</h3>
<p>Our business is entirely online, which allows us to maintain accessible pricing and carry a wider variety of products. You can explore and purchase from our full selection directly through this website.</p>

<h3>Do you accept large-quantity or wholesale orders?</h3>
<p>We welcome bulk order requests. For volume pricing, product availability and additional details, please reach out to our customer support team at <strong><a href="mailto:${config.supportEmail}" title="${config.supportEmail}">${config.supportEmail}</a></strong>.</p>

<h3>What is the easiest way to reach your support team?</h3>
<p>You can connect with our support team using any of these methods:</p>
<ul>
  <li>Email: <strong><a href="mailto:${config.supportEmail}" title="${config.supportEmail}">${config.supportEmail}</a></strong></li>
  <li>Number: <strong><a href="tel:${config.supportPhone.replace(/[\s()-]/g, '')}" title="${config.supportPhone}">${config.supportPhone}</a></strong></li>
  <li>Online Form: Visit our <strong><a href="${base}/pages/contact-us" title="Contact Us">Contact Us</a></strong> page</li>
</ul>

<h3>When is your customer support team available?</h3>
<p>Our team is reachable ${config.customerServiceHours}. Messages received outside of these hours will be answered within ${config.responseTime}. We make it a priority to respond to all inquiries as quickly as possible.</p>

<h2>Still Have Questions?</h2>
<p>If the information above didn't cover what you need, visit our <strong><a href="${base}/pages/contact-us" title="Contact Us">Contact Us</a></strong> page or drop us a line at <strong><a href="mailto:${config.supportEmail}" title="${config.supportEmail}">${config.supportEmail}</a></strong>. These resources may also be useful:</p>
<ul>
  <li><strong><a href="${base}/policies/shipping-policy" title="Shipping Policy">Shipping Policy</a></strong></li>
  <li><strong><a href="${base}/policies/refund-policy" title="Refund and Return Policy">Refund &amp; Return Policy</a></strong></li>
  <li><strong><a href="${base}/apps/track123" title="Track Your Order">Track Your Order</a></strong></li>
</ul>

${buildContactBlock(config)}`;
}
