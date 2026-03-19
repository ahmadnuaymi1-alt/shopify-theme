# Unified Store Setup (A-Z)

You are setting up a complete Shopify store from scratch — theme, content, policies, menus, and GMC compliance — all in one workflow.

## Step 1: Gather Store Details

Ask the user for:
1. **Store name** (e.g., "Kind Clouds", "Nosura")
2. **Shopify store URL** (e.g., `abc123.myshopify.com`)
3. **Project directory** for the theme files (e.g., `C:/Users/pc/Downloads/Claude Code Projects/StoreName/`)

Then ask: "Do you already have a store config in `setup/configs/`? If not, I'll create one."

## Step 2: Create Store Config

If no config exists, create `setup/configs/{store-slug}.json` using the template at `setup/configs/_template.json`.

Ask the user to fill in:
- Business entity name, address, phone, email
- Shopify app Client ID and Client Secret (from Settings → Apps → Develop apps)
- Shipping details (handling time, transit time, carriers)
- Return/refund policy details (return window, refund processing time, restocking fee)
- Payment methods and currency

Validate that all required fields are filled before proceeding.

## Step 3: Deploy Theme (via /shrine-store)

Run the existing `/shrine-store` command which handles:
- Color scheme selection (KindClouds defaults or custom)
- Homepage template deployment
- Product page template deployment
- Theme settings (typography, layout, cart, header, footer)
- Section files deployment
- Metafield definitions (23 product metafields)

## Step 4: Push Backend Content

Navigate to the `setup/` directory and run the content automation scripts:

```bash
cd setup && npm install
```

### 4a: Push All Content (policies, pages, menus)
```bash
npx tsx run-all-content.ts "{Store Name}"
```

This creates:
- **9 policies/pages**: Privacy Policy, Terms of Service, Refund Policy, Shipping Policy, Payment Policy, About Us, Contact Us, FAQ, Track Your Order
- All pages use the store config values for addresses, shipping times, etc.
- All internal references are hyperlinked (contact page, tracking page, email addresses)

### 4b: Create Menus & Redirects
```bash
npx tsx create-menus-and-redirects.ts "{Store Name}"
```

This creates:
- **Main menu**: Home, Shop, About, Contact, Track Order
- **Footer menu**: Privacy Policy, Terms, Refund Policy, Shipping Policy, Payment Policy, FAQ
- **URL redirects** for common Shopify 404 pages (`/collections/vendors`, `/collections/types`, etc.)

### 4c: Set Up Footer
```bash
npx tsx setup-footer.ts "{Store Name}"
```

Configures the footer with:
- 4-column layout (About, Policies, Info, Brand)
- Email signup section
- Payment icons
- Copyright with business entity name

### 4d: Fix Theme Settings
```bash
npx tsx fix-theme.ts "{Store Name}"
```

Applies GMC-compliant theme settings:
- Disable right-click protection
- Remove social media links (add later when socials are established)
- Set proper font sizes
- Tighten spacing/layout

## Step 5: Push Product Template via API

Templates don't sync via Git — push directly via Shopify API:

```bash
npx tsx src/shopify/push-template.ts "{Store Name}"
```

Or use the API manually:
```
PUT /admin/api/2024-01/themes/{theme_id}/assets.json
{ "asset": { "key": "templates/product.sections.json", "value": "..." } }
```

## Step 6: Assign Metafields to Products

Once products are imported:
```bash
npx tsx assign-metafields.ts "{Store Name}"
```

This uses AI to generate unique product descriptions, features, and FAQ content for each product.

## Step 7: Validate Everything

### 7a: Content Validation
```bash
npx tsx validate-content.ts "{Store Name}"
```

Checks all pages for:
- Missing hyperlinks
- Placeholder text
- Formatting issues
- Policy consistency

### 7b: Run Store Review Skills
Use the built-in review skills:
- `/check-store` — Full exhaustive review (content + visual + links)
- `/review-content` — Content quality and GMC compliance
- `/review-links` — Verify all hyperlinks work
- `/review-visual` — Visual inspection via Playwright

## Step 8: Commit and Deploy

```bash
git add -A
git commit -m "Set up {Store Name} store"
git push origin main
```

Remember: `.liquid` files deploy via Git, but template JSON files need the API push from Step 5.

## Step 9: Post-Setup Checklist

Tell the user what's done and what remains:

### Automated (done):
- [ ] Homepage template deployed
- [ ] Product page template deployed
- [ ] Color scheme + typography applied
- [ ] 23 metafield definitions created
- [ ] All policies and pages pushed
- [ ] Menus created (main + footer)
- [ ] URL redirects for common 404s
- [ ] Footer configured
- [ ] Theme settings optimized for GMC

### Manual (user must do):
- [ ] Upload logo via theme editor image picker
- [ ] Upload Bogue Bold font to Files (Content → Files)
- [ ] Add products to store
- [ ] Fill in product metafields (or use assign-metafields script)
- [ ] Create collections for each product type
- [ ] Install Microsoft Clarity app
- [ ] Set up GMC with matching business address
- [ ] Connect Google Ads once products are approved (green)

## GMC Tips (from Terry's advice)
- Remove social media links until socials have ~50 posts and ~100 followers each
- Ensure GMC business address matches store address EXACTLY (even "USA" vs "United States" matters)
- Add response time under customer service hours
- Hyperlink everything in policies (emails, contact page, tracking page)
- Remove excessive spacing and line breaks in policy text
- Don't disable right-click (Google reviewers need to copy text)

## Important Notes
- NEVER hardcode images — always use theme editor image pickers
- Templates must be pushed via API, not Git
- Always `git pull --rebase` before pushing to avoid Shopify sync conflicts
- Store configs contain secrets — they are gitignored (only `_template.json` is tracked)
