# Shopify Store Setup Guide

Complete documentation of the formatting rules, template structure and setup process used to configure stores for GMC (Google Merchant Center) approval.

---

## Table of Contents

1. [Config Values](#config-values)
2. [Content Formatting Rules](#content-formatting-rules)
3. [Template Structure](#template-structure)
4. [Contact Block Standard](#contact-block-standard)
5. [Pages and Policies Created](#pages-and-policies-created)
6. [Footer Structure](#footer-structure)
7. [Header Navigation](#header-navigation)
8. [URL Redirects](#url-redirects)
9. [GMC Compliance Checklist](#gmc-compliance-checklist)
10. [Setup Process (Step by Step)](#setup-process)
11. [Scripts Reference](#scripts-reference)

---

## Config Values

Each store has a JSON config file in `configs/{store-slug}.json` with these fields:

| Field | Example (Royal Reform) | Notes |
|-------|----------------------|-------|
| storeName | Royal Reform | Public-facing store name |
| businessEntityName | AWRR Stores LLC | Legal entity name |
| brandNiche | Pilates and fitness equipment | Used in About Us |
| businessAddress | street, city, state, zip, country | Must match GMC exactly |
| supportEmail | support@royalreform.com | Used everywhere with mailto: |
| supportPhone | +1 (307) 429-3855 | Used everywhere with tel: |
| customerServiceHours | Monday to Friday, 9:00 AM to 5:00 PM (EST) | Displayed on every page |
| responseTime | 1 to 2 business days | Use "to" not dashes |
| shippingRegions | United States | Currently US only |
| orderCutoffTime | 5:00 PM EST | For same-day processing |
| handlingTime | 1 to 2 business days | Use "to" not dashes |
| transitTime | 6 to 8 business days | Use "to" not dashes |
| estimatedDeliveryTime | 7 to 10 business days | Use "to" not dashes |
| carriers | USPS, UPS, FedEx | Comma-separated |
| returnWindow | 30 days | From DELIVERY date |
| refundProcessingTime | 7 business days | Store processing only |
| restockingFee | $0 | Must be stated explicitly |
| paymentMethods | Visa, MasterCard, ... (9 total) | Each gets own bullet in Billing Terms |
| currency | United States Dollars (USD) | Full name with code |
| governingLawState | Wyoming | For Terms of Service |

**Critical:** All time ranges MUST use "to" (e.g., "1 to 2 business days"), NEVER dashes (e.g., "1-2 business days"). Dashes are a GMC red flag.

---

## Content Formatting Rules

### 1. No Em-Dashes or M-Dashes

**Never use em-dashes (--) anywhere in content.** Replace with periods, commas or rewording.

- BAD: `free shipping -- there is no minimum`
- GOOD: `free shipping. There is no minimum`
- BAD: `1-2 business days`
- GOOD: `1 to 2 business days`

### 2. No Oxford Commas

**Never use the Oxford comma** (the comma before "and" or "or" in a series of 3+ items).

- BAD: `red, blue, and green`
- GOOD: `red, blue and green`
- BAD: `shipping, returns, or exchanges`
- GOOD: `shipping, returns or exchanges`

### 3. No Banned Words

These words are NEVER allowed anywhere in content:

> guarantee, guaranteed, warranty, warranties, promise, promised, ensure, ensured, best, finest, exceptional, superior, premium, world-class, top-notch, unmatched, unrivaled, state-of-the-art, cutting-edge, revolutionary, industry-leading

### 4. Bold Rule

In body text, **only `<a>` tags may be wrapped in `<strong>`**. No bold text that is not a link.

- GOOD: `<strong><a href="mailto:...">email</a></strong>`
- BAD: `<strong>Important:</strong> text here`

Exception: The contact block at the bottom uses bold labels (`<strong>Store Name:</strong>`) which is acceptable as it is a structured info card, not body prose.

### 5. Phone Label

Always use **"Number:"** not "Phone:" when labeling the phone number.

### 6. Hours Label

Always use **"Hours of Operation:"** not "Customer Service Hours:" or "Business Hours:".

### 7. Address Links

All address links use Google Search format (matching Vilvida):
```
https://www.google.com/search?q={encoded address}
```
NOT Google Maps format (`/maps/search/`).

### 8. Email Links

All email references use `mailto:` protocol:
```html
<a href="mailto:support@royalreform.com">support@royalreform.com</a>
```

### 9. Phone Links

All phone references use `tel:` protocol:
```html
<a href="tel:+1 (307) 429-3855">+1 (307) 429-3855</a>
```

### 10. Internal Cross-Links

All internal pages are hyperlinked when referenced:

| Page | URL |
|------|-----|
| Shipping Policy | /policies/shipping-policy |
| Refund Policy | /policies/refund-policy |
| Privacy Policy | /policies/privacy-policy |
| Terms of Service | /policies/terms-of-service |
| Contact Us | /pages/contact-us |
| FAQ | /pages/faqs |
| Track Your Order | /apps/track123 |
| Billing Terms | /pages/billing-terms-and-conditions |

### 11. Payment Methods Display

In Billing Terms page, payment methods MUST be individual `<li>` bullet points (not comma-separated):
```html
<ul>
  <li>Visa</li>
  <li>MasterCard</li>
  <li>American Express</li>
  <!-- etc. -->
</ul>
```

In other pages (FAQ, ToS), they can be comma-separated inline.

### 12. No Overpromising

No absolute claims like "100% satisfaction", "guaranteed delivery", "fastest shipping". Use measured language: "we aim to", "we strive to", "we work to".

---

## Template Structure

Every template follows this structure:

```html
<p><em>Last updated: {date}</em></p>

<h2>Main Title</h2>
<p>Introduction paragraph...</p>

<h2>Section 1</h2>
<p>Content...</p>

<!-- More sections... -->

{contactBlock}
```

### Files

| Template | File | Purpose |
|----------|------|---------|
| Refund Policy | `src/templates/refund-policy.ts` | Built-in Shopify policy |
| Shipping Policy | `src/templates/shipping-policy.ts` | Built-in Shopify policy |
| Privacy Policy | `src/templates/privacy-policy.ts` | Built-in Shopify policy |
| Terms of Service | `src/templates/terms-of-service.ts` | Built-in Shopify policy |
| Billing Terms | `src/templates/billing-terms.ts` | Custom page |
| FAQ | `src/templates/faq.ts` | Custom page |
| About Us | `src/templates/about-us.ts` | Custom page |
| Contact Us | `src/templates/contact-us.ts` | Custom page (with theme form) |
| Track Your Order | `src/templates/track-order.ts` | Custom page |

### Uniqueness Requirement

Every template must be **reworded for uniqueness** so it does not match other stores. The template files are the "base" that gets reworded. Key rules:
- Rewrite every prose sentence in your own words
- Change section headings to be creative/unique
- Keep all config variable placeholders exactly as-is
- Keep all hyperlinks and their targets exactly as-is
- Keep the contact block identical (it is shared)
- Preserve all GMC compliance points

---

## Contact Block Standard

Every page and policy ends with an **identical** contact block generated by `src/utils/contact-block.ts`:

```html
<h2>Contact</h2>
<p>If you have questions or need assistance, we're happy to help. Visit our <a href="/pages/faqs">FAQs</a> page or <a href="/pages/contact-us">Contact Us</a> directly.</p>

<p><strong>Contact Information</strong></p>
<p><strong>Store Name:</strong> {storeName}<br>
<strong>Address:</strong> <a href="{googleSearchUrl}">{fullAddress}</a><br>
<strong>Email:</strong> <a href="mailto:{email}">{email}</a><br>
<strong>Number:</strong> <a href="tel:{phone}">{phone}</a><br>
<strong>Hours of Operation:</strong> {hours}</p>

<p>We aim to respond to all inquiries within {responseTime}.</p>
```

**This block is IDENTICAL on every page.** It is not rewritten for uniqueness. It must contain:
- "If you have questions or need assistance" (exact wording)
- Links to FAQs and Contact Us (not bold)
- Bold labels for contact info fields
- Non-bold links for email, phone, address
- "Number:" label (not "Phone:")
- "Hours of Operation:" label
- Response time at the bottom

---

## Pages and Policies Created

### 4 Built-in Shopify Policies (via shopPolicyUpdate mutation)
1. **Privacy Policy** (`/policies/privacy-policy`)
2. **Terms of Service** (`/policies/terms-of-service`)
3. **Refund Policy** (`/policies/refund-policy`)
4. **Shipping Policy** (`/policies/shipping-policy`)

### 5 Custom Pages (via pageCreate/pageUpdate mutation)
1. **About Us** (`/pages/about-us`) - templateSuffix: ""
2. **FAQs** (`/pages/faqs`) - templateSuffix: "faqs"
3. **Contact Us** (`/pages/contact-us`) - templateSuffix: "contact" (for theme form)
4. **Track Your Order** (`/pages/track-your-order`) - redirects to `/apps/track123`
5. **Billing Terms and Conditions** (`/pages/billing-terms-and-conditions`) - templateSuffix: ""

---

## Footer Structure

4-column layout matching Vilvida (defined in `sections/footer-group.json`):

| Column 1: About | Column 2: Policies | Column 3: Info | Column 4: Welcome |
|-----------------|-------------------|----------------|-------------------|
| Store Name | Privacy Policy | About Us | Welcome to {Store} |
| Address (linked) | Return and Refund Policy | Contact Us | Brand blurb text |
| Email (mailto:) | Shipping Policy | FAQs | |
| Number (tel:) | Terms of Service | Track Your Order | |
| Hours of Operation | Billing Terms and Conditions | | |
| Response time | | | |

**Footer menus:**
- `policies` handle: 5 links (Privacy, Refund, Shipping, ToS, Billing Terms)
- `info` handle: 4 links (About Us, Contact Us, FAQs, Track Your Order)

**Footer bottom bar:**
- Copyright year and store name
- 9 payment icons (Visa, MasterCard, Amex, Discover, Diners Club, PayPal, Apple Pay, Google Pay, Shop Pay)
- No social media links (GMC rule for new stores)

---

## Header Navigation

Main menu (`main-menu` handle) with these items in order:

1. Home (`/`)
2. {Collection 1} (e.g., Postural Equipment)
3. {Collection 2} (e.g., Pilates Accessories)
4. About Us (`/pages/about-us`)
5. Contact Us (`/pages/contact-us`)
6. FAQs (`/pages/faqs`)
7. Track Your Order (`/apps/track123`)

Plus Profile/Login (theme utility, not part of menu).

**All menu URLs must use the custom domain** (e.g., `https://royalreform.com/pages/about-us`), never the myshopify.com domain.

---

## URL Redirects

| Source Path | Target | Reason |
|------------|--------|--------|
| /collections/vendors | / | Shopify ghost 404 page |
| /collections/types | / | Shopify ghost 404 page |
| /pages/track-your-order | /apps/track123 | Track123 app handles tracking |

---

## GMC Compliance Checklist

Every store must have ALL of these clearly stated:

- [ ] Return window specified as days from **delivery date** (not purchase date)
- [ ] Restocking fee explicitly stated ($0)
- [ ] Processing time and transit time stated **separately**
- [ ] Total estimated delivery time stated
- [ ] Order cutoff time stated
- [ ] Free shipping clearly stated
- [ ] Shipping carriers listed
- [ ] Customer service hours on every page (via contact block)
- [ ] Response time on every page (via contact block)
- [ ] Contact information on every page (via contact block)
- [ ] Tax/VAT clarity in billing terms (no hidden fees)
- [ ] Warranty explicitly stated (no warranty offered, only returns)
- [ ] Payment methods listed
- [ ] No social media links on new stores
- [ ] No em-dashes or Oxford commas
- [ ] No banned/overpromising words
- [ ] All emails use mailto: links
- [ ] All phones use tel: links
- [ ] All addresses link to Google Search

---

## Setup Process

### Step 1: Create Store Config
Run the CLI (`npm run dev`) and enter all store details. Saved to `configs/{store-slug}.json`.

### Step 2: Generate and Push Content
```bash
npx tsx run-all-content.ts
```
This generates all 4 policies + 5 pages from templates with store-specific data and pushes to Shopify.

### Step 3: Create Menus and Redirects
```bash
npx tsx create-menus-and-redirects.ts
```
Creates/updates main-menu, Policies menu, Info menu and URL redirects.

### Step 4: Configure Footer
```bash
npx tsx setup-footer.ts
```
Applies the 4-column footer layout to the theme's footer-group.json.

### Step 5: Fix Theme Templates
```bash
npx tsx fix-theme.ts
```
Ensures page templates render body HTML correctly (fixes Empire theme section conflicts).

### Step 6: Verify
Run the 5-reviewer deep check:
1. Content review (policies) - banned words, GMC compliance, formatting, uniqueness
2. Content review (pages) - same checks
3. Visual inspection (Playwright) - all 10 pages rendered correctly
4. Hyperlink verification (Playwright) - all links working
5. Footer/header structure (Playwright) - comparing with Vilvida reference

---

## Scripts Reference

| Script | Purpose |
|--------|---------|
| `run-all-content.ts` | Push all 4 policies + 5 pages to Shopify |
| `create-menus-and-redirects.ts` | Create/update menus (main, policies, info) + URL redirects |
| `setup-footer.ts` | Configure 4-column footer via theme Asset API |
| `fix-theme.ts` | Fix theme templates for correct page rendering |
| `fix-pages-final.ts` | One-off page fixes (templateSuffix etc.) |
| `run-policies.ts` | Push only the 4 policies (no pages) |

---

## Reference Store

**Vilvida** (https://vilvida.com) is the reference store. Royal Reform should match Vilvida's:
- Footer structure (4 columns)
- Contact block format
- Page structure and content depth
- Address link format (Google Search)

Content can differ but the structure and formatting rules must be identical.
