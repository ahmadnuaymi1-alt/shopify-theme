# Shopify Theme - Project Conventions

## Overview
This is a Shopify 2.0 theme based on Shrine PRO v1.2.3, cleaned and customized for a multi-niche dropshipping store.

## Critical Rules

### Security (NEVER violate)
- **NO external domain links** in any theme file (`.liquid`, `.js`, `.css`)
- Only allowed external domains: `cdn.shopify.com`, `fonts.shopifycdn.com`, `monorail-edge.shopifysvc.com`, `schema.org`, `fonts.gstatic.com`, `www.gstatic.com`
- Video embeds (`youtube.com`, `vimeo.com`) are allowed only in iframe `src` attributes
- **NO `eval()`**, `atob()`, `btoa()`, `new Function()`, or `document.write()` in any JS
- **NO external CDN** for libraries - self-host all JS/CSS in `assets/`
- Never add tracking pixels, beacons, or analytics scripts without explicit approval

### Google Merchant Centre Compliance
- All `<img>` tags MUST have `alt="{{ image.alt | escape }}"` (or descriptive text)
- All product pages MUST output valid JSON-LD structured data (`@type: Product`)
- All pages MUST have `<link rel="canonical" href="{{ canonical_url }}" />`
- All pages MUST have proper `<title>` and `<meta name="description">`
- Use semantic HTML5 (`<header>`, `<main>`, `<nav>`, `<article>`, `<footer>`)
- No hidden text, cloaking, or deceptive redirects
- No hardcoded store URLs - use `{{ shop.url }}` or relative paths

### Coding Standards
- **Liquid**: Use `{%- -%}` whitespace-trimming tags where possible
- **CSS**: Use CSS custom properties (design tokens) defined in `:root`
- **JS**: Use Web Components (`class extends HTMLElement`) for interactive sections
- **Templates**: All templates must use JSON format (Shopify 2.0)
- **Sections**: Must include `{% schema %}` with proper settings for theme editor

### File Structure
- `layout/` - Master layouts (theme.liquid, password.liquid)
- `sections/` - Theme sections (268 sections)
- `snippets/` - Reusable components (82 snippets)
- `assets/` - CSS, JS, images, fonts
- `config/` - Theme settings schema and data
- `locales/` - Translation files
- `templates/` - Page templates (JSON format)

### Structured Data (JSON-LD)
- Product pages: `@type: Product` with name, image, description, brand, sku, offers
- Homepage: `@type: Organization` + `@type: WebSite` with SearchAction
- Collection pages: `@type: CollectionPage`
- All structured data in `<script type="application/ld+json">`

### Performance
- Lazy load images below the fold with `loading="lazy"`
- Defer non-critical JS with `defer` attribute
- Use Shopify's responsive image helpers (`image_url` with width params + `srcset`)
- CSS should be section-specific where possible (loaded only when section is used)
