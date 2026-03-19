/**
 * fix-pages-final.ts
 *
 * Fixes three rendering issues on Royal Reform's Shopify store:
 *
 * 1. About Us — page content correct in API but not rendering on live site
 *    because page.about.json template has the main section DISABLED, and
 *    the page may be resolving to that template.
 *    Fix: overwrite page.about.json to only render {{ page.content }},
 *         and force-update the page body + set template_suffix properly.
 *
 * 2. Contact Us — page content correct in API but live site shows old content
 *    and/or a theme contact form.
 *    Fix: overwrite page.contact.json to only render {{ page.content }},
 *         and force-update the page body + set template_suffix properly.
 *
 * 3. FAQs — our content shows but duplicate categorized FAQ accordion sections
 *    appear below it (from theme's dynamic-faq section).
 *    Fix: already done (page.faqs.json cleaned), but we verify and also
 *         neutralize the dynamic-faq.liquid section to prevent re-occurrence
 *         if sections are re-added.
 *
 * Run: npx tsx fix-pages-final.ts
 */

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const STORE_URL = "royal-reform.myshopify.com";
const CLIENT_ID = "675547b76119d11fd0f6f2ba8cee5446";
const CLIENT_SECRET = "REDACTED";
const API_VERSION = "2025-01";
const THEME_ID = 181103165737;

// Page IDs (from the GraphQL query)
const ABOUT_US_PAGE_ID = "gid://shopify/Page/153662783785";
const CONTACT_US_PAGE_ID = "gid://shopify/Page/153662980393";
const FAQS_PAGE_ID = "gid://shopify/Page/153663832361";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function getAccessToken(): Promise<string> {
  const res = await fetch(
    `https://${STORE_URL}/admin/oauth/access_token`,
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "client_credentials",
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
      }).toString(),
    },
  );

  if (!res.ok) {
    throw new Error(`Token request failed: ${res.status} ${await res.text()}`);
  }

  const data = (await res.json()) as { access_token: string };
  return data.access_token;
}

async function graphql<T>(
  token: string,
  query: string,
  variables?: Record<string, unknown>,
): Promise<T> {
  const res = await fetch(
    `https://${STORE_URL}/admin/api/${API_VERSION}/graphql.json`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Access-Token": token,
      },
      body: JSON.stringify({ query, variables }),
    },
  );

  if (!res.ok) {
    throw new Error(`GraphQL request failed: ${res.status} ${await res.text()}`);
  }

  const json = (await res.json()) as {
    data?: T;
    errors?: Array<{ message: string }>;
  };

  if (json.errors?.length) {
    throw new Error(
      `GraphQL errors: ${json.errors.map((e) => e.message).join("; ")}`,
    );
  }

  return json.data!;
}

async function putThemeAsset(
  token: string,
  key: string,
  value: string,
): Promise<void> {
  const res = await fetch(
    `https://${STORE_URL}/admin/api/${API_VERSION}/themes/${THEME_ID}/assets.json`,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Access-Token": token,
      },
      body: JSON.stringify({
        asset: { key, value },
      }),
    },
  );

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`PUT ${key} failed: ${res.status} ${body}`);
  }

  const json = (await res.json()) as { asset: { key: string } };
  console.log(`  [OK] Theme asset updated: ${json.asset.key}`);
}

async function getThemeAsset(
  token: string,
  key: string,
): Promise<string | null> {
  const res = await fetch(
    `https://${STORE_URL}/admin/api/${API_VERSION}/themes/${THEME_ID}/assets.json?asset%5Bkey%5D=${encodeURIComponent(key)}`,
    {
      headers: {
        "X-Shopify-Access-Token": token,
      },
    },
  );

  if (!res.ok) {
    if (res.status === 404) return null;
    throw new Error(`GET ${key} failed: ${res.status}`);
  }

  const json = (await res.json()) as { asset: { value: string } };
  return json.asset.value;
}

// ---------------------------------------------------------------------------
// Page content generators (inline — same as src/templates but self-contained)
// ---------------------------------------------------------------------------

