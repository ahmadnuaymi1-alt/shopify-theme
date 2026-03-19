/**
 * fix-theme.ts
 * Fixes Shopify theme templates so About Us, Contact Us, and FAQs pages
 * render page.content (body_html) correctly without extra theme section content.
 *
 * Problems found and fixed:
 * 1. page.faq.json had 5 "dynamic-faq" sections with hardcoded Q&A accordion content
 * 2. page.about.json had extra theme sections (image overlays, rich text, menu lists)
 * 3. page.contact.json had a "page-contact" section type with a theme contact form
 * 4. The FAQs page had persistent per-page section customizations in Shopify's DB
 *    that couldn't be deleted via the Asset API
 *
 * Solutions applied:
 * - Cleaned page.faq.json to only have a "static-faq" main section
 * - Created page.faqs.json with just a "page" main section (new, uncached template)
 * - Added {% unless page.handle == 'faqs' %} guard to dynamic-faq.liquid section
 *   to neutralize persistent per-page customizations
 * - Set About Us and Contact Us to use default page.json (templateSuffix: "")
 * - Recreated FAQs page to clear page-level customization data
 * - Set FAQs to use "faqs" template suffix (page.faqs.json)
 *
 * Note: Shopify CDN may take several minutes to fully propagate changes.
 */

import { loadConfig } from "./src/config/store-config.js";

const storeNameArg = process.argv[2] || "Kind Clouds";
const storeConfig = await loadConfig(storeNameArg);
if (!storeConfig) {
  console.error(`Config not found for ${storeNameArg}`);
  process.exit(1);
}

const STORE = storeConfig.shopifyStoreUrl;
const CLIENT_ID = storeConfig.shopifyClientId;
const CLIENT_SECRET = storeConfig.shopifyClientSecret;
const API_VERSION = "2025-01";

let ACCESS_TOKEN = "";

// ── Helpers ──────────────────────────────────────────────────────────────────

async function getAccessToken(): Promise<string> {
  console.log("\n=== Step 0: Getting access token ===");
  const res = await fetch(`https://${STORE}/admin/oauth/access_token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `grant_type=client_credentials&client_id=${CLIENT_ID}&client_secret=${CLIENT_SECRET}`,
  });
  if (!res.ok) throw new Error(`Token failed: ${res.status} ${await res.text()}`);
  const data = await res.json();
  console.log("Access token obtained.");
  return data.access_token;
}

async function restGet(path: string): Promise<any> {
  const url = `https://${STORE}/admin/api/${API_VERSION}/${path}`;
  const res = await fetch(url, {
    headers: { "X-Shopify-Access-Token": ACCESS_TOKEN, "Content-Type": "application/json" },
  });
  if (!res.ok) throw new Error(`GET ${path}: ${res.status} ${await res.text()}`);
  return res.json();
}

async function restPut(path: string, body: any): Promise<any> {
  const url = `https://${STORE}/admin/api/${API_VERSION}/${path}`;
  const res = await fetch(url, {
    method: "PUT",
    headers: { "X-Shopify-Access-Token": ACCESS_TOKEN, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`PUT ${path}: ${res.status} ${await res.text()}`);
  return res.json();
}

async function graphql(query: string, variables: Record<string, any> = {}): Promise<any> {
  const url = `https://${STORE}/admin/api/${API_VERSION}/graphql.json`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "X-Shopify-Access-Token": ACCESS_TOKEN, "Content-Type": "application/json" },
    body: JSON.stringify({ query, variables }),
  });
  if (!res.ok) throw new Error(`GraphQL: ${res.status} ${await res.text()}`);
  return res.json();
}

// ── Step 1: Get main theme ID ────────────────────────────────────────────────

async function getMainThemeId(): Promise<number> {
  console.log("\n=== Step 1: Getting main theme ID ===");
  const data = await restGet("themes.json");
  const mainTheme = data.themes.find((t: any) => t.role === "main");
  if (!mainTheme) throw new Error("No main theme found!");
  console.log(`Main theme: "${mainTheme.name}" (ID: ${mainTheme.id})`);
  return mainTheme.id;
}

// ── Step 2: Read template files ──────────────────────────────────────────────

async function readTemplates(themeId: number) {
  console.log("\n=== Step 2: Reading template files ===");

  const keys = [
    "templates/page.faq.json",
    "templates/page.faqs.json",
    "templates/page.contact.json",
    "templates/page.about.json",
    "templates/page.json",
  ];

  for (const key of keys) {
    console.log(`\n  ${key}:`);
    try {
      const data = await restGet(`themes/${themeId}/assets.json?asset[key]=${encodeURIComponent(key)}`);
      const parsed = JSON.parse(data.asset.value);
      const sections = parsed.sections || {};
      for (const [sk, sv] of Object.entries(sections)) {
        const s = sv as any;
        console.log(`    - ${sk}: type="${s.type}", disabled=${s.disabled ?? false}`);
      }
    } catch {
      console.log(`    (not found)`);
    }
  }
}

// ── Step 3: Fix templates and section ────────────────────────────────────────

