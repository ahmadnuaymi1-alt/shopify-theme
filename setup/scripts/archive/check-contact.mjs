/**
 * Check the contact-us page status and verify our new page exists.
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

async function main() {
  const token = await getAccessToken();

  // Check all pages with "contact" in the handle or title
  const result = await gql(token, `
    {
      pages(first: 50) {
        edges {
          node {
            id
            title
            handle
            templateSuffix
            isPublished
            createdAt
            updatedAt
            body
          }
        }
      }
    }
  `);

  const pages = result.data.pages.edges.map(e => e.node);

  console.log("All pages with 'contact' in handle/title:");
  for (const page of pages) {
    if (page.handle.includes("contact") || page.title.toLowerCase().includes("contact")) {
      console.log(`\n  Handle: ${page.handle}`);
      console.log(`  Title: ${page.title}`);
      console.log(`  ID: ${page.id}`);
      console.log(`  Template: "${page.templateSuffix || "(default)"}"`);
      console.log(`  Published: ${page.isPublished}`);
      console.log(`  Created: ${page.createdAt}`);
      console.log(`  Updated: ${page.updatedAt}`);
      console.log(`  Body starts: ${page.body?.substring(0, 200)}`);
    }
  }

  // Also check for any URL redirects that might be sending /pages/contact-us somewhere else
  console.log("\n\nChecking URL redirects...");
  const redirectsResult = await gql(token, `
    {
      urlRedirects(first: 50) {
        edges {
          node {
            id
            path
            target
          }
        }
      }
    }
  `);

  if (redirectsResult.data?.urlRedirects?.edges) {
    const redirects = redirectsResult.data.urlRedirects.edges.map(e => e.node);
    const contactRedirects = redirects.filter(r =>
      r.path.includes("contact") || r.target.includes("contact")
    );
    if (contactRedirects.length > 0) {
      console.log("\nContact-related redirects:");
      for (const r of contactRedirects) {
        console.log(`  ${r.path} -> ${r.target}`);
      }
    } else {
      console.log("No contact-related redirects found.");
    }
    console.log(`\nTotal redirects: ${redirects.length}`);
  }

  // Check the specific contact-us page body in detail
  const contactPage = pages.find(p => p.handle === "contact-us");
  if (contactPage) {
    console.log("\n\nFull contact-us body content:");
    console.log("--- START ---");
    console.log(contactPage.body);
    console.log("--- END ---");
  }
}

main().catch(err => {
  console.error("Fatal:", err);
  process.exit(1);
});
