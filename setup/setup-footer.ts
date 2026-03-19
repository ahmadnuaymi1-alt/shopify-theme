/**
 * setup-footer.ts
 * Configures a Shopify store footer to a Vilvida-style 4-column layout
 * via the Shopify Asset API.
 *
 * Loads store config from configs/{store}.json and auto-detects the main theme.
 *
 * Run: npx tsx setup-footer.ts "Kind Clouds"
 */

import { loadConfig } from "./src/config/store-config.js";
import chalk from "chalk";

const API_VERSION = "2025-01";

const storeName = process.argv[2] || "Kind Clouds";
const config = await loadConfig(storeName);
if (!config) {
  console.error(chalk.red(`Config not found for ${storeName}`));
  process.exit(1);
}

const STORE = config.shopifyStoreUrl;
const CLIENT_ID = config.shopifyClientId;
const CLIENT_SECRET = config.shopifyClientSecret;

// ── helpers ──────────────────────────────────────────────────────────

let THEME_ID = "";

async function getAccessToken(): Promise<string> {
  const res = await fetch(
    `https://${STORE}/admin/oauth/access_token`,
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: `grant_type=client_credentials&client_id=${CLIENT_ID}&client_secret=${CLIENT_SECRET}`,
    }
  );
  const data = await res.json();
  if (!data.access_token) {
    throw new Error(`Failed to get access token: ${JSON.stringify(data)}`);
  }
  console.log("[OK] Got access token");
  return data.access_token as string;
}

async function getMainThemeId(token: string): Promise<string> {
  const url = `https://${STORE}/admin/api/${API_VERSION}/themes.json`;
  const res = await fetch(url, {
    headers: { "X-Shopify-Access-Token": token },
  });
  const data = await res.json();
  const mainTheme = data.themes.find((t: any) => t.role === "main");
  if (!mainTheme) throw new Error("No main theme found!");
  console.log(`[OK] Main theme: "${mainTheme.name}" (ID: ${mainTheme.id})`);
  return String(mainTheme.id);
}

async function readAsset(token: string, key: string): Promise<string> {
  const url = `https://${STORE}/admin/api/${API_VERSION}/themes/${THEME_ID}/assets.json?asset[key]=${encodeURIComponent(key)}`;
  const res = await fetch(url, {
    headers: { "X-Shopify-Access-Token": token },
  });
  const data = await res.json();
  if (data.errors) {
    throw new Error(`Error reading ${key}: ${JSON.stringify(data.errors)}`);
  }
  return data.asset.value as string;
}

async function writeAsset(token: string, key: string, value: string): Promise<void> {
  const url = `https://${STORE}/admin/api/${API_VERSION}/themes/${THEME_ID}/assets.json`;
  const res = await fetch(url, {
    method: "PUT",
    headers: {
      "X-Shopify-Access-Token": token,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      asset: { key, value },
    }),
  });
  const data = await res.json();
  if (data.errors) {
    throw new Error(`Error writing ${key}: ${JSON.stringify(data.errors)}`);
  }
  console.log(`[OK] Updated ${key}`);
}

// ── build footer content from config ─────────────────────────────────

function buildFooterAboutHtml(): string {
  const addr = config!.businessAddress;
  const fullAddress = `${addr.street}, ${addr.city}, ${addr.state}, ${addr.zip}, ${addr.country}`;
  const encodedAddress = encodeURIComponent(fullAddress);
  const phoneDigits = config!.supportPhone.replace(/[^0-9+]/g, "");

  return `<p>Store Name: ${config!.storeName}<br>Address: <a href="https://www.google.com/search?q=${encodedAddress}" target="_blank" title="Our Address">${fullAddress}</a><br>Email: <a href="mailto:${config!.supportEmail}" title="Email Us">${config!.supportEmail}</a><br>Number: <a href="tel:${phoneDigits}" title="Call Us">${config!.supportPhone}</a><br>Hours of Operation: ${config!.customerServiceHours}<br>We aim to respond to inquiries within ${config!.responseTime}.</p>`;
}

// ── main ─────────────────────────────────────────────────────────────

