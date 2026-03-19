/**
 * Try fixing via REST API instead of GraphQL.
 * REST API page updates might trigger cache invalidation differently.
 *
 * Also try: changing the page handle temporarily then changing it back,
 * which should force Shopify to rebuild the URL routing + cache.
 */

const STORE_URL = "royal-reform.myshopify.com";
const CLIENT_ID = "675547b76119d11fd0f6f2ba8cee5446";
const CLIENT_SECRET = "REDACTED";
const API_VERSION = "2025-01";

async function getToken() {
  const res = await fetch(`https://${STORE_URL}/admin/oauth/access_token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
    }).toString(),
  });
  return (await res.json()).access_token;
}

async function gql(token, q, v = {}) {
  const res = await fetch(`https://${STORE_URL}/admin/api/${API_VERSION}/graphql.json`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Shopify-Access-Token": token },
    body: JSON.stringify({ query: q, variables: v }),
  });
  const json = await res.json();
  if (json.errors) console.error("GQL Errors:", json.errors);
  return json;
}

async function restPut(token, path, body) {
  const url = `https://${STORE_URL}/admin/api/${API_VERSION}/${path}`;
  const res = await fetch(url, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Access-Token": token,
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    console.error(`REST PUT ${path} -> HTTP ${res.status}: ${await res.text()}`);
    return null;
  }
  return res.json();
}

async function restGet(token, path) {
  const url = `https://${STORE_URL}/admin/api/${API_VERSION}/${path}`;
  const res = await fetch(url, {
    headers: { "X-Shopify-Access-Token": token },
  });
  if (!res.ok) {
    console.error(`REST GET ${path} -> HTTP ${res.status}: ${await res.text()}`);
    return null;
  }
  return res.json();
}

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

async function main() {
  const token = await getToken();
  console.log("Token OK\n");

  // Get current pages via GraphQL
  const pagesRes = await gql(token, `{
    pages(first: 50) {
      edges { node { id handle body title } }
    }
  }`);

  const targetHandles = ["about-us", "contact-us", "faqs"];
  const pages = {};
  for (const edge of pagesRes.data.pages.edges) {
    const p = edge.node;
    if (targetHandles.includes(p.handle)) {
      const numericId = p.id.split("/").pop();
      pages[p.handle] = { ...p, numericId };
      console.log(`${p.handle}: GQL ID = ${p.id}, numeric = ${numericId}`);
    }
  }

  // Try REST API approach for each page
  for (const handle of targetHandles) {
    const page = pages[handle];
    if (!page) continue;

    console.log(`\n${"=".repeat(60)}`);
    console.log(`Fixing ${handle} via REST API...`);
    console.log(`${"=".repeat(60)}`);

    // First check the page via REST to see if REST sees the same data
    const restPage = await restGet(token, `pages/${page.numericId}.json`);
    if (restPage) {
      console.log(`REST page body starts: ${restPage.page.body_html?.substring(0, 80)}`);
    } else {
      console.log(`REST page not found at numeric ID ${page.numericId}`);

      // The numeric ID from GraphQL might not match REST.
      // Let's try to find the page by listing all pages
      console.log("Listing all REST pages to find it...");
      const allPages = await restGet(token, "pages.json?handle=" + handle);
      if (allPages && allPages.pages && allPages.pages.length > 0) {
        const restId = allPages.pages[0].id;
        console.log(`Found via REST search: ID = ${restId}`);
        console.log(`Body starts: ${allPages.pages[0].body_html?.substring(0, 80)}`);

        // Try updating via REST
        console.log("\nUpdating body_html via REST...");
        const updateRes = await restPut(token, `pages/${restId}.json`, {
          page: {
            id: restId,
            body_html: page.body,
          }
        });
        if (updateRes) {
          console.log("REST update OK, body starts:", updateRes.page.body_html?.substring(0, 80));
        }
      } else {
        console.log("Page not found via REST either.");
      }
      continue;
    }

    // Update via REST API
    console.log("\nUpdating body_html via REST...");
    const updateRes = await restPut(token, `pages/${page.numericId}.json`, {
      page: {
        id: parseInt(page.numericId),
        body_html: page.body,
      }
    });
    if (updateRes) {
      console.log("REST update OK, body starts:", updateRes.page.body_html?.substring(0, 80));
    }
  }

  // Wait and check
  console.log("\n\nWaiting 10 seconds for cache...");
  await sleep(10000);

  console.log("\nChecking live pages...");
  for (const handle of targetHandles) {
    const res = await fetch(`https://royalreform.com/pages/${handle}`);
    const html = await res.text();
    const hasNewContent = html.includes("Last updated: March 11, 2026");
    const hasOldAbout = html.includes("Royal Reform was created by the owner");
    const hasOldContact = html.includes("For any questions regarding our products");
    const hasOldFaq = html.includes("Will I receive order confirmation");
    const rid = html.match(/"rid":(\d+)/)?.[1];

    console.log(`\n${handle}:`);
    console.log(`  RID: ${rid}`);
    console.log(`  Has new content: ${hasNewContent}`);
    console.log(`  Has old content: ${hasOldAbout || hasOldContact || hasOldFaq}`);
  }
}

main().catch(e => {
  console.error("Fatal:", e);
  process.exit(1);
});
