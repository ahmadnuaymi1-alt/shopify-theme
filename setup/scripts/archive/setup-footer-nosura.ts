/**
 * setup-footer-nosura.ts
 * Configures the Nosura store footer (Horizon theme) with a proper layout:
 * - About/contact info
 * - Policies menu
 * - Info menu
 * - Email signup (preserved from existing)
 */

import { loadConfig } from "./src/config/store-config.js";

const API_VERSION = "2025-01";
const config = await loadConfig("Nosura");
if (!config) { console.error("No config"); process.exit(1); }

const STORE = config.shopifyStoreUrl;

async function getToken(): Promise<string> {
  const res = await fetch(`https://${STORE}/admin/oauth/access_token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `grant_type=client_credentials&client_id=${config!.shopifyClientId}&client_secret=${config!.shopifyClientSecret}`,
  });
  return ((await res.json()) as any).access_token;
}

async function main() {
  const token = await getToken();
  console.log("[OK] Got access token");

  // Get main theme
  const themesRes = await fetch(`https://${STORE}/admin/api/${API_VERSION}/themes.json`, {
    headers: { "X-Shopify-Access-Token": token },
  });
  const mainTheme = (await themesRes.json() as any).themes.find((t: any) => t.role === "main");
  const themeId = mainTheme.id;
  console.log(`[OK] Theme: ${mainTheme.name} (${themeId})`);

  // Read current footer-group.json
  const assetRes = await fetch(
    `https://${STORE}/admin/api/${API_VERSION}/themes/${themeId}/assets.json?asset[key]=${encodeURIComponent("sections/footer-group.json")}`,
    { headers: { "X-Shopify-Access-Token": token } }
  );
  const footerGroup = JSON.parse((await assetRes.json() as any).asset.value);
  console.log("[OK] Read footer-group.json");

  // Find the footer section key
  const footerKey = Object.keys(footerGroup.sections).find(k =>
    footerGroup.sections[k].type === "footer"
  );
  if (!footerKey) throw new Error("No footer section found");
  console.log(`[OK] Footer section key: ${footerKey}`);

  const currentFooter = footerGroup.sections[footerKey];
  const preservedSettings = { ...currentFooter.settings };

  // Build contact info HTML
  const addr = config!.businessAddress;
  const fullAddress = `${addr.street}, ${addr.city}, ${addr.state}, ${addr.zip}, ${addr.country}`;
  const encodedAddress = encodeURIComponent(fullAddress);
  const phoneDigits = config!.supportPhone.replace(/[^0-9+]/g, "");

  const contactHtml = `<p><strong>${config!.storeName}</strong></p><p>${fullAddress}</p><p><a href="mailto:${config!.supportEmail}">${config!.supportEmail}</a></p><p><a href="tel:${phoneDigits}">${config!.supportPhone}</a></p><p>${config!.customerServiceHours}</p>`;

  // Build new footer structure for Horizon theme
  // Using: group (with text blocks for about), menu blocks for nav, email-signup
  const newFooter = {
    type: "footer",
    blocks: {
      // Group 1: About info with contact details
      "group_about": {
        type: "group",
        settings: {
          "content_direction": "column",
          "vertical_on_mobile": true,
          "horizontal_alignment": "flex-start",
          "vertical_alignment": "center",
          "align_baseline": false,
          "horizontal_alignment_flex_direction_column": "flex-start",
          "vertical_alignment_flex_direction_column": "center",
          "gap": 4,
          "width": "fill",
          "custom_width": 100,
          "width_mobile": "fill",
          "custom_width_mobile": 100,
          "height": "fit",
          "custom_height": 100,
          "inherit_color_scheme": true,
          "color_scheme": "",
          "background_media": "none",
          "border": "none",
          "border_width": 1,
          "border_opacity": 100,
          "border_radius": 0,
          "toggle_overlay": false,
          "link": "",
          "open_in_new_tab": false,
          "padding-block-start": 0,
          "padding-block-end": 0,
          "padding-inline-start": 0,
          "padding-inline-end": 0,
        },
        blocks: {
          "text_about_heading": {
            type: "text",
            settings: {
              text: `<h2>About ${config!.storeName}</h2>`,
              "width": "100%",
              "max_width": "normal",
              "alignment": "left",
              "type_preset": "h4",
              "font_size": "1rem",
              "line_height": "normal",
              "letter_spacing": "normal",
              "case": "none",
              "wrap": "pretty",
              "padding-block-start": 0,
              "padding-block-end": 0,
              "padding-inline-start": 0,
              "padding-inline-end": 0,
            },
            blocks: {},
          },
          "text_about_contact": {
            type: "text",
            settings: {
              text: contactHtml,
              "width": "100%",
              "max_width": "normal",
              "alignment": "left",
              "type_preset": "rte",
              "font_size": "1rem",
              "line_height": "normal",
              "letter_spacing": "normal",
              "case": "none",
              "wrap": "pretty",
              "padding-block-start": 0,
              "padding-block-end": 0,
              "padding-inline-start": 0,
              "padding-inline-end": 0,
            },
            blocks: {},
          },
        },
        block_order: ["text_about_heading", "text_about_contact"],
      },
      // Menu: Policies
      "menu_policies": {
        type: "menu",
        settings: {
          menu: "policies",
          "width": "fit",
          "custom_width": 100,
          "width_mobile": "fill",
          "custom_width_mobile": 100,
          "heading_preset": "h4",
          "link_preset": "paragraph",
          "padding-block-start": 0,
          "padding-block-end": 0,
          "padding-inline-start": 0,
          "padding-inline-end": 0,
        },
        blocks: {},
      },
      // Menu: Info
      "menu_info": {
        type: "menu",
        settings: {
          menu: "info",
          "width": "fit",
          "custom_width": 100,
          "width_mobile": "fill",
          "custom_width_mobile": 100,
          "heading_preset": "h4",
          "link_preset": "paragraph",
          "padding-block-start": 0,
          "padding-block-end": 0,
          "padding-inline-start": 0,
          "padding-inline-end": 0,
        },
        blocks: {},
      },
      // Email signup group (preserved concept from original)
      "group_signup": {
        type: "group",
        settings: {
          "content_direction": "column",
          "vertical_on_mobile": true,
          "horizontal_alignment": "flex-start",
          "vertical_alignment": "center",
          "align_baseline": false,
          "horizontal_alignment_flex_direction_column": "flex-start",
          "vertical_alignment_flex_direction_column": "center",
          "gap": 6,
          "width": "fill",
          "custom_width": 100,
          "width_mobile": "fill",
          "custom_width_mobile": 100,
          "height": "fit",
          "custom_height": 100,
          "inherit_color_scheme": true,
          "color_scheme": "",
          "background_media": "none",
          "border": "none",
          "border_width": 1,
          "border_opacity": 100,
          "border_radius": 0,
          "toggle_overlay": false,
          "link": "",
          "open_in_new_tab": false,
          "padding-block-start": 0,
          "padding-block-end": 0,
          "padding-inline-start": 0,
          "padding-inline-end": 0,
        },
        blocks: {
          "text_signup_heading": {
            type: "text",
            settings: {
              text: "<h2>Join our email list</h2>",
              "width": "100%",
              "max_width": "normal",
              "alignment": "left",
              "type_preset": "h4",
              "font_size": "1rem",
              "line_height": "normal",
              "letter_spacing": "normal",
              "case": "none",
              "wrap": "pretty",
              "padding-block-start": 0,
              "padding-block-end": 0,
              "padding-inline-start": 0,
              "padding-inline-end": 0,
            },
            blocks: {},
          },
          "text_signup_desc": {
            type: "text",
            settings: {
              text: "<p>Get exclusive deals and early access to new products.</p>",
              "width": "100%",
              "max_width": "normal",
              "alignment": "left",
              "type_preset": "rte",
              "font_size": "1rem",
              "line_height": "normal",
              "letter_spacing": "normal",
              "case": "none",
              "wrap": "pretty",
              "padding-block-start": 0,
              "padding-block-end": 0,
              "padding-inline-start": 0,
              "padding-inline-end": 0,
            },
            blocks: {},
          },
        },
        block_order: ["text_signup_heading", "text_signup_desc"],
      },
      // Email signup form
      "email_signup_form": {
        type: "email-signup",
        settings: {
          "width": "fill",
          "custom_width": 100,
          "inherit_color_scheme": true,
          "heading": "",
          "heading_preset": "h3",
          "color_scheme": "",
          "border_style": "all",
          "border_width": 1,
          "border_radius": 100,
          "input_type_preset": "paragraph",
          "style_class": "button-unstyled",
          "display_type": "arrow",
          "label": "Sign up",
          "integrated_button": true,
          "button_type_preset": "paragraph",
          "padding-block-start": 0,
          "padding-block-end": 0,
          "padding-inline-start": 0,
          "padding-inline-end": 0,
        },
        blocks: {},
      },
    },
    block_order: [
      "group_about",
      "menu_policies",
      "menu_info",
      "group_signup",
      "email_signup_form",
    ],
    name: "t:names.footer",
    settings: preservedSettings,
  };

  // Replace footer section
  footerGroup.sections[footerKey] = newFooter;

  // Write back
  console.log("\n--- Writing updated footer-group.json ---");
  const writeRes = await fetch(
    `https://${STORE}/admin/api/${API_VERSION}/themes/${themeId}/assets.json`,
    {
      method: "PUT",
      headers: {
        "X-Shopify-Access-Token": token,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        asset: {
          key: "sections/footer-group.json",
          value: JSON.stringify(footerGroup, null, 2),
        },
      }),
    }
  );
  const writeData = await writeRes.json() as any;
  if (writeData.errors) {
    console.error("ERROR:", JSON.stringify(writeData.errors));
  } else {
    console.log("[OK] Footer updated successfully!");
    console.log("\nFooter layout:");
    console.log("  1. About group (store name + contact info)");
    console.log("  2. Policies menu");
    console.log("  3. Info menu");
    console.log("  4. Email signup group + form");
  }
}

main().catch(err => {
  console.error("FATAL:", err);
  process.exit(1);
});
