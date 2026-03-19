/**
 * Final fix for Contact Us page: delete, wait, recreate, verify.
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

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

async function main() {
  const token = await getToken();
  console.log("Token OK\n");

  // Get current contact-us
  const pagesRes = await gql(token, `{
    pages(first: 50) {
      edges { node { id handle body title isPublished } }
    }
  }`);

  const contactPage = pagesRes.data.pages.edges
    .map(e => e.node)
    .find(p => p.handle === "contact-us");

  if (!contactPage) {
    console.log("Contact Us page not found!");
    return;
  }

  console.log("Found contact-us:", contactPage.id);
  console.log("Body preview:", contactPage.body.substring(0, 120));
  console.log("Has correct content:", contactPage.body.includes("Last updated: March 11, 2026"));

  // Delete it
  console.log("\nDeleting...");
  const delRes = await gql(token, `
    mutation($id: ID!) {
      pageDelete(id: $id) {
        deletedPageId
        userErrors { field message }
      }
    }
  `, { id: contactPage.id });
  console.log("Delete result:", delRes.data?.pageDelete?.deletedPageId);

  // Wait longer
  console.log("Waiting 8 seconds...");
  await sleep(8000);

  // Recreate with a slightly different body to force cache invalidation
  // (append a timestamp comment that we'll remove later)
  const bodyWithTimestamp = contactPage.body + `\n<!-- Updated: ${new Date().toISOString()} -->`;

  console.log("\nRecreating...");
  const createRes = await gql(token, `
    mutation($page: PageCreateInput!) {
      pageCreate(page: $page) {
        page { id handle templateSuffix isPublished }
        userErrors { field message }
      }
    }
  `, {
    page: {
      title: contactPage.title,
      handle: "contact-us",
      body: bodyWithTimestamp,
      isPublished: true,
    }
  });

  const newPage = createRes.data?.pageCreate?.page;
  console.log("Created:", newPage?.id, "handle:", newPage?.handle, "published:", newPage?.isPublished);

  if (createRes.data?.pageCreate?.userErrors?.length > 0) {
    console.log("Create errors:", createRes.data.pageCreate.userErrors);
  }

  // Wait
  console.log("Waiting 5 seconds...");
  await sleep(5000);

  // Now restore the clean body (without timestamp comment)
  if (newPage) {
    console.log("\nRestoring clean body...");
    await gql(token, `
      mutation($id: ID!, $page: PageUpdateInput!) {
        pageUpdate(id: $id, page: $page) {
          page { id updatedAt }
          userErrors { field message }
        }
      }
    `, { id: newPage.id, page: { body: contactPage.body } });
  }

  await sleep(5000);

  // Verify on live site
  console.log("\nVerifying live page...");
  const liveRes = await fetch("https://royalreform.com/pages/contact-us", {
    headers: { "Cache-Control": "no-cache, no-store", "Pragma": "no-cache" },
  });
  const html = await liveRes.text();

  const checks = [
    ["Last updated: March 11, 2026", html.includes("Last updated: March 11, 2026")],
    ["Get in Touch (in body)", html.includes(">Get in Touch<")],
    ["We're here and happy to help", html.includes("We&#39;re here and happy to help") || html.includes("We're here and happy to help") || html.includes("We&#x27;re here and happy to help")],
    ["Old content NOT present", !html.includes("For any questions regarding our products")],
  ];

  console.log("\nVerification results:");
  for (const [label, result] of checks) {
    console.log(`  ${result ? "PASS" : "FAIL"}: ${label}`);
  }

  // Also extract the page-content div
  const match = html.match(/<div class="page-content rte">([\s\S]*?)<\/div>/);
  if (match) {
    console.log("\nRendered page-content (first 300 chars):");
    console.log(match[1].substring(0, 300));
  }
}

main().catch(e => {
  console.error("Fatal:", e);
  process.exit(1);
});