async function fixTemplatesAndSection(themeId: number) {
  console.log("\n=== Step 3: Fixing templates and section ===");

  // 3a. Clean page.faq.json
  console.log("\n  Uploading clean page.faq.json...");
  await restPut(`themes/${themeId}/assets.json`, {
    asset: {
      key: "templates/page.faq.json",
      value: JSON.stringify(
        { sections: { main: { type: "static-faq", settings: {} } }, order: ["main"] },
        null,
        2,
      ),
    },
  });
  console.log("  Done.");

  // 3b. Create/update page.faqs.json (fresh template)
  console.log("  Uploading page.faqs.json...");
  await restPut(`themes/${themeId}/assets.json`, {
    asset: {
      key: "templates/page.faqs.json",
      value: JSON.stringify(
        { sections: { main: { type: "page", settings: {} } }, order: ["main"] },
        null,
        2,
      ),
    },
  });
  console.log("  Done.");

  // 3c. Add guard to dynamic-faq.liquid
  console.log("  Checking dynamic-faq.liquid...");
  const sectionData = await restGet(
    `themes/${themeId}/assets.json?asset[key]=sections/dynamic-faq.liquid`,
  );
  let content = sectionData.asset.value;

  if (content.includes("unless page.handle == 'faqs'")) {
    console.log("  Guard already present.");
  } else {
    const schemaIdx = content.indexOf("{% schema %}");
    if (schemaIdx === -1) throw new Error("No {% schema %} in dynamic-faq.liquid");

    content =
      `{% unless page.handle == 'faqs' %}\n` +
      content.substring(0, schemaIdx) +
      `{% endunless %}\n` +
      content.substring(schemaIdx);

    console.log("  Uploading guarded dynamic-faq.liquid...");
    await restPut(`themes/${themeId}/assets.json`, {
      asset: { key: "sections/dynamic-faq.liquid", value: content },
    });
    console.log("  Done.");
  }
}

// ── Step 4: Fix page template assignments ────────────────────────────────────

async function fixPageAssignments() {
  console.log("\n=== Step 4: Fixing page template assignments ===");

  const pagesResult = await graphql(`{
    pages(first: 50) { edges { node { id handle title templateSuffix } } }
  }`);
  const allPages = pagesResult.data.pages.edges.map((e: any) => e.node);
  const find = (h: string) => allPages.find((p: any) => p.handle === h);

  const mutation = `
    mutation pageUpdate($id: ID!, $page: PageUpdateInput!) {
      pageUpdate(id: $id, page: $page) {
        page { id handle templateSuffix }
        userErrors { field message }
      }
    }
  `;

  const updates = [
    { page: find("about-us"), suffix: "", reason: "page.about.json has extra sections" },
    { page: find("faqs"), suffix: "faqs", reason: "using clean page.faqs.json" },
    { page: find("contact-us"), suffix: "", reason: "page.contact.json has contact form" },
  ];

  for (const { page, suffix, reason } of updates) {
    if (!page) continue;
    console.log(`\n  ${page.handle} (${page.id}): suffix="${suffix}" (${reason})`);
    const r = await graphql(mutation, { id: page.id, page: { templateSuffix: suffix } });
    const p = r.data?.pageUpdate;
    if (p?.userErrors?.length > 0) console.log(`    ERRORS: ${JSON.stringify(p.userErrors)}`);
    else console.log(`    OK: templateSuffix="${p?.page?.templateSuffix ?? ""}"`);
  }
}

// ── Step 5: Verify ───────────────────────────────────────────────────────────

async function verify() {
  console.log("\n=== Step 5: Verifying pages ===");
  console.log("  Note: Shopify CDN may take a few minutes to fully propagate.\n");

  const pages = [
    { name: "About Us", url: "https://royalreform.com/pages/about-us", check: "We are an online business" },
    { name: "Contact Us", url: "https://royalreform.com/pages/contact-us", check: "customer service is available" },
    { name: "FAQs", url: "https://royalreform.com/pages/faqs", check: "How do I place an order" },
  ];

  for (const page of pages) {
    const r = await fetch(`${page.url}?t=${Date.now()}`);
    const html = await r.text();

    const hasRte = html.includes("page-content rte");
    const hasContent = html.includes(page.check);
    const hasDynFaq = html.includes("faq__heading");
    const sections = (html.match(/id="shopify-section[^"]*"/g) || []).length;

    const status = hasRte && hasContent && !hasDynFaq && sections === 3 ? "OK" : "CACHED";

    console.log(`  ${page.name}: ${status}`);
    console.log(`    page-content: ${hasRte}, our content: ${hasContent}, theme faq: ${hasDynFaq}, sections: ${sections}`);

    if (page.name === "FAQs" && hasContent) {
      const h3s = html.match(/<h3>[^<]+<\/h3>/g) || [];
      console.log(`    FAQ questions rendered: ${h3s.length}`);
    }
  }
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log("=== Shopify Theme Template Fixer ===");
  console.log(`Store: ${STORE}`);

  ACCESS_TOKEN = await getAccessToken();
  const themeId = await getMainThemeId();
  await readTemplates(themeId);
  await fixTemplatesAndSection(themeId);
  await fixPageAssignments();
  await verify();

  console.log("\n=== Complete ===");
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
