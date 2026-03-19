---
name: review-visual
description: Visually inspect live Shopify pages in a browser to check formatting, gaps, and appearance. Run after pushing content.
allowed-tools: Read, Grep, Glob, Agent
---

# Visual Inspector

Open each live page on the Shopify store in a browser and visually inspect formatting and appearance.

## What to Check

1. **Page loads** — no errors, content renders correctly
2. **No weird gaps** — no extra whitespace, double spacing, or paragraph gaps between lines that should be tight
3. **Text flow** — proper headings, paragraphs, and lists render naturally
4. **Contact block at bottom** — must be tight with no gaps between contact fields (Store Name, Address, Email, Number, Hours should be on consecutive lines, NOT separate paragraphs)
5. **Hyperlinks visually styled** — body links should appear bold + underlined. Contact block links should be underlined only (not bold)
6. **"Last updated" date** — visible at the top of each policy
7. **Overall professional appearance** — matches what you'd expect from a legitimate e-commerce store
8. **Cross-page consistency** — all pages follow the same formatting patterns

## How to Inspect

Use an Agent with Playwright MCP tools:
- `mcp__playwright__browser_navigate` to go to each URL
- `mcp__playwright__browser_snapshot` to read the page structure
- `mcp__playwright__browser_screenshot` to visually verify appearance
- Scroll to the bottom of each page to specifically check the Contact section

## Pages to Check

If `$ARGUMENTS` is provided, inspect those specific URLs. Otherwise inspect all policy pages:
- `https://{store-url}/policies/refund-policy`
- `https://{store-url}/policies/shipping-policy`
- `https://{store-url}/policies/privacy-policy`
- `https://{store-url}/policies/terms-of-service`

And all info pages:
- `https://{store-url}/pages/about-us`
- `https://{store-url}/pages/faqs`
- `https://{store-url}/pages/contact-us`
- `https://{store-url}/pages/track-your-order`
- `https://{store-url}/pages/billing-terms-and-conditions`

Get the store URL from the config file in `setup/configs/`.

Report any visual issues with screenshots if possible.
