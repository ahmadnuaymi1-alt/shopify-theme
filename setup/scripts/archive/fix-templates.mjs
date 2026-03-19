/**
 * Fix: Set all three pages to use the DEFAULT page template (no suffix)
 * so that {{ page.content }} is rendered from the body field.
 *
 * The "page" suffix template (page.page.json) has per-page section
 * overrides with old hardcoded content. The default page.json template
 * should render the actual page body.
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

  // Get all pages
  const pagesResult = await gql(token, `
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

  const pages = pagesResult.data.pages.edges.map(e => e.node);
  const targetHandles = ["about-us", "contact-us", "faqs"];

  console.log("Current state:");
  for (const page of pages) {
    if (targetHandles.includes(page.handle)) {
      console.log(`  ${page.handle}: templateSuffix = "${page.templateSuffix || "(null)"}"`);
    }
  }

  // Set all three to empty/null templateSuffix (use the DEFAULT page.json template)
  console.log("\nSetting all three pages to DEFAULT template (empty suffix)...\n");

  for (const handle of targetHandles) {
    const page = pages.find(p => p.handle === handle);
    if (!page) {
      console.log(`  WARNING: Page ${handle} not found!`);
      continue;
    }

    console.log(`Updating ${handle} (${page.id})...`);
    console.log(`  Current templateSuffix: "${page.templateSuffix || "(null)"}"`);

    const result = await gql(token, `
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
      id: page.id,
      page: { templateSuffix: "" }
    });

    if (result.data?.pageUpdate?.userErrors?.length > 0) {
      console.log(`  ERRORS:`, JSON.stringify(result.data.pageUpdate.userErrors));
    } else {
      const newSuffix = result.data?.pageUpdate?.page?.templateSuffix;
      console.log(`  OK! New templateSuffix: "${newSuffix || "(null/empty)"}"`);
    }
  }

  // Verify
  console.log("\n--- Verification ---");
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

  for (const edge of verifyResult.data.pages.edges) {
    const p = edge.node;
    if (targetHandles.includes(p.handle)) {
      console.log(`  ${p.handle}: templateSuffix = "${p.templateSuffix || "(null/empty)"}"`);
    }
  }

  console.log("\nDone! Check the live pages now.");
}

main().catch(err => {
  console.error("Fatal:", err);
  process.exit(1);
});
