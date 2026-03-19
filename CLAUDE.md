# Shopify Store Setup System - Project Conventions

## Overview
Unified system for setting up Shopify dropshipping stores from A to Z:
- **Theme layer**: Shrine PRO v1.2.3 — Liquid sections, snippets, assets, templates
- **Setup layer**: TypeScript CLI (`setup/`) — policies, pages, menus, footer, metafields
- **Verification layer**: Claude skills — GMC compliance checking (content, visual, links)

## Autonomy Rules
- **Never ask permission** to read files, search code, explore the codebase, edit files, or run commands. Just do it.
- **Always ask permission** before starting a new task or major piece of work. Confirm the approach first, then execute without interruption.
- Once a task is approved, complete it fully without stopping to ask follow-up questions. Use your best judgment for implementation details.
- Use Context7 MCP proactively for any library/API documentation.
- Use agent teams for complex multi-step tasks that benefit from parallel work.

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

### Content Formatting Rules (for setup/ scripts)
Full details in `docs/STORE-SETUP-GUIDE.md`. Key rules:
- No em-dashes — use periods or commas
- No Oxford commas — "red, blue and green"
- Time ranges use "to" — "1 to 2 business days"
- **No banned words**: guarantee, warranty, promise, best, finest, superior, premium, world-class, top-notch, unmatched
- Bold only on `<a>` tags in body text
- All emails use `mailto:` links, all phones use `tel:` links
- Address links use Google Search format (not Maps)

### Coding Standards
- **Liquid**: Use `{%- -%}` whitespace-trimming tags where possible
- **CSS**: Use CSS custom properties (design tokens) defined in `:root`
- **JS**: Use Web Components (`class extends HTMLElement`) for interactive sections
- **Templates**: All templates must use JSON format (Shopify 2.0)
- **Sections**: Must include `{% schema %}` with proper settings for theme editor

## File Structure
- `layout/` - Master layouts (theme.liquid, password.liquid)
- `sections/` - Theme sections (268 sections)
- `snippets/` - Reusable components (82 snippets)
- `assets/` - CSS, JS, images, fonts
- `config/` - Theme settings schema and data
- `locales/` - Translation files
- `templates/` - Page templates (JSON format)
- `setup/` - Backend automation (TypeScript CLI)
  - `setup/src/` - Source code (templates, Shopify API, AI, config)
  - `setup/configs/` - Per-store config JSON files (gitignored, contains secrets)
  - `setup/scripts/archive/` - One-off debug scripts
- `docs/` - Setup guide, GMC advice
- `.claude/commands/` - Claude slash commands (shrine-store, setup-store)
- `.claude/skills/` - Verification skills (check-store, review-content, review-links, review-visual)
- `.claude/templates/` - Store templates (KindClouds reference)

## Setup Scripts Quick Reference
All scripts run from the `setup/` directory:
- `npx tsx run-all-content.ts "Store Name"` — Push all 4 policies + 5 pages
- `npx tsx create-menus-and-redirects.ts "Store Name"` — Create menus + URL redirects
- `npx tsx setup-footer.ts "Store Name"` — Configure 4-column footer
- `npx tsx fix-theme.ts "Store Name"` — Fix page template rendering
- `npx tsx assign-metafields.ts "Store Name"` — Wire product metafields to sections
- `npx tsx validate-content.ts` — Validate content before push

## Integrations (MCP Servers)

### Supabase
Connected via `.mcp.json`. Use for database and backend operations.

### Context7
Use for looking up any library or API documentation with up-to-date examples.
- `mcp__context7__resolve-library-id` → `mcp__context7__query-docs`

### Playwright
Use for browser automation, visual testing, and web scraping.
- Navigate → snapshot → click/type → screenshot

### Filesystem MCP
Use for file operations when you need MCP-level file access.

## Structured Data (JSON-LD)
- Product pages: `@type: Product` with name, image, description, brand, sku, offers
- Homepage: `@type: Organization` + `@type: WebSite` with SearchAction
- Collection pages: `@type: CollectionPage`
- All structured data in `<script type="application/ld+json">`

## Performance
- Lazy load images below the fold with `loading="lazy"`
- Defer non-critical JS with `defer` attribute
- Use Shopify's responsive image helpers (`image_url` with width params + `srcset`)
- CSS should be section-specific where possible (loaded only when section is used)
