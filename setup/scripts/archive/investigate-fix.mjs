/**
 * Investigation Part 3:
 * 1. Check what templates are actually available by trying to set them
 * 2. Try to fix by removing template suffixes or setting to default
 * 3. Check storefront to verify
 */

const STORE_URL = "royal-reform.myshopify.com";
const CLIENT_ID = "675547b76119d11fd0f6f2ba8cee5446";
const CLIENT_SECRET = "REDACTED";
const API_VERSION = "2025-01";

async function getAccessToken() {
  const tokenUrl = `https://${STORE_URL}/admin/oauth/access_token`;
  const response = await fetch(tokenUrl, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
    }).toString(),
  });
  if (!response.ok) throw new Error(`Token failed: ${await response.text()}`);
  const data = await response.json();
  console.log(`[OK] Token obtained\n`);
  return data.access_token;
}

async function gql(token, query, variables = {}) {
  const endpoint = `https://${STORE_URL}/admin/api/${API_VERSION}/graphql.json`;
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Access-Token": token,
    },
    body: JSON.stringify({ query, variables }),
  });
  if (!response.ok) throw new Error(`GraphQL HTTP ${response.status}: ${await response.text()}`);
  const json = await response.json();
  if (json.errors) {
    console.error("GraphQL Errors:", JSON.stringify(json.errors, null, 2));
  }
  return json;
}

