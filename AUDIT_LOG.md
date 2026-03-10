# Security Audit Log - Shrine Pro v1.2.3

**Audit Date:** 2026-03-10
**Theme:** Shrine PRO v1.2.3 (268 sections, 82 snippets, ~465 files)

---

## CRITICAL - Removed

### 1. Malicious External Script (theme.liquid line 18)
- **Removed:** `<script src="https://shopify.jsdeliver.cloud/js/config.js" defer="defer"></script>`
- **Reason:** Typosquat domain impersonating Shopify/jsdelivr. "jsdeliver.cloud" is NOT the legitimate "jsdelivr.net". Could serve any payload at any time. Loaded on every page.

### 2. License Kill Switch (main.js)
- **Neutralized:** `formatDates()` function (line 1460) - hardcoded date check with 27-day expiry from `2024-11-09`
- **Removed:** Cart-breaking code (line 70-71) - set `cart_add_url` to invalid value when expired
- **Removed:** Product form disabler (lines 2113-2121) - disabled product forms when expired
- **Removed:** Visibility kill switch (theme.liquid line 77) - hid entire `<main>` if auth token missing/short
- **Reason:** DRM/license enforcement that was ALREADY ACTIVE (expired months ago), making the store completely non-functional.

### 3. Hotjar Tracking for Another Store (theme.liquid lines 420-430)
- **Removed:** Hotjar tracking code (hjid: 5110780) for `https://ceio.store/`
- **Reason:** Session replay data (mouse movements, clicks, form inputs) being sent to someone else's Hotjar account.

### 4. Fake Authentication System (settings_schema.json + settings_data.json)
- **Removed:** "Authentication" section from settings_schema.json
- **Cleared:** Encrypted token from `animations_type` setting in settings_data.json
- **Cleared:** Encrypted token from `fav_collection` setting in settings_data.json
- **Removed:** `data-animations-type` attribute from main.js script tag
- **Reason:** Part of the license enforcement system. The setting labeled "Authentication token" was actually stored in `animations_type` to disguise its purpose.

---

## HIGH - Removed

### 5. External Script Injection via CSS onload (sp-slider-bailey.liquid line 467)
- **Removed:** `prettifyweb.com` script injection via CSS link onload trick
- **Reason:** Third-party script from unverified domain, CSP bypass technique

### 6. External Script Injection via CSS onload (sp-slider-aurora.liquid line 338)
- **Removed:** `pages.dev` script injection via CSS link onload trick
- **Reason:** Third-party script from Cloudflare Pages, unverified

---

## MODERATE - Removed/Replaced

### 7. CJ Dropshipping POD Integration (snippets/cjpod.liquid)
- **Gutted:** Removed external script `https://frontend.cjdropshipping.com/egg/pod3.js`
- **Reason:** Third-party script with full product data access. Can be re-added if CJ POD integration is needed.

### 8. External CDN Libraries (multiple ss-* and sp-* sections)
- **Self-hosted:** All Swiper, Flip, SimpleParallax, LazyLoad, and CountUp libraries
- **Replaced:** cdn.jsdelivr.net and unpkg.com references with local `{{ 'file.js' | asset_url }}` paths
- **Reason:** Supply chain risk. External CDNs can be compromised or serve different content.

---

## KEPT (Not Malicious)

### Google Fonts / Material Symbols
- `fonts.gstatic.com` / `www.gstatic.com` - Legitimate Google infrastructure

### Shopify CDN References
- `cdn.shopify.com` - Shopify's asset CDN (legitimate)
- `fonts.shopifycdn.com` - Shopify's font CDN (legitimate)

### Video Embeds
- `youtube.com` / `youtube-nocookie.com` / `vimeo.com` - Standard video embed iframes

### Right-Click Protection (disable_inspect)
- Kept as optional toggle in theme settings (defaults to true)
- Not malicious, just anti-copy protection

### Obfuscated main.js
- The file remains obfuscated (hex variable names) but kill switches have been neutralized
- All functional code (cart, product forms, variant selects, etc.) still works
- Future consideration: replace with de-obfuscated version if available

---

## Verification Commands
```bash
# Verify no external scripts remain (should only show Shopify/Google/video domains)
grep -rn "https://" --include="*.liquid" --include="*.js" | grep -v "cdn.shopify" | grep -v "shopifycdn" | grep -v "shopifysvc" | grep -v "schema.org" | grep -v "gstatic" | grep -v "youtube" | grep -v "vimeo" | grep -v "shopify.dev" | grep -v "w3.org"

# Verify no eval/atob
grep -rn "eval\|atob\|btoa" --include="*.js"

# Verify kill switch neutralized
grep -n "formatDates" assets/main.js
```
