---
name: check-store
description: Run exhaustive store review — content, visual, and links — with cross-validation. Use after pushing content.
allowed-tools: Read, Grep, Glob, Agent, WebFetch
---

# Full Store Review — Exhaustive, One-Run, Cross-Validated

Run a comprehensive review of the Shopify store that catches ALL issues in a single run. Three reviewers work independently, then their findings are cross-validated.

## Phase 1: Parallel Review (3 Agents)

Launch these 3 agents **simultaneously in a single message** using `run_in_background: true`. Each agent MUST be thorough — go through EVERY section of EVERY page line by line, not just spot-checking.

### Agent 1: Content Reviewer (Exhaustive)
Read EVERY template file in `setup/src/templates/` and `setup/src/utils/contact-block.ts`. For EACH file, go through EVERY LINE and check:

**Text Quality (per line):**
- No typos, grammatical errors, or awkward phrasing
- No contradictions between pages (e.g., different return windows, different response times)
- Professional, clear language throughout
- No duplicate content across pages

**GMC Compliance (systematic checklist — check EACH item in EVERY relevant file):**
- [ ] Return window says "from delivery date" (not purchase date) — check refund-policy.ts, faq.ts
- [ ] Restocking fee explicitly stated as "$0" or "no restocking fee" — check refund-policy.ts
- [ ] Processing time and transit time stated SEPARATELY — check shipping-policy.ts, faq.ts
- [ ] Total estimated delivery time stated — check shipping-policy.ts, faq.ts
- [ ] Order cutoff time stated — check shipping-policy.ts, faq.ts
- [ ] No tax charged stated — check billing-terms.ts, terms-of-service.ts
- [ ] Free shipping stated clearly — check shipping-policy.ts, faq.ts
- [ ] Customer service hours on every page (via contact block) — check ALL templates
- [ ] Response time on every page (via contact block) — check ALL templates
- [ ] Refund processing time stated — check refund-policy.ts, faq.ts
- [ ] Payment methods listed — check faq.ts, billing-terms.ts
- [ ] Carriers listed — check shipping-policy.ts, faq.ts
- [ ] No social media links anywhere
- [ ] **NO OVERPROMISING LANGUAGE (CRITICAL)** — Grep ALL files for these BANNED words: "guarantee", "warranty", "promise", "ensure", "best", "finest", "exceptional", "superior", "premium", "world-class", "top-notch", "unmatched", "unbeatable", "perfect", "risk-free", "lowest", "highest quality". ANY match = HIGH severity. Use neutral alternatives: "we aim to", "we work to", "carefully selected", "attentive", "reliable"

**Formatting Rules (per file):**
- [ ] Bold rule: ONLY `<a>` tags wrapped in `<strong>` in body text. NO bold on plain text. NO bold on `<a>` tags in contact block
- [ ] Contact block at bottom of every template via `buildContactBlock(config)`
- [ ] "Last updated" date at top: `<p><em>Last updated: ${lastUpdated}</em></p>`
- [ ] Address format: street, city, STATE (full name), zip, United States — comma separated
- [ ] Email uses `mailto:` link everywhere
- [ ] Phone uses `tel:` link everywhere
- [ ] Address uses Google Maps link
- [ ] "Number:" label (not "Phone:")
- [ ] "Hours of Operation:" label (not "Customer Service Hours:")
- [ ] No Track Your Order references (replaced with Contact Us)

**Cross-References (verify consistency):**
- Return window value is the SAME in refund-policy.ts AND faq.ts
- Processing time value is the SAME in shipping-policy.ts AND faq.ts
- Transit time value is the SAME in shipping-policy.ts AND faq.ts
- Delivery time value is the SAME in shipping-policy.ts AND faq.ts
- Cutoff time value is the SAME in shipping-policy.ts AND faq.ts
- Refund processing time is the SAME in refund-policy.ts AND faq.ts
- Support email is the SAME everywhere
- Support phone is the SAME everywhere
- Config field names match between templates and StoreConfig interface

Report EVERY issue found with exact file path, line number, and what's wrong.

### Agent 2: Visual Inspector (Every Page)
Use Playwright MCP tools to open EACH live page. Do NOT skip any page. For EACH page:

1. Navigate to the URL
2. Take a snapshot (accessibility tree) to analyze structure
3. Take a full-page screenshot
4. Scroll to the bottom and take another screenshot focused on the contact block

**Check on EVERY page:**
- Page loads successfully (no 404, no error messages)
- "Last updated" date visible at the very top
- Headings render as proper headings (H2, H3), not plain text
- Lists render as proper bullet/numbered lists
- No weird gaps, extra whitespace, or double spacing between sections
- Contact block at bottom is tight: Store Name, Address, Email, Number, Hours all on consecutive lines with NO paragraph gaps between them
- Body hyperlinks appear visually bold + underlined (colored)
- Contact block hyperlinks appear underlined only (NOT bold)
- No broken images or missing content
- Professional appearance overall
- Text is readable and properly formatted

