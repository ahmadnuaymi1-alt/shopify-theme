/**
 * Investigation script: Query Shopify pages to check stored body HTML
 * and inspect theme templates.
 *
 * Run with: node investigate-pages.mjs
 */

const STORE_URL = "royal-reform.myshopify.com";
const CLIENT_ID = "675547b76119d11fd0f6f2ba8cee5446";
const CLIENT_SECRET = "REDACTED";
const API_VERSION = "2025-01";

// --- Get access token ---
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

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Failed to get token (HTTP ${response.status}): ${body}`);
  }

  const data = await response.json();
  console.log(`[OK] Access token obtained (expires in ${Math.round(data.expires_in / 60)} min)\n`);
  return data.access_token;
}

// --- GraphQL query helper ---
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

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`GraphQL HTTP ${response.status}: ${body}`);
  }

  const json = await response.json();
  if (json.errors) {
    console.error("GraphQL Errors:", JSON.stringify(json.errors, null, 2));
  }
  return json.data;
}

// ============================================================
// STEP 1: Query all pages and their body HTML
// ============================================================
async function investigatePages(token) {
  console.log("=" .repeat(70));
  console.log("STEP 1: Query page content from Shopify API");
  console.log("=" .repeat(70));

  // Query all pages
  const data = await gql(token, `
    {
      pages(first: 50) {
        edges {
          node {
            id
            title
            handle
            bodySummary
            body
            templateSuffix
            createdAt
            updatedAt
          }
        }
      }
    }
  `);

  const pages = data.pages.edges.map(e => e.node);
  console.log(`\nFound ${pages.length} pages total.\n`);

  const targetHandles = ["about-us", "contact-us", "faqs"];

  for (const page of pages) {
    const isTarget = targetHandles.includes(page.handle);
    const marker = isTarget ? " *** TARGET ***" : "";

    console.log(`--- Page: "${page.title}" (handle: ${page.handle})${marker} ---`);
    console.log(`  ID: ${page.id}`);
    console.log(`  Template suffix: ${page.templateSuffix || "(none/default)"}`);
    console.log(`  Updated: ${page.updatedAt}`);
    console.log(`  Body length: ${page.body ? page.body.length : 0} chars`);
    console.log(`  Body summary: ${page.bodySummary ? page.bodySummary.substring(0, 100) + "..." : "(empty)"}`);

    if (isTarget) {
      console.log(`  Body (first 500 chars):`);
      console.log(`  ${page.body ? page.body.substring(0, 500) : "(EMPTY BODY!)"}`);
    }
    console.log();
  }

  return pages;
}

// ============================================================
// STEP 2: Investigate themes and templates
// ============================================================
async function investigateThemes(token) {
  console.log("=" .repeat(70));
  console.log("STEP 2: Query themes");
  console.log("=" .repeat(70));

  const data = await gql(token, `
    {
      themes(first: 10) {
        edges {
          node {
            id
            name
            role
            processing
          }
        }
      }
    }
  `);

  const themes = data.themes.edges.map(e => e.node);
  console.log(`\nFound ${themes.length} themes:\n`);

  let mainThemeId = null;
  for (const theme of themes) {
    console.log(`  ${theme.name} — role: ${theme.role}, id: ${theme.id}`);
    if (theme.role === "MAIN") {
      mainThemeId = theme.id;
      console.log(`    ^ This is the ACTIVE theme`);
    }
  }

  return mainThemeId;
}

// ============================================================
// STEP 3: Read theme template files
// ============================================================
async function investigateThemeTemplates(token, themeId) {
  console.log("\n" + "=" .repeat(70));
  console.log("STEP 3: Read theme template files for pages");
  console.log("=" .repeat(70));

  // List all theme files (assets) related to pages
  // We need to check templates/page.json, templates/page.liquid,
  // and any custom page templates like page.about-us.json

  const filesToCheck = [
    "templates/page.json",
    "templates/page.liquid",
    "templates/page.about-us.json",
    "templates/page.about-us.liquid",
    "templates/page.contact-us.json",
    "templates/page.contact-us.liquid",
    "templates/page.contact.json",
    "templates/page.contact.liquid",
    "templates/page.faqs.json",
    "templates/page.faqs.liquid",
    "templates/page.faq.json",
    "templates/page.faq.liquid",
    "sections/main-page.liquid",
    "sections/page-template.liquid",
  ];

  // Use the theme files API to read each file
  for (const filePath of filesToCheck) {
    console.log(`\nChecking: ${filePath}`);
    try {
      const data = await gql(token, `
        query GetThemeFile($themeId: ID!, $filenames: [String!]!) {
          theme(id: $themeId) {
            files(filenames: $filenames) {
              nodes {
                filename
                size
                body {
                  ... on OnlineStoreThemeFileBodyText {
                    content
                  }
                  ... on OnlineStoreThemeFileBodyBase64 {
                    contentBase64
                  }
                }
              }
            }
          }
        }
      `, { themeId, filenames: [filePath] });

      const files = data?.theme?.files?.nodes || [];
      if (files.length === 0) {
        console.log(`  -> Not found`);
      } else {
        for (const f of files) {
          console.log(`  -> Found! Size: ${f.size} bytes`);
          const content = f.body?.content || "(binary/base64)";
          console.log(`  Content:\n${content}`);
        }
      }
    } catch (err) {
      console.log(`  -> Error: ${err.message}`);
    }
  }
}

// ============================================================
// STEP 4: List ALL template files to find any custom page templates
// ============================================================
async function listAllTemplates(token, themeId) {
  console.log("\n" + "=" .repeat(70));
  console.log("STEP 4: List ALL template files in theme");
  console.log("=" .repeat(70));

  try {
    const data = await gql(token, `
      query ListThemeFiles($themeId: ID!) {
        theme(id: $themeId) {
          files(first: 250, filenames: ["templates/*"]) {
            nodes {
              filename
              size
            }
          }
        }
      }
    `, { themeId });

    const files = data?.theme?.files?.nodes || [];
    console.log(`\nTemplate files found: ${files.length}`);
    for (const f of files) {
      console.log(`  ${f.filename} (${f.size} bytes)`);
    }
  } catch (err) {
    console.log(`Error listing templates: ${err.message}`);

    // Try alternative approach - list all files
    console.log("\nTrying alternative: query theme files with asset approach...");
    try {
      const data2 = await gql(token, `
        query ListAllThemeFiles($themeId: ID!) {
          theme(id: $themeId) {
            files(first: 250) {
              nodes {
                filename
                size
              }
            }
          }
        }
      `, { themeId });

      const files2 = data2?.theme?.files?.nodes || [];
      console.log(`\nAll theme files: ${files2.length}`);
      const templateFiles = files2.filter(f => f.filename.startsWith("templates/") || f.filename.startsWith("sections/"));
      console.log(`\nTemplate & section files:`);
      for (const f of templateFiles) {
        console.log(`  ${f.filename} (${f.size} bytes)`);
      }
    } catch (err2) {
      console.log(`Alternative also failed: ${err2.message}`);
    }
  }
}

// ============================================================
// Main
// ============================================================
async function main() {
  const token = await getAccessToken();

  const pages = await investigatePages(token);
  const mainThemeId = await investigateThemes(token);

  if (mainThemeId) {
    await investigateThemeTemplates(token, mainThemeId);
    await listAllTemplates(token, mainThemeId);
  } else {
    console.log("\nERROR: Could not find main theme!");
  }
}

main().catch(err => {
  console.error("Fatal error:", err);
  process.exit(1);
});
