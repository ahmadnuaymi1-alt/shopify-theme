# KindClouds Template

Exact replica of KindClouds.com — the gold-standard starter site for the Shrine PRO theme.

## Files

| File | Description |
|------|-------------|
| `homepage.json` | Homepage template (7 sections) |
| `product-page.json` | Product page template (7 sections + collapsible FAQ) |
| `theme-settings.json` | Colors, typography, layout, cart, header, footer settings |
| `metafields.json` | 23 product metafield definitions for dynamic product pages |

## Homepage Sections (in order)

1. **Hero Banner** — "Welcome to Kind Clouds" with subtitle, medium height, centered
2. **Trust Bar** (icon-bar) — 4 icons: Secure Checkout, Free Shipping, 30-Day Returns, Family Approved
3. **SS Waves Divider** — Blue wave (#89c4e1), 330px height
4. **Comparison Table** — "Why Families Choose Kind Clouds" with 6 rows, Us vs Others
5. **Section Divider** — waves_2 shape, flipped vertical, accent-1 colors
6. **Featured Collection** — "Check Out The Plush Toys" with 4-column grid
7. **FAQ** (collapsible-content) — 6 questions about shipping, returns, materials, etc.

## Product Page Sections (in order)

1. **Main Product** — 11 blocks: title, rating stars, price, 3 quick feature texts, variant picker, quantity selector, buy buttons, sticky ATC, description
2. **Related Products** — disabled by default
3. **SS Waves Divider** — Blue wave, 310px
4. **Image with Text** — Metafield-wired (header, body, image from product metafields)
5. **SS Waves Divider** — Flipped wave
6. **SS Feature #13** — 6 features in 3-column layout, metafield-wired
7. **Collapsible FAQ** — 4 Q&A pairs from product metafields

## Color Scheme

| Token | Value | Usage |
|-------|-------|-------|
| Accent 1 | `#6AAFE6` | Primary blue — buttons, links, highlights |
| Accent 2 | `#F8A4B8` | Coral pink — sale badges, secondary accents |
| Text | `#2D3436` | Dark charcoal — body text |
| Background 1 | `#FFFFFF` | White — main background |
| Background 2 | `#F5F7FA` | Light blue-gray — alternate sections |
| Footer BG | `#2D3436` | Dark charcoal footer |
| Footer Text | `#FFFFFF` | White footer text |

## Typography

- **Headings**: Bogue Bold (custom woff2), 130% scale, 0.6px letter spacing
- **Body**: Poppins Regular (poppins_n4), 100% scale

## Metafields (23 definitions)

All under `custom` namespace on PRODUCT owner type:

- **Image with Text (3)**: `image_with_text_header`, `image_with_text_body`, `image_for_image_text_section_1`
- **Features (12)**: `feature_{1-6}_header`, `feature_{1-6}_body`
- **FAQ (8)**: `faq_q{1-4}`, `faq_a{1-4}`
