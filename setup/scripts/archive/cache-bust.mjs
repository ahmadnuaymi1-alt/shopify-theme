/**
 * Force Shopify CDN cache invalidation by:
 * 1. Updating the page body with a tiny whitespace change then back
 * 2. Toggling published status off/on
 * This should force the CDN to serve fresh content.
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
  if (json.errors) console.error("GraphQL Errors:", JSON.stringify(json.errors, null, 2));
  return json;
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function main() {
  const token = await getAccessToken();
  console.log("[OK] Token obtained\n");

  // Get the current pages
  const result = await gql(token, `
    {
      pages(first: 50) {
        edges {
          node {
            id
            handle
            body
            isPublished
          }
        }
      }
    }
  `);

  const pages = result.data.pages.edges.map(e => e.node);
  const targetHandles = ["about-us", "contact-us"];

  for (const handle of targetHandles) {
    const page = pages.find(p => p.handle === handle);
    if (!page) {
      console.log(`${handle}: NOT FOUND`);
      continue;
    }

    console.log(`\nCache-busting ${handle} (${page.id})...`);

    // Strategy 1: Unpublish then republish
    console.log("  Step 1: Unpublishing...");
    await gql(token, `
      mutation pageUpdate($id: ID!, $page: PageUpdateInput!) {
        pageUpdate(id: $id, page: $page) {
          page { id isPublished }
          userErrors { field message }
        }
      }
    `, { id: page.id, page: { isPublished: false } });

    await sleep(2000);

    console.log("  Step 2: Republishing...");
    await gql(token, `
      mutation pageUpdate($id: ID!, $page: PageUpdateInput!) {
        pageUpdate(id: $id, page: $page) {
          page { id isPublished }
          userErrors { field message }
        }
      }
    `, { id: page.id, page: { isPublished: true } });

    // Strategy 2: Add and remove a trailing space in the body
    console.log("  Step 3: Touching body (add trailing comment)...");
    await gql(token, `
      mutation pageUpdate($id: ID!, $page: PageUpdateInput!) {
        pageUpdate(id: $id, page: $page) {
          page { id updatedAt }
          userErrors { field message }
        }
      }
    `, { id: page.id, page: { body: page.body + "<!-- cache-bust -->" } });

    await sleep(1000);

    console.log("  Step 4: Restoring original body...");
    await gql(token, `
      mutation pageUpdate($id: ID!, $page: PageUpdateInput!) {
        pageUpdate(id: $id, page: $page) {
          page { id updatedAt }
          userErrors { field message }
        }
      }
    `, { id: page.id, page: { body: page.body } });

    console.log(`  Done for ${handle}!`);
  }

  console.log("\n\nAll cache-bust operations complete. Wait a few seconds and check again.");
}

main().catch(err => {
  console.error("Fatal:", err);
  process.exit(1);
});