function buildContactBlock(): string {
  const addr = {
    street: "5830 E 2nd St Ste 7000, #29859",
    city: "Casper",
    state: "Wyoming",
    zip: "82609",
    country: "United States",
  };
  const fullAddress = `${addr.street}, ${addr.city}, ${addr.state}, ${addr.zip}, ${addr.country}`;
  const mapsUrl = `https://www.google.com/maps/search/${encodeURIComponent(fullAddress)}`;

  return `<h2>Contact</h2>
<p>If you have questions or need assistance, we're happy to help. Visit our <a href="/pages/faqs">FAQs</a> page or <a href="/pages/contact-us">Contact Us</a> directly.</p>

<p><strong>Contact Information</strong></p>
<p><strong>Store Name:</strong> Royal Reform<br>
<strong>Address:</strong> <a href="${mapsUrl}" target="_blank" rel="noopener noreferrer">${fullAddress}</a><br>
<strong>Email:</strong> <a href="mailto:support@royalreform.com">support@royalreform.com</a><br>
<strong>Number:</strong> <a href="tel:+1 (307) 429-3855">+1 (307) 429-3855</a><br>
<strong>Hours of Operation:</strong> Monday to Friday, 9:00 AM to 5:00 PM (EST)</p>

<p>We aim to respond to all inquiries within 1 to 2 business days.</p>`;
}

function generateAboutUsHtml(): string {
  const lastUpdated = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return `
<p><em>Last updated: ${lastUpdated}</em></p>

<h2>Our Story</h2>
<p>Royal Reform was born from a straightforward belief: quality Pilates and fitness equipment products should be accessible to everyone — without the confusion, the uncertainty, or the markup. We noticed a gap between what customers needed and what was available, and we decided to do something about it.</p>
<p>Our goal was to create more than just another online shop. We wanted to build a brand that earns your trust. A place where product descriptions are honest, where support is always a priority, and where every item in our catalog has been thoughtfully chosen with our customers in mind.</p>

<h2>What Drives Us</h2>
<p>At Royal Reform, operated by AWRR Stores LLC, we're convinced that online shopping should feel easy and enjoyable. No tricks. No misleading claims. Just reliable products, accurate descriptions, and a team that truly values your experience.</p>
<p>Our mission is straightforward: bring you carefully selected Pilates and fitness equipment products alongside attentive service, honest pricing, and a shopping experience worth coming back to.</p>

<h2>What Makes Us Different</h2>
<p>The internet is full of online retailers. So what makes Royal Reform worth your time? Here's what we bring to the table:</p>
<ul>
  <li>Curated Selection: We don't try to stock everything. Each product in our catalog is hand-selected because we genuinely stand behind it.</li>
  <li>Real Customer Support: When you <strong><a href="/pages/contact-us">contact us</a></strong>, an actual person replies — not a bot, not a canned response. Our team is available Monday to Friday, 9:00 AM to 5:00 PM (EST).</li>
  <li>Hassle-Free Returns: Not satisfied? No worries. Our <strong><a href="/policies/refund-policy">Refund &amp; Return Policy</a></strong> is designed to keep things simple.</li>
  <li>Fast, Reliable Shipping: Nobody enjoys waiting. That's why we work hard to dispatch orders quickly and get them to your doorstep without delay.</li>
</ul>

<h2>Our Commitment to Quality</h2>
<p>We back every product we sell. Nothing makes it into our store without thorough vetting — attaching our name to a product carries real weight for us. Quality isn't a marketing term here; it's the benchmark we measure ourselves against daily.</p>
<p>If anything ever doesn't meet your expectations, we want to know. Your feedback helps us improve, and we treat every piece of it with genuine care.</p>

<h2>Thank You</h2>
<p>Whether this is your first visit or you've shopped with us before, we appreciate you being here. Growing Royal Reform has been a passion project, and every order, every review, and every word of encouragement from our customers reinforces why we started this journey.</p>
<p>We're thrilled to have you with us.</p>

${buildContactBlock()}`.trim();
}