**Pages to check (ALL of these):**
- `https://{store-url}/policies/refund-policy`
- `https://{store-url}/policies/shipping-policy`
- `https://{store-url}/policies/privacy-policy`
- `https://{store-url}/policies/terms-of-service`
- `https://{store-url}/pages/about-us`
- `https://{store-url}/pages/faqs`
- `https://{store-url}/pages/contact-us`
- `https://{store-url}/pages/billing-terms-and-conditions`

**Cross-page consistency:**
- All pages follow the same heading structure and formatting patterns
- Contact blocks look identical across all pages
- No page looks visually different from the others in terms of spacing or layout

Report issues with the page URL, description of the problem, and whether it appears on multiple pages.

### Agent 3: Hyperlink Checker (Every Link on Every Page)
Use WebFetch to load EACH live page, extract ALL `<a href="...">` links, and verify every single one.

**For EACH page, check EVERY link:**
- `mailto:` links → email matches store config's `supportEmail`
- `tel:` links → phone matches store config's `supportPhone`
- Internal page links (`/pages/...`) → fetch destination, confirm NOT 404
- Internal policy links (`/policies/...`) → fetch destination, confirm NOT 404
- Google Maps links → encoded address matches store config's business address
- External links → fetch and confirm they load

**Also verify:**
- No links to `/pages/track-your-order` exist anywhere
- FAQ links point to `/pages/faqs` (plural), NOT `/pages/faq`
- No broken anchor links or empty href attributes
- All `mailto:` links have the correct email format
- All `tel:` links have the correct phone format (including country code)

**Pages to check (ALL of these):**
- All 4 policy pages (`/policies/...`)
- All info pages (`/pages/...`)

Report as a table per page: `| Link Text | href | Type | Status |`

Get the store URL and contact details from the config file in `setup/configs/`.

## Phase 2: Contact Redirect Audit (run in parallel with cross-validation)

After the 3 agents complete, check these **common 404 URL variants** that scanners like Google Merchant Center and Ahrefs flag. For EACH URL, fetch it and check if it loads or 404s:

**Contact page variants to check:**
- `https://{store-url}/contact`
- `https://{store-url}/pages/contact`
- `https://{store-url}/pages/get-in-touch`
- `https://{store-url}/pages/reach-us`
- `https://{store-url}/pages/support`
- `https://{store-url}/pages/help`

**Other common 404 variants:**
- `https://{store-url}/pages/faq` (singular — should redirect to /pages/faqs)
- `https://{store-url}/pages/about` (should redirect to /pages/about-us)

**For each URL:**
- If it loads normally (200) or already redirects to the correct page: mark as PASS
- If it returns 404: it needs a redirect — mark as FAIL and include in the fix list

**Auto-fix: if ANY contact variants return 404**, run this script using `npx tsx --input-type=module`:
```js
import { loadConfig, getStoreBaseUrl } from './setup/src/config/store-config.js';
import { createShopifyClient } from './setup/src/shopify/client.js';
import { createContactRedirects } from './setup/src/shopify/redirects.js';
const config = await loadConfig('{store name}');
const client = createShopifyClient(config);
await createContactRedirects(client, getStoreBaseUrl(config));
```
This creates all standard contact redirects pointing to the full `https://{domain}/pages/contact-us` URL.

Report results as:
| URL | Status | Action |
|-----|--------|--------|
| /contact | 404 | Redirect created → https://{domain}/pages/contact-us |
| /pages/contact | Already redirects | PASS |

## Phase 3: Cross-Validation

After ALL 3 agents complete AND the contact redirect audit is done, compile and cross-validate:

1. **Content vs Visual**: If content reviewer found formatting issues in templates, verify they match what the visual inspector sees on the live site. If they don't match, the live content may be outdated (needs re-push).

2. **Content vs Links**: If content reviewer found email/phone/address issues, verify the link checker caught the same ones. Any discrepancy means one reviewer missed something.

3. **Visual vs Links**: If visual inspector found a broken-looking link, verify the link checker confirmed it's broken (or it might be a styling issue, not a broken link).

4. **Completeness check**: Verify each reviewer checked ALL pages. If a reviewer skipped a page, call that out.

## Final Report Format

```
## Store Review: {Store Name}
Date: {current date}

### Content Issues
| # | File:Line | Issue | Severity |
|---|-----------|-------|----------|
(list all issues, or "None found")

### Visual Issues
| # | Page | Issue | Severity |
|---|------|-------|----------|
(list all issues, or "None found")

### Link Issues
| # | Page | Link | Type | Status |
|---|------|------|------|--------|
(list all issues, or "None found")

### Contact Redirect Audit
| URL | Status | Action Taken |
|-----|--------|--------------|
(list all variants checked)

### Cross-Validation Notes
(any discrepancies between reviewers)

### Verdict: PASS / NEEDS FIXES
(summary of what needs to be fixed, if anything)
```

## Store Config

Read the store config from `setup/configs/` to get the store URL and contact details. If `$ARGUMENTS` is provided, use it as the store name to load the config. Default to the most recently modified config file.
