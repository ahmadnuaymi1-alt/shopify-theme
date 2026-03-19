import { loadConfig } from "./src/config/store-config.js";

const API_VERSION = "2025-01";
const config = await loadConfig("Nosura");
if (!config) { console.error("No config"); process.exit(1); }

const STORE = config.shopifyStoreUrl;

const tokenRes = await fetch(`https://${STORE}/admin/oauth/access_token`, {
  method: "POST",
  headers: { "Content-Type": "application/x-www-form-urlencoded" },
  body: `grant_type=client_credentials&client_id=${config.shopifyClientId}&client_secret=${config.shopifyClientSecret}`,
});
const token = ((await tokenRes.json()) as any).access_token;

const themesRes = await fetch(`https://${STORE}/admin/api/${API_VERSION}/themes.json`, {
  headers: { "X-Shopify-Access-Token": token },
});
const themes = (await themesRes.json() as any).themes;
const mainTheme = themes.find((t: any) => t.role === "main");
const themeId = mainTheme.id;

// Read footer.liquid and extract full schema for menu and text blocks
const res = await fetch(
  `https://${STORE}/admin/api/${API_VERSION}/themes/${themeId}/assets.json?asset[key]=${encodeURIComponent("sections/footer.liquid")}`,
  { headers: { "X-Shopify-Access-Token": token } }
);
const data = await res.json() as any;
const schemaMatch = data.asset.value.match(/\{%[-\s]*schema\s*[-]?%\}([\s\S]*?)\{%[-\s]*endschema\s*[-]?%\}/);
if (schemaMatch) {
  const schema = JSON.parse(schemaMatch[1]);
  const menuBlock = schema.blocks.find((b: any) => b.type === "menu");
  const textBlock = schema.blocks.find((b: any) => b.type === "text");
  const groupBlock = schema.blocks.find((b: any) => b.type === "group");

  console.log("=== MENU block schema ===");
  console.log(JSON.stringify(menuBlock, null, 2));

  console.log("\n=== TEXT block schema ===");
  console.log(JSON.stringify(textBlock, null, 2));

  console.log("\n=== GROUP block schema ===");
  if (groupBlock) {
    // Just show settings and blocks, skip nested block details if too long
    console.log("Settings:", JSON.stringify(groupBlock.settings?.map((s: any) => ({ id: s.id, type: s.type, default: s.default })), null, 2));
    console.log("Nested block types:", groupBlock.blocks?.map((b: any) => b.type));
  }
}