function generateContactUsHtml(): string {
  const addr = {
    street: "5830 E 2nd St Ste 7000, #29859",
    city: "Casper",
    state: "Wyoming",
    zip: "82609",
    country: "United States",
  };
  const fullAddress = `${addr.street}, ${addr.city}, ${addr.state}, ${addr.zip}, ${addr.country}`;
  const mapsUrl = `https://www.google.com/maps/search/${encodeURIComponent(fullAddress)}`;
  const lastUpdated = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return `
<p><em>Last updated: ${lastUpdated}</em></p>

<h2>Get in Touch</h2>
<p>We're here and happy to help! Whether you have a question about your order, need guidance choosing a product, or simply want to share your thoughts, our team is standing by. Use the form below and we'll respond at the earliest opportunity.</p>

<!-- SHOPIFY_CONTACT_FORM -->

<h2>Contact Details</h2>
<p>Would you rather reach us directly? Here are your options:</p>
<ul>
  <li>Email: <strong><a href="mailto:support@royalreform.com">support@royalreform.com</a></strong></li>
  <li>Number: <strong><a href="tel:+1 (307) 429-3855">+1 (307) 429-3855</a></strong></li>
  <li>Mailing Address: <strong><a href="${mapsUrl}" target="_blank" rel="noopener noreferrer">${fullAddress}</a></strong></li>
</ul>

<h2>Customer Service Hours</h2>
<p>Our support team is available Monday to Friday, 9:00 AM to 5:00 PM (EST).</p>
<p>Any messages sent outside of business hours will receive a reply within 1 to 2 business days. We make every effort to address each inquiry as promptly as possible.</p>

<h2>Before You Reach Out</h2>
<p>The answer you need might already be on our <strong><a href="/pages/faqs">Frequently Asked Questions</a></strong> page. We've gathered detailed answers covering orders, <strong><a href="/policies/shipping-policy">shipping</a></strong>, <strong><a href="/policies/refund-policy">returns</a></strong>, and more.</p>

${buildContactBlock()}`.trim();
}

function generateFaqsHtml(): string {
  const lastUpdated = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return `
<p><em>Last updated: ${lastUpdated}</em></p>

<h2>Frequently Asked Questions</h2>
<p>Below you'll find answers to the questions our customers ask most. If nothing here addresses your concern, feel free to <strong><a href="/pages/contact-us">reach out to us</a></strong> — we're always glad to assist!</p>

<h3>How do I place an order?</h3>
<p>Ordering is simple. Browse our catalog, pick the products you want, select the appropriate size or variant (where applicable), and hit "Add to Cart." Once you're ready, open your cart and head to checkout. Enter your shipping and payment details, then confirm your order. A confirmation email will arrive shortly after your purchase is complete.</p>

<h3>What payment methods do you accept?</h3>
<p>We currently accept: Visa, MasterCard, American Express, Discover, Diners Club, PayPal, Apple Pay, Google Pay, Shop Pay. Every transaction is handled through a secure payment processor, and we never store your payment details on our servers.</p>

<h3>How long does shipping take?</h3>
<p>Our overall estimated delivery timeframe is 7-10 business days, broken down as follows:</p>
<ul>
  <li>Processing time: 1-2 business days — this covers picking, packing, and dispatching your order.</li>
  <li>Transit time: 6-8 business days — this is how long the carrier needs to deliver your package once it's been picked up.</li>
</ul>
<p>Orders submitted before 5:00 PM EST on business days will enter processing that same day. You can find complete details in our <strong><a href="/policies/shipping-policy">Shipping Policy</a></strong>.</p>

<h3>Do you offer free shipping?</h3>
<p>Absolutely! We provide free shipping on every order within the United States, with no minimum purchase required. For more information about delivery methods and timelines, please review our <strong><a href="/policies/shipping-policy">Shipping Policy</a></strong>.</p>

<h3>Can I cancel my order after it's placed?</h3>
<p>You can cancel your order within 24 hours of submitting it. To do so, reach out to our support team at <strong><a href="mailto:support@royalreform.com">support@royalreform.com</a></strong> as quickly as possible. Once the 24-hour window closes, orders move into processing and can no longer be canceled.</p>

<h3>How can I track my order?</h3>
<p>As soon as your order is shipped, we'll send you an email containing a tracking number. Use that number on the carrier's website or visit our <strong><a href="/pages/track-your-order">Track Your Order</a></strong> page to follow your shipment. Tracking details may take up to 24 hours after the shipping notification to become active.</p>

<h3>What is your return policy?</h3>
<p>We provide a 30 days return period starting from the date your order is delivered. Items must be in unused condition, in their original packaging, and with all tags still attached. Certain items are non-returnable and will be clearly marked on their product pages. For the complete policy, please visit our <strong><a href="/policies/refund-policy">Refund &amp; Return Policy</a></strong>.</p>

<h3>What if I'm not happy with my purchase?</h3>
<p>If something isn't right with your order, you can return it within 30 days of delivery. Just <strong><a href="/pages/contact-us">contact us</a></strong> and we'll walk you through the process. Full details are in our <strong><a href="/policies/refund-policy">Refund &amp; Return Policy</a></strong>.</p>

<h3>How do I return an item?</h3>
<p>To start a return, follow these steps:</p>
<ol>
  <li>Send an email to <strong><a href="mailto:support@royalreform.com">support@royalreform.com</a></strong> including your order number and the reason you'd like to return the item.</li>
  <li>Our team will reply within 1 to 2 business days with return instructions and the address to ship the item back to.</li>
  <li>Securely package the item in its original packaging and send it to the provided address.</li>
</ol>
<p>After we receive and inspect the returned item, we'll let you know whether your return has been approved. Full details are available in our <strong><a href="/policies/refund-policy">Refund &amp; Return Policy</a></strong>.</p>

<h3>When will I receive my refund?</h3>
<p>Once your return is received and approved, we will process your refund within 7 business days. The amount will be credited to your original payment method. Keep in mind that your bank or card issuer may need additional time to reflect the refund on your statement.</p>

<h3>Do you ship internationally?</h3>
<p>Currently, we ship exclusively within the United States. International shipping is not yet available, though we're actively working on expanding our delivery reach. Check back for updates, or <strong><a href="/pages/contact-us">get in touch</a></strong> to let us know you're interested in international delivery.</p>

<h3>Do you have a physical store location I can visit?</h3>
<p>We operate exclusively online, which enables us to keep our prices competitive and offer a broader product range. Our entire catalog is available for browsing and purchasing right here on our website.</p>

<h3>Can I place a bulk order for my business or organization?</h3>
<p>We'd be happy to accommodate bulk orders. For pricing, stock availability, and other specifics, please get in touch with our customer support team at <strong><a href="mailto:support@royalreform.com">support@royalreform.com</a></strong>.</p>

<h3>How do I contact customer support?</h3>
<p>Our support team is available through the following channels:</p>
<ul>
  <li>Email: <strong><a href="mailto:support@royalreform.com">support@royalreform.com</a></strong></li>
  <li>Number: <strong><a href="tel:+1 (307) 429-3855">+1 (307) 429-3855</a></strong></li>
  <li>Contact Form: Head over to our <strong><a href="/pages/contact-us">Contact Us</a></strong> page</li>
</ul>

<h3>What are your customer service hours?</h3>
<p>Our support team is available Monday to Friday, 9:00 AM to 5:00 PM (EST). Any messages that arrive outside business hours will receive a response within 1 to 2 business days. We strive to address every inquiry promptly.</p>

<h2>Still Have Questions?</h2>
<p>If you didn't find your answer above, head to our <strong><a href="/pages/contact-us">Contact Us</a></strong> page or send us an email at <strong><a href="mailto:support@royalreform.com">support@royalreform.com</a></strong>. You may also find these resources helpful:</p>
<ul>
  <li><strong><a href="/policies/shipping-policy">Shipping Policy</a></strong></li>
  <li><strong><a href="/policies/refund-policy">Refund &amp; Return Policy</a></strong></li>
  <li><strong><a href="/pages/track-your-order">Track Your Order</a></strong></li>
</ul>

${buildContactBlock()}`.trim();
}

