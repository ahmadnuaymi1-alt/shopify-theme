/**
 * Investigation Part 2: Check theme templates via REST API
 * and try to fix page template assignments.
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
  if (json.errors) console.error("GraphQL Errors:", JSON.stringify(json.errors, null, 2));
  return json;
}

async function restGet(token, path) {
  const url = `https://${STORE_URL}/admin/api/${API_VERSION}/${path}`;
  const response = await fetch(url, {
    headers: { "X-Shopify-Access-Token": token },
  });
  if (!response.ok) {
    const body = await response.text();
    console.error(`REST GET ${path} -> HTTP ${response.status}: ${body}`);
    return null;
  }
  return response.json();
}

async function main() {
  const token = await getAccessToken();

  // -----------------------------------------------------------
  // Try REST API for themes
  // -----------------------------------------------------------
  console.log("=" .repeat(70));
  console.log("Trying REST API for themes...");
  console.log("=" .repeat(70));

  const themesData = await restGet(token, "themes.json");
  if (themesData) {
    console.log(`\nFound ${themesData.themes.length} themes:`);
    let mainThemeId = null;
    for (const theme of themesData.themes) {
      console.log(`  ${theme.name} — role: ${theme.role}, id: ${theme.id}`);
      if (theme.role === "main") mainThemeId = theme.id;
    }

    if (mainThemeId) {
      console.log(`\nMain theme ID: ${mainThemeId}`);

      // List theme assets
      console.log("\n--- Theme assets (templates only) ---");
      const assetsData = await restGet(token, `themes/${mainThemeId}/assets.json`);
      if (assetsData) {
        const templateAssets = assetsData.assets.filter(a =>
          a.key.startsWith("templates/page") || a.key.startsWith("sections/main-page")
        );
        console.log(`\nPage-related template assets:`);
        for (const asset of templateAssets) {
          console.log(`  ${asset.key}`);
        }

        // Read each page template
        for (const asset of templateAssets) {
          console.log(`\n--- Reading: ${asset.key} ---`);
          const assetData = await restGet(token, `themes/${mainThemeId}/assets.json?asset[key]=${encodeURIComponent(asset.key)}`);
          if (assetData && assetData.asset) {
            console.log(assetData.asset.value || "(no value / binary)");
          }
        }

        // Also check for the main-page section
        const sectionAssets = assetsData.assets.filter(a =>
          a.key.includes("main-page") || a.key.includes("page-template") || a.key.includes("page.liquid")
        );
        console.log(`\n--- Section files related to pages ---`);
        for (const asset of sectionAssets) {
          if (templateAssets.find(t => t.key === asset.key)) continue; // skip already shown
          console.log(`\n--- Reading: ${asset.key} ---`);
          const assetData = await restGet(token, `themes/${mainThemeId}/assets.json?asset[key]=${encodeURIComponent(asset.key)}`);
          if (assetData && assetData.asset) {
            console.log(assetData.asset.value || "(no value / binary)");
          }
        }
      }
    }
  } else {
    console.log("REST themes API also denied. Trying GraphQL approach for theme access scopes...");
  }

  // -----------------------------------------------------------
  // Check current template suffix on target pages
  // -----------------------------------------------------------
  console.log("\n" + "=" .repeat(70));
  console.log("Current template suffixes on target pages:");
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
          }
        }
      }
    }
  `);

  const targetHandles = ["about-us", "contact-us", "faqs"];
  const pages = pagesResult.data.pages.edges.map(e => e.node);

  for (const page of pages) {
    if (targetHandles.includes(page.handle)) {
      console.log(`  ${page.handle}: templateSuffix = "${page.templateSuffix || "(null/default)"}"`);
      console.log(`    -> This means the theme uses: templates/page.${page.templateSuffix || "(default)"}.json`);
    }
  }

  // -----------------------------------------------------------
  // Check available access scopes
  // -----------------------------------------------------------
  console.log("\n" + "=" .repeat(70));
  console.log("Checking app access scopes...");
  console.log("=" .repeat(70));

  const scopesResult = await gql(token, `
    {
      app {
        installation {
          accessScopes {
            handle
          }
        }
      }
    }
  `);

  if (scopesResult.data?.app?.installation?.accessScopes) {
    const scopes = scopesResult.data.app.installation.accessScopes.map(s => s.handle);
    console.log(`\nAccess scopes (${scopes.length}):`);
    const themeScopes = scopes.filter(s => s.includes("theme"));
    console.log(`  Theme-related: ${themeScopes.length > 0 ? themeScopes.join(", ") : "NONE"}`);
    const pageScopes = scopes.filter(s => s.includes("page") || s.includes("content"));
    console.log(`  Page-related: ${pageScopes.length > 0 ? pageScopes.join(", ") : "NONE"}`);
    console.log(`  All scopes: ${scopes.join(", ")}`);
  }
}

main().catch(err => {
  console.error("Fatal:", err);
  process.exit(1);
});
