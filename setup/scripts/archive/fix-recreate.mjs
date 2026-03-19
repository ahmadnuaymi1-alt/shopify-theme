/**
 * Fix by deleting and recreating the three problematic pages.
 *
 * Theory: The Shopify theme (OS 2.0 JSON templates) has per-page section
 * customizations keyed by page ID. These section customizations contain
 * the OLD content. When a page is loaded, the theme renders these section
 * customizations instead of {{ page.content }}.
 *
 * By deleting the page and creating a new one with a different ID, the
 * theme won't have any per-page section customizations for the new page,
 * so it will fall back to rendering {{ page.content }} from the body.
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

  // First, get the current pages and save their body content
  const pagesResult = await gql(token, `
    {
      pages(first: 50) {
        edges {
          node {
            id
            title
            handle
            body
            templateSuffix
            isPublished
          }
        }
      }
    }
  `);

  const allPages = pagesResult.data.pages.edges.map(e => e.node);
  const targetHandles = ["about-us", "contact-us", "faqs"];

  // Save the current body content for each target page
  const pageData = {};
  for (const page of allPages) {
    if (targetHandles.includes(page.handle)) {
      pageData[page.handle] = {
        id: page.id,
        title: page.title,
        handle: page.handle,
        body: page.body,
        isPublished: page.isPublished,
      };
      console.log(`Saved data for ${page.handle}:`);
      console.log(`  Title: ${page.title}`);
      console.log(`  Body length: ${page.body?.length || 0} chars`);
      console.log(`  Published: ${page.isPublished}`);
      console.log(`  Body starts with: ${page.body?.substring(0, 100)}...`);
      console.log();
    }
  }

  // Delete the old pages
  console.log("=" .repeat(70));
  console.log("DELETING old pages...");
  console.log("=" .repeat(70));

  for (const handle of targetHandles) {
    const data = pageData[handle];
    if (!data) {
      console.log(`  WARNING: ${handle} not found, skipping.`);
      continue;
    }

    console.log(`\nDeleting ${handle} (${data.id})...`);
    const deleteResult = await gql(token, `
      mutation pageDelete($id: ID!) {
        pageDelete(id: $id) {
          deletedPageId
          userErrors {
            field
            message
          }
        }
      }
    `, { id: data.id });

    if (deleteResult.data?.pageDelete?.userErrors?.length > 0) {
      console.log(`  DELETE ERRORS:`, JSON.stringify(deleteResult.data.pageDelete.userErrors));
    } else {
      console.log(`  OK! Deleted: ${deleteResult.data?.pageDelete?.deletedPageId}`);
    }
  }

  // Wait a moment for deletion to propagate
  console.log("\nWaiting 3 seconds for deletion to propagate...");
  await new Promise(r => setTimeout(r, 3000));

  // Recreate the pages with the same body content, default template, published
  console.log("\n" + "=" .repeat(70));
  console.log("RECREATING pages with body content and DEFAULT template...");
  console.log("=" .repeat(70));

  for (const handle of targetHandles) {
    const data = pageData[handle];
    if (!data) continue;

    console.log(`\nCreating ${handle}...`);
    console.log(`  Title: ${data.title}`);
    console.log(`  Handle: ${data.handle}`);
    console.log(`  Body length: ${data.body?.length || 0}`);

    const createResult = await gql(token, `
      mutation pageCreate($page: PageCreateInput!) {
        pageCreate(page: $page) {
          page {
            id
            title
            handle
            templateSuffix
            isPublished
            body
          }
          userErrors {
            field
            message
          }
        }
      }
    `, {
      page: {
        title: data.title,
        handle: data.handle,
        body: data.body,
        isPublished: true,
        // No templateSuffix -> uses default template
      }
    });

    if (createResult.data?.pageCreate?.userErrors?.length > 0) {
      console.log(`  CREATE ERRORS:`, JSON.stringify(createResult.data.pageCreate.userErrors));
    } else {
      const newPage = createResult.data?.pageCreate?.page;
      console.log(`  OK! New ID: ${newPage?.id}`);
      console.log(`  Handle: ${newPage?.handle}`);
      console.log(`  Template: "${newPage?.templateSuffix || "(default)"}"`);
      console.log(`  Published: ${newPage?.isPublished}`);
      console.log(`  Body length: ${newPage?.body?.length || 0}`);
    }
  }

  // Final verification
  console.log("\n" + "=" .repeat(70));
  console.log("FINAL VERIFICATION...");
  console.log("=" .repeat(70));

  const finalResult = await gql(token, `
    {
      pages(first: 50) {
        edges {
          node {
            id
            title
            handle
            templateSuffix
            isPublished
            bodySummary
          }
        }
      }
    }
  `);

  for (const edge of finalResult.data.pages.edges) {
    const p = edge.node;
    if (targetHandles.includes(p.handle)) {
      console.log(`\n  ${p.handle}:`);
      console.log(`    ID: ${p.id}`);
      console.log(`    Template: "${p.templateSuffix || "(default)"}"`);
      console.log(`    Published: ${p.isPublished}`);
      console.log(`    Summary: ${p.bodySummary?.substring(0, 80)}...`);
    }
  }

  console.log("\n\nDone! Check the live pages now to verify content renders correctly.");
}

main().catch(err => {
  console.error("Fatal:", err);
  process.exit(1);
});