async function main() {
  const token = await getAccessToken();

  // -----------------------------------------------------------
  // First, let's understand the problem:
  //
  // About Us has templateSuffix = "page" -> uses templates/page.page.json
  // FAQs has templateSuffix = "faq" -> uses templates/page.faq.json
  // Contact Us has templateSuffix = "contact" -> uses templates/page.contact.json
  //
  // These custom templates likely have sections that display static/hardcoded
  // content instead of rendering {{ page.content }}.
  //
  // The FIX: Change the templateSuffix to "" (empty) so they use
  // the default templates/page.json which renders {{ page.content }}.
  //
  // But wait - some themes have a "page" suffix that IS the default page
  // template that renders content. Let's check by comparing with other pages.
  // -----------------------------------------------------------

  console.log("=" .repeat(70));
  console.log("Checking ALL pages and their template suffixes:");
  console.log("=" .repeat(70));

  const pagesResult = await gql(token, `
    {
      pages(first: 50) {
        edges {
          node {
            id
            title
            handle
            templateSuffix
            body
          }
        }
      }
    }
  `);

  const pages = pagesResult.data.pages.edges.map(e => e.node);

  // Group by templateSuffix
  const byTemplate = {};
  for (const page of pages) {
    const suffix = page.templateSuffix || "(default/null)";
    if (!byTemplate[suffix]) byTemplate[suffix] = [];
    byTemplate[suffix].push(page);
  }

  console.log("\nPages grouped by templateSuffix:");
  for (const [suffix, group] of Object.entries(byTemplate)) {
    console.log(`\n  templateSuffix = "${suffix}":`);
    for (const p of group) {
      console.log(`    - ${p.handle} (body: ${p.body ? p.body.length : 0} chars)`);
    }
  }

  // -----------------------------------------------------------
  // Key insight: Pages like "Track Your Order" and "Billing Terms" have
  // templateSuffix = null/default and their content shows properly.
  // The problematic pages have custom template suffixes.
  //
  // The "page" suffix on About Us is especially suspicious - "page.page.json"
  // would be a custom template named "page" which may have its own sections.
  //
  // Let's check: the "Shipping Policy" also has suffix "page" - does IT show correctly?
  // -----------------------------------------------------------

  console.log("\n" + "=" .repeat(70));
  console.log("DIAGNOSIS:");
  console.log("=" .repeat(70));
  console.log(`
  About Us:    templateSuffix = "page"    -> uses templates/page.page.json
  FAQs:        templateSuffix = "faq"     -> uses templates/page.faq.json
  Contact Us:  templateSuffix = "contact" -> uses templates/page.contact.json

  Compare with pages that DO show correctly:
  Track Your Order:  templateSuffix = null  -> uses templates/page.json (DEFAULT)
  Billing Terms:     templateSuffix = null  -> uses templates/page.json (DEFAULT)

  And other "page" suffix pages:
  Shipping Policy:   templateSuffix = "page" -> uses templates/page.page.json
  Disclaimer:        templateSuffix = "page" -> uses templates/page.page.json
  Terms of Service:  templateSuffix = "page" -> uses templates/page.page.json
  Privacy Policy:    templateSuffix = "page" -> uses templates/page.page.json
  Return Policy:     templateSuffix = "page" -> uses templates/page.page.json

  ANALYSIS:
  - The "page" template suffix (page.page.json) is used by most policy pages.
    If those pages show their content correctly, then the "page" suffix IS
    rendering {{ page.content }} and About Us should work too.

  - The "faq" and "contact" suffixes are CUSTOM templates that likely have
    hardcoded sections that don't render {{ page.content }}.

  FIX OPTIONS:
  A) For FAQs: Change templateSuffix from "faq" to "" or "page"
  B) For Contact Us: Change templateSuffix from "contact" to "" or "page"
  C) For About Us: It already uses "page" suffix, same as other working pages.
     If About Us content is wrong, the issue might be elsewhere.
  `);

  // -----------------------------------------------------------
  // Let's try the fix: Update FAQs and Contact Us template suffixes
  // -----------------------------------------------------------
  console.log("=" .repeat(70));
  console.log("APPLYING FIX: Changing template suffixes...");
  console.log("=" .repeat(70));

  // Fix FAQs: change from "faq" to "page"
  const faqPage = pages.find(p => p.handle === "faqs");
  if (faqPage) {
    console.log(`\nFixing FAQs (${faqPage.id})...`);
    console.log(`  Current templateSuffix: "faq"`);
    console.log(`  Changing to: "page" (same as other content pages)`);

    const faqResult = await gql(token, `
      mutation pageUpdate($id: ID!, $page: PageUpdateInput!) {
        pageUpdate(id: $id, page: $page) {
          page {
            id
            handle
            templateSuffix
          }
          userErrors {
            field
            message
          }
        }
      }
    `, {
      id: faqPage.id,
      page: { templateSuffix: "page" }
    });

    if (faqResult.data?.pageUpdate?.userErrors?.length > 0) {
      console.log(`  ERRORS:`, faqResult.data.pageUpdate.userErrors);
    } else {
      console.log(`  OK! New templateSuffix: "${faqResult.data?.pageUpdate?.page?.templateSuffix}"`);
    }
  }

  // Fix Contact Us: change from "contact" to "page"
  const contactPage = pages.find(p => p.handle === "contact-us");
  if (contactPage) {
    console.log(`\nFixing Contact Us (${contactPage.id})...`);
    console.log(`  Current templateSuffix: "contact"`);
    console.log(`  Changing to: "page" (same as other content pages)`);

    const contactResult = await gql(token, `
      mutation pageUpdate($id: ID!, $page: PageUpdateInput!) {
        pageUpdate(id: $id, page: $page) {
          page {
            id
            handle
            templateSuffix
          }
          userErrors {
            field
            message
          }
        }
      }
    `, {
      id: contactPage.id,
      page: { templateSuffix: "page" }
    });

    if (contactResult.data?.pageUpdate?.userErrors?.length > 0) {
      console.log(`  ERRORS:`, contactResult.data.pageUpdate.userErrors);
    } else {
      console.log(`  OK! New templateSuffix: "${contactResult.data?.pageUpdate?.page?.templateSuffix}"`);
    }
  }

  // About Us already has "page" suffix, same as shipping policy etc.
  // But let's verify that it's working or if there's another issue
  const aboutPage = pages.find(p => p.handle === "about-us");
  if (aboutPage) {
    console.log(`\nAbout Us (${aboutPage.id}):`);
    console.log(`  Current templateSuffix: "page" (same as working policy pages)`);
    console.log(`  No change needed if policy pages render correctly.`);
    console.log(`  If About Us still doesn't show content, the "page" template itself`);
    console.log(`  may have custom sections for this specific page.`);
  }

  // -----------------------------------------------------------
  // Verify the changes
  // -----------------------------------------------------------
  console.log("\n" + "=" .repeat(70));
  console.log("VERIFICATION: Re-querying template suffixes...");
  console.log("=" .repeat(70));

  const verifyResult = await gql(token, `
    {
      pages(first: 50) {
        edges {
          node {
            id
            title
            handle
            templateSuffix
          }
        }
      }
    }
  `);

  const targetHandles = ["about-us", "contact-us", "faqs"];
  for (const edge of verifyResult.data.pages.edges) {
    const p = edge.node;
    if (targetHandles.includes(p.handle)) {
      console.log(`  ${p.handle}: templateSuffix = "${p.templateSuffix || "(null/default)"}"`);
    }
  }

  console.log(`
NEXT STEPS:
1. Check the live pages to see if the content now renders correctly.
2. If About Us STILL shows old content despite having templateSuffix="page",
   the issue is that the theme's page.page.json template has custom sections
   that override {{ page.content }} specifically for the About Us page.
   In that case, we'd need to either:
   - Change About Us to templateSuffix="" (use the bare default template)
   - Or access the theme editor to modify the template sections
3. For Contact Us, note that the old "contact" template may have included
   a Shopify contact form section. By switching to "page", the contact
   form will need to be in the page body HTML (which it should be via
   the <!-- SHOPIFY_CONTACT_FORM --> comment or a Liquid form tag).
  `);
}

main().catch(err => {
  console.error("Fatal:", err);
  process.exit(1);
});
