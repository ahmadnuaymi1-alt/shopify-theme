# Shrine Store Setup

You are setting up a new Shopify store using the Shrine PRO theme, based on the KindClouds.com template.

## Step 1: Gather Store Details

Ask the user for:
1. **Store name** (e.g., "Nosura", "PetPals") — this replaces "Kind Clouds" in all template text
2. **Project directory** (e.g., `C:/Users/pc/Downloads/Claude Code Projects/StoreName/`) — where the Shrine theme files live
3. **Shopify store URL** (e.g., `abc123.myshopify.com`) — needed for metafield API setup

## Step 2: Color Scheme Choice

Ask the user which color scheme they want:

**Option A: Use KindClouds colors (default)**
- Accent 1: `#6AAFE6` (blue)
- Accent 2: `#F8A4B8` (coral pink)
- Text: `#2D3436`
- Background 1: `#FFFFFF`
- Background 2: `#F5F7FA`
- Footer: dark charcoal `#2D3436` with white text

**Option B: Custom colors**
- Ask for: primary accent color, secondary accent color, background color, text color
- Generate an HTML preview file at `temp/previews/store-preview.html` showing the KindClouds homepage layout with the user's chosen colors
- The preview should be a self-contained HTML file the user can open in Chrome to review
- The preview must show: header bar, hero section, trust icons row, comparison table, featured products grid, FAQ accordion, and footer — all styled with the user's chosen colors
- Wait for user approval before proceeding

## Step 3: Deploy the Template

### 3a: Copy Homepage Template
Read the template from `.claude/templates/kindclouds/homepage.json` (relative to the Shrine project at `C:/Users/pc/Downloads/Claude Code Projects/Shopify Theme/`).

Write it to `{project_directory}/templates/index.json`.

**Text replacements** (case-insensitive):
- "Kind Clouds" → store name
- "kind clouds" → store name (lowercase)
- "KindClouds" → store name (no spaces)
- Update the hero subtitle to be generic: "Discover thoughtfully chosen products designed to bring comfort, joy, and ease into everyday life."
- Update FAQ answers to be generic (remove specific Kind Clouds references)
- Update email signup text to be generic

### 3b: Copy Product Page Template
Read from `.claude/templates/kindclouds/product-page.json`.
Write to `{project_directory}/templates/product.json`.
No text replacements needed (product page uses metafields, not hardcoded text).

### 3c: Apply Theme Settings
Read the store's existing `{project_directory}/config/settings_data.json`.
Read the template settings from `.claude/templates/kindclouds/theme-settings.json`.

Update `settings_data.json` with KindClouds values for:
- **Colors**: Apply the chosen color scheme (KindClouds defaults or custom)
- **Typography**: Set Bogue Bold headings + Poppins body (heading_font_preset: "bogue_bold", type_body_font: "poppins_n4")
- **Layout**: 1400px page width, 12px card radius, 6px button radius
- **Cart**: drawer type, bag_2 icon, timer + progress bar enabled
- **Header**: sticky on scroll-up, main-menu
- **Footer**: dark background with white text, email signup, quick links

If custom colors were chosen, replace these values:
- `colors_accent_1` → user's primary accent
- `colors_accent_2` → user's secondary accent
- `colors_text` → user's text color
- `colors_background_1` → user's background color
- `colors_outline_button_labels` → user's primary accent
- `checkout_accent_color` → user's primary accent
- `checkout_button_color` → user's primary accent

Keep all other settings in settings_data.json unchanged (don't overwrite section-specific settings that are already configured).

### 3d: Ensure Required Section Files Exist
Check that these section files exist in `{project_directory}/sections/`:
- `ss-waves.liquid`
- `ss-wave-2.liquid`
- `section-divider.liquid`
- `ss-feature-13.liquid`
- `image-with-text.liquid`
- `product-image-with-text.liquid` (if it exists in the theme)
- `product-features.liquid` (if it exists in the theme)
- `product-faq.liquid` (if it exists in the theme)

If any are missing, copy them from the Shrine project at `C:/Users/pc/Downloads/Claude Code Projects/Shopify Theme/sections/`.

### 3e: Set Up Metafields
Read the metafield definitions from `.claude/templates/kindclouds/metafields.json`.

Follow the standard metafield setup workflow:
1. Ask the user if they already have a custom app set up on the store (Settings → Apps → Develop apps)
2. If not, guide them through creating one with `read_products` + `write_products` scopes
3. Get the Client ID and Client Secret from the user
4. Get an access token via OAuth client_credentials flow:
   ```
   POST https://{shop}.myshopify.com/admin/oauth/access_token
   Content-Type: application/x-www-form-urlencoded
   grant_type=client_credentials&client_id={CLIENT_ID}&client_secret={CLIENT_SECRET}
   ```
5. Create all 23 metafield definitions using the GraphQL Admin API (`metafieldDefinitionCreate` mutation)
6. Use a node.js script (save to `temp/setup-metafields.js`) for batch creation

## Step 4: Commit and Push

Stage all changes, commit with message: "Apply KindClouds template to {store_name}", and push to deploy via GitHub → Shopify integration.

## Step 5: Summary

Tell the user what was done:
- Homepage: X sections deployed (list them)
- Product page: X sections deployed (list them)
- Color scheme: KindClouds default / Custom (show the colors)
- Typography: Bogue Bold + Poppins
- Metafields: 23 definitions created (or skipped if already exist)
- Next steps: Add products, fill in metafields, upload logo via theme editor image picker

## Important Notes
- NEVER hardcode images into Liquid files — always use image picker settings in the theme editor
- The Bogue Bold font woff2 must be uploaded to the store's Files (Content → Files) if not already there
- The CDN URL for Bogue Bold is: `https://cdn.shopify.com/s/files/1/0806/7013/0415/files/boguebold.woff2?v=1773219257`
  - This URL is from the KindClouds store — for a new store, the user needs to upload boguebold.woff2 and get a fresh CDN URL
  - The local font file is at: `C:/Users/pc/Downloads/Claude Code Projects/Shopify Theme/Bogue-Font/boguebold.woff2`
- Always `git pull --rebase origin main` before pushing to avoid conflicts with Shopify auto-sync
