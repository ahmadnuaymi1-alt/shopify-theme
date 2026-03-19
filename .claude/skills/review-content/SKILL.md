---
name: review-content
description: Review pushed Shopify content for quality, consistency, and GMC compliance. Run this after pushing pages or policies.
allowed-tools: Read, Grep, Glob, Agent
---

# Content Reviewer

Review all template files and pushed content for quality, consistency, and GMC compliance.

## What to Check

1. **Message clarity** — content is clear, professional, and consistent across all pages/policies
2. **No errors** — no typos, awkward phrasing, or contradictions between pages
3. **GMC compliance points are present:**
   - Return window from DELIVERY date (not purchase)
   - Restocking fee explicitly stated ($0)
   - Processing time and transit time stated SEPARATELY
   - No tax charged — "All prices are the final price you pay"
   - Free shipping on all orders stated clearly
   - Customer service hours + response time on every page
4. **NO OVERPROMISING LANGUAGE** — This is a CRITICAL GMC rule. The following words are BANNED and must NEVER appear in any content:
   - "guarantee", "guaranteed", "guarantees"
   - "warranty", "warranties"
   - "promise", "promised"
   - "ensure", "ensured"
   - "best" (as in "best products", "best prices", "best quality", "do our best")
   - "finest", "exceptional", "superior", "premium", "world-class", "top-notch", "unmatched", "unbeatable", "unsurpassed", "flawless", "perfect"
   - "risk-free", "no risk"
   - "lowest price", "highest quality"
   - Any word that implies a promise, commitment, or superlative claim about products or service
   - Use neutral alternatives: "we aim to", "we work to", "carefully selected", "attentive", "reliable"
   - Grep ALL template files for these words. Every single match is a HIGH severity issue.
5. **Bold/hyperlink rule** — ONLY hyperlinks are bolded in body text. No random bolding of plain text. In the Contact block at the bottom, hyperlinks are underlined only (NOT bold)
5. **Contact block format** matches Vilvida style:
   - Heading: "Contact"
   - Friendly message with underlined FAQs + Contact Us links
   - "Contact Information" as bold text (not H2)
   - Labels bold: Store Name, Address, Email, Number, Hours of Operation
   - Fields on consecutive lines with `<br>` (no paragraph gaps)
   - Response time sentence at the end
6. **Address format** — always: street, city, full state name, zip, United States (comma-separated)
7. **"Last updated" date** — present at the top of every policy

## Files to Read

Read ALL template files in `setup/src/templates/` and `setup/src/utils/contact-block.ts`. Report issues with file path and line numbers.

## Arguments

If `$ARGUMENTS` is provided, only review those specific files/pages. Otherwise review everything.