// ---------------------------------------------------------------------------
// GraphQL mutations
// ---------------------------------------------------------------------------

const PAGE_UPDATE_MUTATION = `
  mutation pageUpdate($id: ID!, $page: PageUpdateInput!) {
    pageUpdate(id: $id, page: $page) {
      page {
        id
        title
        handle
        templateSuffix
      }
      userErrors {
        field
        message
      }
    }
  }
`;

// ---------------------------------------------------------------------------
// Template JSON — clean versions that ONLY render {{ page.content }}
// ---------------------------------------------------------------------------

// For About Us: simple page template that just renders page content
const CLEAN_PAGE_ABOUT_JSON = JSON.stringify(
  {
    sections: {
      main: {
        type: "page",
        settings: {},
      },
    },
    order: ["main"],
  },
  null,
  2,
);

// For Contact Us: use page-contact section (renders page.content + contact form)
// The page-contact.liquid section DOES render {{ page.content }} and adds a
// working contact form below it. This is ideal for a Contact Us page.
const CLEAN_PAGE_CONTACT_JSON = JSON.stringify(
  {
    sections: {
      main: {
        type: "page-contact",
        settings: {},
      },
    },
    order: ["main"],
  },
  null,
  2,
);

// For FAQs: simple page template (already clean, but we'll re-push to be safe)
const CLEAN_PAGE_FAQS_JSON = JSON.stringify(
  {
    sections: {
      main: {
        type: "page",
        settings: {},
      },
    },
    order: ["main"],
  },
  null,
  2,
);

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  console.log("=== Royal Reform Page Fix Script ===\n");

  // 1. Get access token
  console.log("Step 1: Getting access token...");
  const token = await getAccessToken();
  console.log("  [OK] Token obtained.\n");

  // 2. Fix theme templates
  console.log("Step 2: Fixing theme templates...\n");

  console.log("  Updating page.about.json (enable main section, remove demo sections)...");
  await putThemeAsset(token, "templates/page.about.json", CLEAN_PAGE_ABOUT_JSON);

  console.log("  Updating page.contact.json (use page-contact section for form)...");
  await putThemeAsset(token, "templates/page.contact.json", CLEAN_PAGE_CONTACT_JSON);

  console.log("  Updating page.faqs.json (ensure only page section)...");
  await putThemeAsset(token, "templates/page.faqs.json", CLEAN_PAGE_FAQS_JSON);

  // Also ensure page.faq.json (singular) is clean in case anything references it
  console.log("  Updating page.faq.json (ensure only page section)...");
  await putThemeAsset(
    token,
    "templates/page.faq.json",
    JSON.stringify(
      {
        sections: {
          main: {
            type: "page",
            settings: {},
          },
        },
        order: ["main"],
      },
      null,
      2,
    ),
  );

  // 3. Neutralize dynamic-faq.liquid to prevent it from adding unwanted content
  console.log("\n  Neutralizing dynamic-faq.liquid section...");
  const neutralizedDynamicFaq = `{% comment %}
  Dynamic FAQ section - content rendering disabled to prevent duplicate FAQ content.
  Only page.content is rendered via the page section.
{% endcomment %}

{% schema %}
{
  "name": "t:sections.faq.name",
  "class": "shopify-section--faq",
  "settings": [],
  "blocks": [],
  "presets": [],
  "disabled_on": {
    "groups": ["*"]
  }
}
{% endschema %}
`;
  await putThemeAsset(token, "sections/dynamic-faq.liquid", neutralizedDynamicFaq);

  // Also neutralize static-faq.liquid (used by page.faq.json)
  console.log("  Neutralizing static-faq.liquid section...");
  const neutralizedStaticFaq = `<article class="site-page" data-template-page>
  <header class="page-masthead">
    <h1 class="page-title">
      {{ page.title }}
    </h1>
  </header>

  {% if page.content != blank %}
    <div class="page-content rte">
      {{ page.content }}
    </div>
  {% endif %}
</article>

{% schema %}
{
  "name": "t:sections.faq_page.name",
  "class": "shopify-section--faq",
  "settings": []
}
{% endschema %}`;
  await putThemeAsset(token, "sections/static-faq.liquid", neutralizedStaticFaq);

  console.log();

  // 4. Force-update page content and set correct template_suffix
  console.log("Step 3: Force-updating page content and template suffixes...\n");

  // About Us — set templateSuffix to "about" so it uses page.about.json
  console.log("  Updating About Us page...");
  const aboutResult = await graphql<{
    pageUpdate: {
      page: { id: string; title: string; handle: string; templateSuffix: string } | null;
      userErrors: Array<{ field: string[]; message: string }>;
    };
  }>(token, PAGE_UPDATE_MUTATION, {
    id: ABOUT_US_PAGE_ID,
    page: {
      title: "About Us",
      body: generateAboutUsHtml(),
      templateSuffix: "about",
      isPublished: true,
    },
  });

  if (aboutResult.pageUpdate.userErrors.length > 0) {
    console.error(
      "  [FAIL] About Us errors:",
      aboutResult.pageUpdate.userErrors,
    );
  } else {
    console.log(
      `  [OK] About Us updated. Suffix: "${aboutResult.pageUpdate.page?.templateSuffix}"`,
    );
  }

  // Contact Us — set templateSuffix to "contact" so it uses page.contact.json
  console.log("  Updating Contact Us page...");
  const contactResult = await graphql<{
    pageUpdate: {
      page: { id: string; title: string; handle: string; templateSuffix: string } | null;
      userErrors: Array<{ field: string[]; message: string }>;
    };
  }>(token, PAGE_UPDATE_MUTATION, {
    id: CONTACT_US_PAGE_ID,
    page: {
      title: "Contact Us",
      body: generateContactUsHtml(),
      templateSuffix: "contact",
      isPublished: true,
    },
  });

  if (contactResult.pageUpdate.userErrors.length > 0) {
    console.error(
      "  [FAIL] Contact Us errors:",
      contactResult.pageUpdate.userErrors,
    );
  } else {
    console.log(
      `  [OK] Contact Us updated. Suffix: "${contactResult.pageUpdate.page?.templateSuffix}"`,
    );
  }

  // FAQs — ensure templateSuffix is "faqs" so it uses page.faqs.json
  console.log("  Updating FAQs page...");
  const faqResult = await graphql<{
    pageUpdate: {
      page: { id: string; title: string; handle: string; templateSuffix: string } | null;
      userErrors: Array<{ field: string[]; message: string }>;
    };
  }>(token, PAGE_UPDATE_MUTATION, {
    id: FAQS_PAGE_ID,
    page: {
      title: "FAQs",
      body: generateFaqsHtml(),
      templateSuffix: "faqs",
      isPublished: true,
    },
  });

  if (faqResult.pageUpdate.userErrors.length > 0) {
    console.error("  [FAIL] FAQs errors:", faqResult.pageUpdate.userErrors);
  } else {
    console.log(
      `  [OK] FAQs updated. Suffix: "${faqResult.pageUpdate.page?.templateSuffix}"`,
    );
  }

  console.log("\n=== All updates complete ===\n");

  // 5. Verify: Read back the pages from the API
  console.log("Step 4: Verifying pages via API...\n");
  await sleep(2000); // Brief pause for propagation

  const verifyQuery = `
    query {
      aboutUs: page(id: "${ABOUT_US_PAGE_ID}") {
        title handle templateSuffix
        body
      }
      contactUs: page(id: "${CONTACT_US_PAGE_ID}") {
        title handle templateSuffix
        body
      }
      faqs: page(id: "${FAQS_PAGE_ID}") {
        title handle templateSuffix
        body
      }
    }
  `;

  const verify = await graphql<{
    aboutUs: { title: string; handle: string; templateSuffix: string; body: string };
    contactUs: { title: string; handle: string; templateSuffix: string; body: string };
    faqs: { title: string; handle: string; templateSuffix: string; body: string };
  }>(token, verifyQuery);

  // About Us checks
  const au = verify.aboutUs;
  console.log(`  About Us:`);
  console.log(`    Handle: ${au.handle}`);
  console.log(`    Template Suffix: "${au.templateSuffix}"`);
  console.log(`    Has "Last updated": ${au.body.includes("Last updated")}`);
  console.log(`    Has "Our Story": ${au.body.includes("Our Story")}`);
  console.log(`    Has contact block: ${au.body.includes("Contact Information")}`);
  console.log(`    Body length: ${au.body.length}`);

  // Contact Us checks
  const cu = verify.contactUs;
  console.log(`  Contact Us:`);
  console.log(`    Handle: ${cu.handle}`);
  console.log(`    Template Suffix: "${cu.templateSuffix}"`);
  console.log(`    Has "Last updated": ${cu.body.includes("Last updated")}`);
  console.log(`    Has "Get in Touch": ${cu.body.includes("Get in Touch")}`);
  console.log(`    Has contact block: ${cu.body.includes("Contact Information")}`);
  console.log(`    Body length: ${cu.body.length}`);

  // FAQs checks
  const fq = verify.faqs;
  console.log(`  FAQs:`);
  console.log(`    Handle: ${fq.handle}`);
  console.log(`    Template Suffix: "${fq.templateSuffix}"`);
  console.log(`    Has "Last updated": ${fq.body.includes("Last updated")}`);
  console.log(`    Has 15 Q&As: ${(fq.body.match(/<h3>/g) || []).length} H3 tags`);
  console.log(`    Has contact block: ${fq.body.includes("Contact Information")}`);
  console.log(`    Body length: ${fq.body.length}`);

  console.log(`\n=== Verification complete ===`);
  console.log(`\nPages should now render correctly. Allow 1-2 minutes for CDN cache to clear.`);
  console.log(`Test URLs (with cache bust):`);
  console.log(`  https://royalreform.com/pages/about-us?v=${Date.now()}`);
  console.log(`  https://royalreform.com/pages/contact-us?v=${Date.now()}`);
  console.log(`  https://royalreform.com/pages/faqs?v=${Date.now()}`);
}

main().catch((err) => {
  console.error("\n[FATAL]", err);
  process.exit(1);
});
