/**
 * Privacy Policy template.
 *
 * Base template — will be rewritten by Claude AI for uniqueness per store.
 */

import type { StoreConfig } from "../config/store-config.js";
import { getStoreBaseUrl } from "../config/store-config.js";
import { buildContactBlock } from "../utils/contact-block.js";

export function generatePrivacyPolicy(config: StoreConfig): string {
  const base = getStoreBaseUrl(config);
  const lastUpdated = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  return `
<p><em>Last updated: ${lastUpdated}</em></p>

<h2>Privacy Policy</h2>
<p>Your privacy matters to us. This Privacy Policy outlines the ways ${config.businessEntityName}, doing business as ${config.storeName}, collects, processes, shares and protects your personal information whenever you visit our website or place an order. By using our site, you agree to the data practices described in this policy.</p>

<h2>Data We Collect</h2>
<p>We gather several types of information to provide and improve our services:</p>

<h3>Personal Information</h3>
<p>When you place an order, create an account or reach out to our team, we may collect:</p>
<ul>
  <li>Your full name</li>
  <li>Email address</li>
  <li>Shipping and mailing address</li>
  <li>Telephone number</li>
  <li>Billing address</li>
</ul>

<h3>Payment Information</h3>
<p>At checkout, your payment information (such as credit card numbers and billing details) is collected and securely processed by third-party payment providers. We never store your full credit card number on our servers.</p>

<h3>Browsing and Technical Data</h3>
<p>While you browse our site, we may automatically collect:</p>
<ul>
  <li>Your IP address</li>
  <li>Browser type and version number</li>
  <li>Operating system details</li>
  <li>Pages visited and duration on each page</li>
  <li>Referring site URL</li>
  <li>Device specifications</li>
</ul>

<h2>How We Use Your Data</h2>
<p>We use the information collected for these purposes:</p>
<ul>
  <li>Completing and delivering your orders</li>
  <li>Sending you updates about orders, account activity or customer service matters</li>
  <li>Improving our website, product selection and support experience</li>
  <li>Sending promotional offers and marketing communications (you can opt out at any time)</li>
  <li>Detecting and preventing fraud</li>
  <li>Complying with applicable laws and regulations</li>
</ul>

<h2>Sharing Your Information</h2>
<p>We do not sell your personal data under any circumstances. We only share information with third parties in the following situations:</p>
<ul>
  <li>Service Providers: We share data with companies that help run our business, including payment processors, shipping partners, email services and analytics platforms. These providers only receive the information required to perform their designated tasks.</li>
  <li>Legal Requirements: We may disclose your information if required by law, subpoena or governmental request, or where disclosure is reasonably needed to protect our rights, your safety or the safety of others.</li>
  <li>Business Changes: If ${config.storeName} is involved in a merger, acquisition or sale of assets, your personal data may be transferred as part of that transaction.</li>
</ul>

<h2>Cookies and Similar Technologies</h2>
<p>We use cookies and comparable tracking technologies to enhance your experience on our site, analyze visitor traffic and personalize content. Cookies are small data files stored on your device when you access our website.</p>
<p>Types of cookies we use:</p>
<ul>
  <li>Functional Cookies: Required for basic site operations (e.g., your shopping cart and login sessions).</li>
  <li>Analytics Cookies: Help us understand how visitors use our site, allowing us to identify areas for improvement.</li>
  <li>Advertising Cookies: Allow us to display relevant ads and track the performance of marketing campaigns.</li>
</ul>
<p>You may adjust your cookie settings through your web browser. Please note that disabling cookies may restrict your ability to use certain features of our site.</p>

<h2>Protecting Your Data</h2>
<p>We employ reasonable measures to protect your personal information against unauthorized access, alteration, disclosure or destruction. Our security measures include:</p>
<ul>
  <li>SSL encryption on every page where personal data is transmitted</li>
  <li>Payment handling through PCI-compliant third-party processors</li>
  <li>Regular security assessments and continuous system monitoring</li>
  <li>Access to personal data is limited to employees who require it for their role</li>
</ul>
<p>Despite these precautions, no method of transmitting data over the Internet is entirely secure. We cannot offer an absolute assurance of data security.</p>

<h2>Your Privacy Rights</h2>
<p>You have the following rights with respect to your personal data:</p>
<ul>
  <li>Access: Ask for a copy of the personal data we hold about you.</li>
  <li>Correction: Request that we fix any inaccurate or outdated information.</li>
  <li>Deletion: Ask us to erase your personal data, subject to legal requirements that may apply.</li>
  <li>Opt-Out: Stop receiving marketing emails at any time by clicking the "unsubscribe" link in our messages or by contacting us directly.</li>
  <li>Data Portability: Receive your data in a structured, widely used and machine-readable format.</li>
</ul>
<p>To make use of any of these rights, contact us at <strong><a href="mailto:${config.supportEmail}" title="${config.supportEmail}">${config.supportEmail}</a></strong>. For more information about our return process or order-related questions, please refer to our <strong><a href="${base}/policies/refund-policy" title="Refund and Return Policy">Refund &amp; Return Policy</a></strong> and <strong><a href="${base}/policies/shipping-policy" title="Shipping Policy">Shipping Policy</a></strong>.</p>

<h2>Children's Privacy</h2>
<p>Our website is not intended for anyone under 13 years of age. We do not knowingly collect personal data from children under 13. If we discover that a child's information has been collected without appropriate consent, we will delete it without delay. If you suspect a child has provided us with personal information, please let us know at <strong><a href="mailto:${config.supportEmail}" title="${config.supportEmail}">${config.supportEmail}</a></strong>.</p>

<h2>Revisions to This Policy</h2>
<p>This Privacy Policy may be updated from time to time to reflect changes in how we operate, advances in technology or shifts in legal requirements. Revisions will be indicated by the updated date shown at the top of this page. We encourage you to review this policy periodically. Your continued use of our website following any changes constitutes acceptance of the revised policy. For any questions regarding updates, please <strong><a href="${base}/pages/contact-us" title="Contact Us">contact us</a></strong>.</p>

<h2>Visitors Outside the United States</h2>
<p>Your personal data may be transferred to, stored and processed in countries other than your own, in compliance with relevant data protection laws. By accessing our website, you consent to the transfer of your data to the United States, where our servers are located.</p>

${buildContactBlock(config)}`;
}