async function main() {
  const token = await getAccessToken();
  THEME_ID = await getMainThemeId(token);

  // Step 1 — Read current footer-group.json
  console.log("\n--- Reading current footer-group.json ---");
  const footerGroupRaw = await readAsset(token, "sections/footer-group.json");
  const footerGroup = JSON.parse(footerGroupRaw);
  console.log("[OK] Read sections/footer-group.json");

  const currentFooterSection = footerGroup.sections?.footer;
  if (!currentFooterSection) {
    throw new Error("Cannot find 'footer' key inside footer-group.json sections");
  }

  console.log("\nCurrent footer blocks:");
  for (const [id, block] of Object.entries(currentFooterSection.blocks as Record<string, any>)) {
    const disabled = block.disabled ? " [DISABLED]" : "";
    console.log(`  ${id}: type=${block.type}${disabled}`);
    if (block.settings) {
      for (const [k, v] of Object.entries(block.settings)) {
        const val = typeof v === "string" && v.length > 80 ? v.substring(0, 80) + "..." : v;
        console.log(`    ${k}: ${val}`);
      }
    }
  }
  console.log("  block_order:", currentFooterSection.block_order);
  console.log("  settings:", JSON.stringify(currentFooterSection.settings, null, 2));

  // Step 2 — Preserve section-level settings
  const preservedSettings = { ...currentFooterSection.settings };

  // Step 3 — Build the new 4-column footer
  // Detect block types from existing footer to match the theme
  console.log("\n--- Building new 4-column footer ---");

  const aboutBlockId = "a1b2c3d4-about-text-block";
  const policiesBlockId = "b2c3d4e5-policies-links";
  const infoBlockId = "c3d4e5f6-info-links";
  const brandBlockId = "d4e5f6g7-brand-statement";

  // Detect the existing section type from the theme
  const sectionType = currentFooterSection.type;
  console.log(`  Detected footer section type: "${sectionType}"`);

  // Check what block types the theme uses
  const existingBlocks = currentFooterSection.blocks || {};
  const firstBlock = Object.values(existingBlocks)[0] as any;
  const textBlockType = firstBlock?.type || "text";
  const linkBlockType = (Object.values(existingBlocks).find((b: any) => b.type === "link_list") as any)?.type || "link_list";
  console.log(`  Detected block types: text="${textBlockType}", links="${linkBlockType}"`);

  const newFooterSection = {
    type: sectionType,
    blocks: {
      [aboutBlockId]: {
        type: textBlockType,
        settings: {
          heading: "About",
          subtext: buildFooterAboutHtml(),
          width_desktop: 4,
          width_mobile: "2",
        },
      },
      [policiesBlockId]: {
        type: linkBlockType,
        settings: {
          heading: "Policies",
          menu: "policies",
          width_desktop: 2,
          width_mobile: "1",
        },
      },
      [infoBlockId]: {
        type: linkBlockType,
        settings: {
          heading: "Info",
          menu: "info",
          width_desktop: 2,
          width_mobile: "1",
        },
      },
      [brandBlockId]: {
        type: textBlockType,
        settings: {
          heading: `Welcome to ${config!.storeName}`,
          subtext: `<p>Thoughtfully curated ${config!.brandNiche} for the ones who matter most. We keep things simple, honest and reliable so you can shop with confidence.</p>`,
          width_desktop: 4,
          width_mobile: "2",
        },
      },
    },
    block_order: [aboutBlockId, policiesBlockId, infoBlockId, brandBlockId],
    settings: preservedSettings,
  };

  // Step 4 — Replace the footer section in the group
  footerGroup.sections.footer = newFooterSection;

  console.log("\nNew footer-group.json:");
  console.log(JSON.stringify(footerGroup, null, 2));

  // Step 5 — Write the updated footer-group.json
  console.log("\n--- Writing updated footer-group.json ---");
  await writeAsset(token, "sections/footer-group.json", JSON.stringify(footerGroup, null, 2));

  console.log("\n=== FOOTER CONFIGURATION COMPLETE ===");
  console.log("Footer now has 4 columns:");
  console.log("  1. About (rich_text)     — contact info with links");
  console.log("  2. Policies (menu)       — linked to 'policies' menu handle");
  console.log("  3. Info (menu)           — linked to 'info' menu handle");
  console.log("  4. Welcome (rich_text)   — brand blurb");
  console.log("\nPreserved section-level settings:");
  console.log(JSON.stringify(preservedSettings, null, 2));
}

main().catch((err) => {
  console.error("FATAL:", err);
  process.exit(1);
});
