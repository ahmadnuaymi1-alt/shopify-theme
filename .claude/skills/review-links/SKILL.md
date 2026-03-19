---
name: review-links
description: Verify all hyperlinks in live Shopify pages go to the correct destinations. Run after pushing content.
allowed-tools: Read, Grep, Glob, Agent, WebFetch
---

# Hyperlink Checker

Verify every hyperlink that exists on the pushed Shopify pages goes to the correct destination.

## Important Rules

- ONLY check links that already exist on the pages. Do NOT look for missing hyperlinks.
- Do NOT suggest adding new hyperlinks. Only validate existing ones.

## What to Check

For each page, extract all hyperlinks and verify:

1. **mailto: links** — email address is correct (should match the store's `supportEmail` from config)
2. **tel: links** — phone number is correct (should match the store's `supportPhone` from config)
3. **Internal page links** (`/pages/...`) — fetch the destination URL and confirm the page exists (doesn't 404)
4. **Internal policy links** (`/policies/...`) — fetch the destination URL and confirm it exists
5. **Google Maps links** — confirm they contain the correct store address
6. **External links** — confirm they load successfully

## How to Check

Use an Agent with WebFetch to:
1. Fetch each page and extract all `<a href="...">` links
2. For internal links, fetch `https://{store-url}{path}` and check for 404
3. For mailto/tel links, verify the address/number matches the config
4. For Google Maps links, verify the encoded address matches

Get the store URL and contact details from the config file in `setup/configs/`.

## Pages to Check

If `$ARGUMENTS` is provided, check those specific URLs. Otherwise check all:
- All 4 policy pages (`/policies/...`)
- All info pages (`/pages/...`)

## Report Format

For each page, list:
| Link | Type | Status |
|------|------|--------|
| the URL | mailto/tel/internal/external | OK or BROKEN with details |
