/**
 * About Us page template.
 *
 * Each store should get a unique version — different structure, tone,
 * and sections. Do NOT reuse the same copy across stores.
 */

import type { StoreConfig } from "../config/store-config.js";
import { getStoreBaseUrl } from "../config/store-config.js";
import { buildContactBlock } from "../utils/contact-block.js";

export function generateAboutUs(config: StoreConfig): string {
  const lastUpdated = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  // --- Store-specific About Us content ---
  if (config.storeName === 'Nosura') {
    return generateNosuraAboutUs(config, lastUpdated);
  }

  if (config.storeName === 'Kind Clouds') {
    return generateKindCloudsAboutUs(config, lastUpdated);
  }

  // Fallback for any other store
  return generateDefaultAboutUs(config, lastUpdated);
}

function generateNosuraAboutUs(config: StoreConfig, lastUpdated: string): string {
  return `
<p><em>Last updated: ${lastUpdated}</em></p>

<p>We started ${config.storeName} with a straightforward idea: make it easier to find reliable ${config.brandNiche} without the guesswork. No flashy gimmicks, no inflated prices, just a clean store with products we've actually vetted and stand behind.</p>

<p>We built this store because we noticed a gap. Too many online shops throw hundreds of listings at you with zero curation. We wanted to do the opposite. Every product here is carefully selected and vetted before it goes live on our site. If it doesn't meet our standard, it doesn't make the cut.</p>

<p>We're not trying to be the biggest store on the internet. We'd rather be the one you actually trust. Here's what that looks like in practice:</p>
<ul>
<li>A focused product selection. We'd rather carry 50 great items than 500 mediocre ones.</li>
<li>Transparent product descriptions with no filler and no exaggeration.</li>
<li>Real customer support. Reach us at <strong><a href="${getStoreBaseUrl(config)}/pages/contact-us" title="Contact Us">our contact page</a></strong> and a real person will get back to you.</li>
<li>Hassle-free returns. Read our <strong><a href="${getStoreBaseUrl(config)}/policies/refund-policy" title="Refund and Return Policy">return policy</a></strong>, it's written in plain English.</li>
</ul>

<p>We ship within the US and our team is available ${config.customerServiceHours}. If something goes wrong with your order, we handle it. No runaround, no ticket numbers that go nowhere. You can expect a response within ${config.responseTime}.</p>
<p>Thanks for stopping by. Have a look around and if anything catches your eye, we're here if you need us.</p>

${buildContactBlock(config, false)}`;
}

function generateKindCloudsAboutUs(config: StoreConfig, lastUpdated: string): string {
  const base = getStoreBaseUrl(config);
  return `
<p><em>Last updated: ${lastUpdated}</em></p>

<p>${config.storeName} is a small shop we run online. Baby products, some kids stuff, pet things, and home items that are actually comfortable and not just cheap junk.</p>

<p>Why did we start it? Because we kept ordering things off the internet and getting garbage. Seriously. This one time we ordered what looked like a really nice fleece blanket for a crib and what showed up was basically see through. Paper thin. And the company ghosted us when we tried to get a refund. That was pretty much the last straw. We figured if nobody else is going to sell decent stuff and actually stand behind it then we might as well try. So far so good.</p>

<p>We only have about forty or fifty products on here at any given time because we check every single one before it goes up. What is it actually made of. Do the reviews from real buyers match what the company claims. Is the sizing accurate or are they just making numbers up. If any of that looks off we pass.</p>

<p>The product pages on here are pretty minimal and that is a choice we made on purpose. You get the name and what it is made of and the measurements. Done.</p>

<p>We ship free anywhere in the US and <strong><a href="${base}/policies/refund-policy" title="Refund and Return Policy">returns</a></strong> are not a headache. If something goes wrong with what you ordered just <strong><a href="${base}/pages/contact-us" title="Contact Us">send us a message</a></strong>. We answer ${config.customerServiceHours} and it is usually ${config.responseTime}.</p>

${buildContactBlock(config, false)}`;
}

function generateDefaultAboutUs(config: StoreConfig, lastUpdated: string): string {
  return `
<p><em>Last updated: ${lastUpdated}</em></p>

<p>${config.storeName} is a curated online store specializing in ${config.brandNiche}. We take pride in offering quality products with honest descriptions and responsive support.</p>

<p>We handpick every item in our catalog. Each product is carefully looked at before it goes live to make sure it meets our standards. We believe in keeping things simple. A smaller, better selection beats a massive, overwhelming one.</p>

<p>Need help? <strong><a href="${getStoreBaseUrl(config)}/pages/contact-us" title="Contact Us">Get in touch</a></strong> with us during ${config.customerServiceHours}. We typically respond within ${config.responseTime}. For common questions, check out our <strong><a href="${getStoreBaseUrl(config)}/pages/faqs" title="FAQs">FAQ page</a></strong>.</p>
<p>We also offer straightforward returns. See our <strong><a href="${getStoreBaseUrl(config)}/policies/refund-policy" title="Refund and Return Policy">refund policy</a></strong> for details.</p>

${buildContactBlock(config, false)}`;
}
