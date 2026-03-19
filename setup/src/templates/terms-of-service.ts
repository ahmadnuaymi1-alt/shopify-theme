/**
 * Terms of Service template.
 *
 * Base template — will be rewritten by Claude AI for uniqueness per store.
 */

import type { StoreConfig } from "../config/store-config.js";
import { getStoreBaseUrl } from "../config/store-config.js";
import { buildContactBlock } from "../utils/contact-block.js";

export function generateTermsOfService(config: StoreConfig): string {
  const base = getStoreBaseUrl(config);
  const lastUpdated = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  return `
<p><em>Last updated: ${lastUpdated}</em></p>

<h2>Terms of Service</h2>
<p>Welcome to ${config.storeName}. These Terms of Service ("Terms") govern your use of our website and any purchases you make from ${config.businessEntityName}, operating as ${config.storeName}. By accessing or using this site, you agree to be bound by these Terms. If you do not agree with them, please do not use our website.</p>

<h2>Agreement to Terms</h2>
<p>By visiting our website, viewing its content or placing an order, you acknowledge that you have read and understood these Terms of Service as well as our <strong><a href="${base}/policies/privacy-policy" title="Privacy Policy">Privacy Policy</a></strong>, and that you consent to abide by them. These Terms apply to all users of the site. This includes visitors, vendors, customers, merchants and content contributors.</p>

<h2>Permitted Use of This Site</h2>
<p>You may only use our website for lawful and legitimate purposes. You agree not to:</p>
<ul>
  <li>Use the site in any way that violates applicable local, state, federal or international laws or regulations.</li>
  <li>Attempt to access any restricted areas of the website, other user accounts or connected systems without authorization.</li>
  <li>Interfere with or disrupt the proper functioning of the website or its associated servers.</li>
  <li>Use automated software such as bots, crawlers or scrapers to access the site without our express written consent.</li>
  <li>Introduce viruses, malicious code or other harmful software onto the site.</li>
  <li>Collect or mine personal data belonging to other users.</li>
</ul>

<h2>Your Account</h2>
<p>By creating an account on our website, you take responsibility for:</p>
<ul>
  <li>Maintaining the confidentiality and security of your login details.</li>
  <li>All activity that occurs under your account.</li>
  <li>Notifying us immediately if you believe your account has been accessed without your permission.</li>
</ul>
<p>You must be at least 18 years old to create an account or submit an order. We reserve the right to refuse service, deactivate accounts or cancel orders at our sole discretion.</p>

<h2>Product Information and Pricing</h2>
<p>We make reasonable efforts to display accurate product descriptions, photographs and pricing on our website. However, we do not represent that all descriptions, colors or other content are entirely accurate, complete or error-free.</p>
<ul>
  <li>All prices are listed in ${config.currency} and are subject to change without prior notice.</li>
  <li>We reserve the right to correct any pricing errors, even after an order has been placed.</li>
  <li>If a price discrepancy is identified, we will contact you before processing the order so you may proceed at the accurate price or cancel.</li>
</ul>

<h2>Orders and Cancellations</h2>
<p>Placing an order on our website constitutes an offer to purchase. We retain the right to accept or decline any order at our discretion, including but not limited to the following reasons:</p>
<ul>
  <li>Insufficient product stock</li>
  <li>Errors in product information or pricing</li>
  <li>Indications of fraudulent or unauthorized transactions</li>
  <li>Orders that appear to come from dealers, resellers or wholesale buyers</li>
</ul>
<p>If we cancel your order, we will notify you and issue a full refund to your original payment method. For specifics on our refund procedures, please review our <strong><a href="${base}/policies/refund-policy" title="Refund and Return Policy">Refund &amp; Return Policy</a></strong>.</p>

<h2>Payment</h2>
<p>Payment in full is due at the time you place your order. We accept the following payment methods: ${config.paymentMethods}. All transactions are processed in ${config.currency}. For a full breakdown of fees, taxes and pricing details, please see our <strong><a href="${base}/pages/billing-terms-and-conditions" title="Billing Terms and Conditions">Billing Terms &amp; Conditions</a></strong>.</p>
<p>When you submit payment information, you represent that you are authorized to use the selected payment method and that all details provided are accurate. You further authorize us to charge the total order amount to your chosen payment method.</p>

<h2>Intellectual Property</h2>
<p>All content on this website, including text, graphics, logos, images, product descriptions and software, is the property of ${config.businessEntityName} or its respective content suppliers and is protected under United States and international copyright, trademark and intellectual property legislation.</p>
<p>You may not reproduce, distribute, modify, publicly display or otherwise use any portion of this website without obtaining our prior written permission.</p>

<h2>Third-Party Tools</h2>
<p>We may periodically provide access to third-party tools over which we have no oversight, control or input. You acknowledge and agree that these tools are offered on an "as is" and "as available" basis, without any conditions, representations or endorsements. We accept no liability for any outcomes resulting from your use of such optional third-party tools. Any use of third-party tools made available through this site is undertaken solely at your own risk.</p>

<h2>User-Submitted Content</h2>
<p>If you submit materials at our request (for example, contest entries) or voluntarily send creative ideas, feedback, proposals, plans or other content, whether through online forms, email, postal mail or any other channel (collectively called "comments"), you grant us an unrestricted, perpetual right to edit, reproduce, publish, distribute, translate and use those comments in any medium. We are under no obligation to (1) treat any comments as confidential; (2) pay compensation for any comments; or (3) respond to any comments.</p>
<p>You represent that your comments will not violate the rights of any third party, including copyright, trademark, privacy or other personal or proprietary rights. You further represent that your comments will not include defamatory, unlawful, abusive or obscene material, nor any viruses or malicious code that could disrupt this service or any related website.</p>

<h2>Corrections and Omissions</h2>
<p>Our site or service may occasionally contain typographical errors, inaccuracies or omissions concerning product descriptions, pricing, promotions, offers, shipping charges, transit times or stock availability. We reserve the right to correct any such errors and to modify or cancel orders at any time, without advance notice, should any information on the site or related services turn out to be incorrect.</p>

<h2>Limitation of Liability</h2>
<p>To the fullest extent permitted by applicable law, ${config.businessEntityName} and its officers, directors, employees and agents shall not be liable for any indirect, incidental, special, consequential or punitive damages arising from:</p>
<ul>
  <li>Your use of, or inability to use, our website</li>
  <li>Any products purchased through our website</li>
  <li>Unauthorized access to or alteration of your data</li>
  <li>Any third-party conduct or content on our website</li>
</ul>
<p>Our total liability for any claim related to your use of our website or the purchase of our products shall not exceed the amount you paid for the specific product(s) giving rise to the claim.</p>

<h2>Indemnification</h2>
<p>You agree to indemnify, defend and hold harmless ${config.businessEntityName}, doing business as ${config.storeName}, together with its parent company, subsidiaries, affiliates, partners, officers, directors, agents, contractors, licensors, service providers, subcontractors, suppliers, interns and employees, from any claim or demand, including reasonable attorneys' fees, made by any third party due to your breach of these Terms of Service, your use of the website or your violation of any law or third-party rights.</p>

<h2>Applicable Law</h2>
<p>These Terms shall be governed by and construed in accordance with the laws of the State of ${config.governingLawState}, without regard to its conflict of law provisions. Any legal disputes arising under these Terms or from your use of our website shall be adjudicated in the state or federal courts located in ${config.governingLawState}.</p>

<h2>Resolving Disputes</h2>
<p>Prior to initiating any legal proceedings, you agree to attempt to resolve any dispute informally by contacting us at <strong><a href="mailto:${config.supportEmail}" title="${config.supportEmail}">${config.supportEmail}</a></strong>. We will make a good-faith effort to resolve the issue within 30 days. If informal resolution proves unsuccessful, both parties consent to binding arbitration in the State of ${config.governingLawState}, unless prohibited by law. You may also reach us through our <strong><a href="${base}/pages/contact-us" title="Contact Us">contact page</a></strong> for quicker assistance.</p>

<h2>Severability</h2>
<p>If any provision of these Terms is found to be unlawful, void or unenforceable, that provision shall be considered separable and shall not affect the validity or enforceability of the remaining provisions.</p>

<h2>Termination</h2>
<p>These Terms of Service remain in effect until terminated by either party. You may terminate these Terms at any time by notifying us that you no longer wish to use our services, or by simply stopping your use of the website. We may also terminate or suspend your access at any time without prior notice or liability if, in our sole judgment, you breach any term or condition of these Terms. Upon termination, all provisions that by their nature should survive will continue in effect, including provisions relating to ownership, disclaimers, indemnification and limitations of liability.</p>

<h2>Complete Agreement</h2>
<p>These Terms of Service, together with any policies or operational rules posted on this site or pertaining to the service, constitute the entire agreement between you and ${config.businessEntityName}. They govern your use of the service and supersede all prior or contemporaneous agreements, communications or proposals, whether oral or written.</p>

<h2>Modifications to These Terms</h2>
<p>We may update or amend these Terms at any time without prior notice. Changes become effective immediately upon being posted on our website. Your continued use of the site after any modifications are published means you accept the updated Terms. We suggest reviewing this page on a regular basis to stay informed of any changes.</p>

${buildContactBlock(config)}`;
}
