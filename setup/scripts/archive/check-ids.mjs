const STORE_URL = "royal-reform.myshopify.com";
const CLIENT_ID = "675547b76119d11fd0f6f2ba8cee5446";
const CLIENT_SECRET = "REDACTED";
const API_VERSION = "2025-01";

async function main() {
  const tokenRes = await fetch(`https://${STORE_URL}/admin/oauth/access_token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
    }).toString(),
  });
  const { access_token: token } = await tokenRes.json();

  const res = await fetch(`https://${STORE_URL}/admin/api/${API_VERSION}/graphql.json`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Shopify-Access-Token": token },
    body: JSON.stringify({
      query: `{
        pages(first: 50) {
          edges {
            node {
              id
              handle
              title
              templateSuffix
              isPublished
              createdAt
              updatedAt
            }
          }
        }
      }`
    }),
  });
  const json = await res.json();

  console.log("All pages with contact/about/faq:");
  for (const edge of json.data.pages.edges) {
    const p = edge.node;
    if (p.handle.includes("contact") || p.handle.includes("about") || p.handle.includes("faq")) {
      // Extract numeric ID
      const numId = p.id.split("/").pop();
      console.log(`  ${p.handle} - ID: ${p.id} (numeric: ${numId})`);
      console.log(`    title: ${p.title}, template: ${p.templateSuffix || "(default)"}, published: ${p.isPublished}`);
      console.log(`    created: ${p.createdAt}, updated: ${p.updatedAt}`);
    }
  }

  // Also try to fetch the old deleted page ID directly
  console.log("\nTrying to fetch old page IDs directly...");
  const oldIds = [
    "gid://shopify/Page/152081039657",   // old contact-us
    "gid://shopify/Page/152074879273",    // old about-us
    "gid://shopify/Page/152079401257",    // old faqs
  ];

  for (const oldId of oldIds) {
    const checkRes = await fetch(`https://${STORE_URL}/admin/api/${API_VERSION}/graphql.json`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Shopify-Access-Token": token },
      body: JSON.stringify({
        query: `query($id: ID!) { page(id: $id) { id handle title isPublished } }`,
        variables: { id: oldId }
      }),
    });
    const checkJson = await checkRes.json();
    if (checkJson.data?.page) {
      console.log(`  OLD ${oldId}: STILL EXISTS - ${checkJson.data.page.handle} (published: ${checkJson.data.page.isPublished})`);
    } else {
      console.log(`  OLD ${oldId}: DELETED (null)`);
    }
  }

  // Check the NEW page IDs
  console.log("\nNew page IDs:");
  const newIds = [
    "gid://shopify/Page/153662980393",   // new contact-us
    "gid://shopify/Page/153662783785",    // new about-us
    "gid://shopify/Page/153662849321",    // new faqs
  ];

  for (const newId of newIds) {
    const checkRes = await fetch(`https://${STORE_URL}/admin/api/${API_VERSION}/graphql.json`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Shopify-Access-Token": token },
      body: JSON.stringify({
        query: `query($id: ID!) { page(id: $id) { id handle title body isPublished } }`,
        variables: { id: newId }
      }),
    });
    const checkJson = await checkRes.json();
    if (checkJson.data?.page) {
      const p = checkJson.data.page;
      console.log(`  NEW ${newId}: ${p.handle} (published: ${p.isPublished}, body starts: ${p.body?.substring(0, 60)})`);
    } else {
      console.log(`  NEW ${newId}: NOT FOUND`);
    }
  }
}
main().catch(console.error);
