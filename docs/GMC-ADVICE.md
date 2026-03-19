# Google Merchant Centre — Advice & Best Practices

Consolidated from Terry's store review (GMC Scout) and hands-on experience across multiple stores.

## Store Design & Layout

- **Tighten spacing** — everything should be condensed, no excessive gaps between sections
- **Reduce font sizes** — headers and body text shouldn't be oversized; check on mobile too
- **Disable right-click protection** — Google reviewers need to copy text for checks
- **Remove social media links** on new stores until socials are established (~50 posts, ~100 followers per platform, ~3 months old)

## Policy Pages

- **Hyperlink everything**: email addresses, "Contact Us", "Track Your Order", FAQ references to other pages
- **Remove excessive line breaks** and horizontal separators (looks like AI-generated content)
- **Center and constrain text width** for readability
- **Include restocking fee** in Refund Policy (even if $0) — GMC requires it
- **Clarify tax handling** in Payment Policy — "prices include VAT" or "taxes calculated at checkout" must be explicit
- **Shipping policy must match GMC settings exactly**: cutoff time, handling time, transit time, ETA

## Customer Service

- If listing customer service hours, **also show response time** (e.g., "Response time: 1 to 2 business days")
- Full contact info: email, phone, hours, response time

## Navigation

- **All product types must be navigable** via the header menu — use a "Collections" dropdown
- Create Shopify collections for every product type (bedding, lamps, cutlery, etc.)
- "Discover our catalog" links should go to a collections page, not just /collections/all

## About Us Page

- Must present a **brand story** with real substance (not just 2-3 sentences)
- Include mission, values, founding story (even if fictional)
- Makes the store look established and trustworthy

## GMC Account Settings

- **Business address must match the store address exactly** — even "USA" vs "United States" can trigger AI checks
- LLC docs don't need to match public address (only needed if Google requests verification)

## Common 404 Pages to Redirect

Shopify silently generates pages that return 404. Create redirects for:
- `/collections/vendors` → `/`
- `/collections/types` → `/`
- `/pages/c-contact` → `/pages/contact-us`
- `/pages/get-in-touch` → `/pages/contact-us`

Use `create-menus-and-redirects.ts` to set these up automatically.

## Logo & Images

- Fix mobile logo to prevent pixelation at tablet widths (separate mobile logo asset)
- Use high-quality images throughout

## Analytics

- Install **Microsoft Clarity** (Shopify app) — helps identify Google manual reviewer visits and conversion drop-offs

## GMC Submission Workflow

1. Set up store fully (theme, content, policies, menus, redirects)
2. Run `/check-store` to validate everything
3. Create GMC account with matching business address
4. Fill in all GMC settings (shipping, returns, customer service)
5. Submit product feed
6. Wait for products to be approved (green)
7. Connect Google Ads only after products are approved
8. Use **PMAX campaigns** (recommended over Search for this model)

## If Suspended

- Try a **new GMC with the same domain** first
- If repeated failures, consider new domain
- New GMC requires: new IP/proxy, new anti-detect profile, new address + phone, new Gmail, rewritten policies
- Only the domain can stay the same
- Properly delete old GMC first (Google has specific steps)

## Risk Management

- ~5 stores per LLC as a practical limit
- Don't stack submissions — but no need to artificially delay between stores
- Google doesn't seriously check until products are uploaded/processed
