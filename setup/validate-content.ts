/**
 * Pre-push content validator.
 *
 * Runs all GMC formatting rules and consistency checks against
 * the generated template output BEFORE pushing to Shopify.
 *
 * Usage: npx tsx validate-content.ts
 */

import chalk from "chalk";
import { loadConfig } from "./src/config/store-config.js";
import { buildContactBlock } from "./src/utils/contact-block.js";
import { generateRefundPolicy } from "./src/templates/refund-policy.js";
import { generateShippingPolicy } from "./src/templates/shipping-policy.js";
import { generatePrivacyPolicy } from "./src/templates/privacy-policy.js";
import { generateTermsOfService } from "./src/templates/terms-of-service.js";
import { generateBillingTerms } from "./src/templates/billing-terms.js";
import { generateFaq } from "./src/templates/faq.js";
import { generateContactUs } from "./src/templates/contact-us.js";
import { generateTrackOrder } from "./src/templates/track-order.js";
import { generateAboutUs } from "./src/templates/about-us.js";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Issue {
  page: string;
  rule: string;
  severity: "error" | "warning";
  detail: string;
  line?: number;
}

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const BANNED_WORDS = [
  "guarantee",
  "guaranteed",
  "guarantees",
  "warranty",
  "warranties",
  "promise",
  "promised",
  "promises",
  "ensure",
  "ensures",
  "ensuring",
  "best",
  "finest",
  "exceptional",
  "superior",
  "premium",
  "world-class",
  "unmatched",
  "unrivaled",
  "top-notch",
  "top notch",
  "state-of-the-art",
  "state of the art",
  "cutting-edge",
  "cutting edge",
];

// Warranty/warranties are allowed ONLY in denial context (FAQ answer about not offering them)
const BANNED_WORDS_DENIAL_EXCEPTIONS = ["warranty", "warranties"];

const OVERPROMISE_PHRASES = [
  "we are committed to",
  "we are dedicated to",
  "we guarantee",
  "we promise",
  "we ensure",
  "our utmost",
  "absolutely no",
  "absolutely free",
  "100% satisfaction",
  "complete satisfaction",
  "we will always",
  "we will never fail",
];

// ---------------------------------------------------------------------------
// Checks
// ---------------------------------------------------------------------------

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, "");
}

function checkEmDashes(page: string, html: string, issues: Issue[]) {
  const lines = html.split("\n");
  lines.forEach((line, i) => {
    if (line.includes("—") || line.includes("–")) {
      issues.push({
        page,
        rule: "no-dashes",
        severity: "error",
        detail: `Em-dash or en-dash found: "${line.trim().substring(0, 80)}..."`,
        line: i + 1,
      });
    }
  });
}

function checkOxfordCommas(page: string, html: string, issues: Issue[]) {
  const text = stripHtml(html);
  // Pattern: ", and " or ", or " preceded by another comma-separated item
  const matches = text.match(/,\s+\w+,\s+(and|or)\s+/gi);
  if (matches) {
    for (const match of matches) {
      issues.push({
        page,
        rule: "no-oxford-comma",
        severity: "warning",
        detail: `Possible Oxford comma: "...${match.trim()}..."`,
      });
    }
  }
}

function checkBannedWords(page: string, html: string, issues: Issue[]) {
  const text = stripHtml(html).toLowerCase();
  for (const word of BANNED_WORDS) {
    const regex = new RegExp(`\\b${word}\\b`, "gi");
    const matches = text.match(regex);
    if (matches) {
      // Check denial exceptions
      if (BANNED_WORDS_DENIAL_EXCEPTIONS.includes(word)) {
        const denialPatterns = [
          "do not offer warrant",
          "not offer warranties",
          "no warrant",
          "without warranty",
          "without warranties",
        ];
        const hasDenial = denialPatterns.some((p) => text.includes(p));
        if (hasDenial) continue;
      }
      issues.push({
        page,
        rule: "banned-words",
        severity: "error",
        detail: `Banned word "${word}" found (${matches.length} occurrence${matches.length > 1 ? "s" : ""})`,
      });
    }
  }
}

function checkDashRanges(page: string, html: string, issues: Issue[]) {
  const text = stripHtml(html);
  // Matches patterns like "3-4 business days" or "1-2 days" but NOT compound modifiers like "30-day"
  const regex = /\b(\d+)-(\d+)\s+(business\s+)?days?\b/gi;
  const matches = text.match(regex);
  if (matches) {
    for (const match of matches) {
      // Skip compound modifiers like "30-day" or "7-business-day"
      if (/^\d+-day\b/i.test(match) || /^\d+-business-day\b/i.test(match)) continue;
      issues.push({
        page,
        rule: "dash-ranges",
        severity: "error",
        detail: `Dash range should use "to": "${match}"`,
      });
    }
  }
}

function checkOverpromising(page: string, html: string, issues: Issue[]) {
  const text = stripHtml(html).toLowerCase();
  for (const phrase of OVERPROMISE_PHRASES) {
    if (text.includes(phrase)) {
      issues.push({
        page,
        rule: "overpromising",
        severity: "error",
        detail: `Overpromising phrase found: "${phrase}"`,
      });
    }
  }
}

function checkLinkTitles(page: string, html: string, issues: Issue[]) {
  const linkRegex = /<a\s+[^>]*href="[^"]*"[^>]*>/gi;
  const matches = html.match(linkRegex);
  if (matches) {
    for (const tag of matches) {
      if (!tag.includes("title=")) {
        issues.push({
          page,
          rule: "link-title",
          severity: "error",
          detail: `Link missing title attribute: ${tag.substring(0, 80)}`,
        });
      }
    }
  }
}

function checkTelFormat(page: string, html: string, issues: Issue[]) {
  const telRegex = /href="tel:([^"]*)"/gi;
  let match;
  while ((match = telRegex.exec(html)) !== null) {
    const telValue = match[1];
    if (/[\s()%]/.test(telValue)) {
      issues.push({
        page,
        rule: "tel-format",
        severity: "error",
        detail: `tel: href has spaces/parens/encoding: "tel:${telValue}" — should be digits only`,
      });
    }
  }
}

function checkBoldRule(page: string, html: string, issues: Issue[]) {
  // <strong> should only wrap <a> tags in body text (not labels like "Store Name:")
  const strongRegex = /<strong>([^<]*?)<\/strong>/gi;
  let match;
  while ((match = strongRegex.exec(html)) !== null) {
    const content = match[1];
    // Skip known label patterns
    if (
      /^(Store Name|Address|Email|Number|Hours of Operation|Contact Information):?$/i.test(
        content.trim()
      )
    )
      continue;
    // If it's plain text (no <a> inside) and not a label, flag it
    if (content.trim().length > 0) {
      issues.push({
        page,
        rule: "bold-rule",
        severity: "warning",
        detail: `<strong> wraps plain text instead of <a>: "${content.substring(0, 60)}"`,
      });
    }
  }
}

function checkPhoneLabel(page: string, html: string, issues: Issue[]) {
  if (html.includes("<strong>Phone:") || html.includes("<strong>Phone Number:")) {
    issues.push({
      page,
      rule: "phone-label",
      severity: "error",
      detail: `Phone label should be "Number:" not "Phone:"`,
    });
  }
}

function checkHoursLabel(page: string, html: string, issues: Issue[]) {
  if (html.includes("Business Hours:") || html.includes("Operating Hours:")) {
    issues.push({
      page,
      rule: "hours-label",
      severity: "error",
      detail: `Hours label should be "Hours of Operation:" not "Business Hours:"`,
    });
  }
}

function checkAddressFormat(page: string, html: string, issues: Issue[]) {
  if (html.includes("/maps/search/") || html.includes("/maps/place/")) {
    issues.push({
      page,
      rule: "address-format",
      severity: "error",
      detail: `Address link uses Google Maps — should use Google Search (/search?q=)`,
    });
  }
}

function checkConfigConsistency(
  page: string,
  html: string,
  config: Record<string, string>,
  issues: Issue[]
) {
  const text = stripHtml(html).toLowerCase();

  // Check for "same day" response/turnaround claims when config says otherwise.
  // Exclude "processing the same day" (order handling — correct if before cutoff).
  const sameDayPatterns = [
    /turnaround.*same[\s-]day/i,
    /same[\s-]day.*turnaround/i,
    /respond.*same[\s-]day/i,
    /same[\s-]day.*respon/i,
    /reply.*same[\s-]day/i,
    /same[\s-]day.*reply/i,
    /get back.*same[\s-]day/i,
  ];
  for (const pattern of sameDayPatterns) {
    if (pattern.test(text)) {
      const responseTime = config.responseTime?.toLowerCase() || "";
      if (!responseTime.includes("same day")) {
        issues.push({
          page,
          rule: "config-consistency",
          severity: "error",
          detail: `Claims same-day response/turnaround but config.responseTime is "${config.responseTime}"`,
        });
        break;
      }
    }
  }

  // Check hardcoded numbers that should match config
  const hardcodedChecks: Array<{ pattern: RegExp; configKey: string; label: string }> = [
    { pattern: /\b30[\s-]day\b/i, configKey: "returnWindow", label: "return window" },
    { pattern: /\b24[\s-]hour/i, configKey: "", label: "cancellation window" }, // 24hr is standard, just flag if present for review
  ];

  for (const check of hardcodedChecks) {
    if (check.configKey && check.pattern.test(text)) {
      const configVal = config[check.configKey]?.toLowerCase() || "";
      if (!configVal.includes("30")) {
        issues.push({
          page,
          rule: "config-consistency",
          severity: "warning",
          detail: `Hardcoded "30-day" ${check.label} but config.${check.configKey} is "${config[check.configKey]}"`,
        });
      }
    }
  }

  // Check for specific number claims that could become stale
  const specificNumbers = text.match(/\b(twenty|thirty|forty|fifty|\d{2,3})\s+(items|products|listings)\b/gi);
  if (specificNumbers) {
    for (const match of specificNumbers) {
      issues.push({
        page,
        rule: "hardcoded-claim",
        severity: "warning",
        detail: `Specific product count claim that could become stale: "${match}"`,
      });
    }
  }
}

function checkContactBlockPresence(page: string, pageName: string, html: string, issues: Issue[]) {
  // Every page/policy should have the contact block EXCEPT Contact Us
  if (pageName === "Contact Us") return;

  if (!html.includes("<h2>Contact</h2>")) {
    issues.push({
      page,
      rule: "contact-block",
      severity: "error",
      detail: `Missing contact block (expected <h2>Contact</h2> section)`,
    });
  }
}

function checkContactBlockBolding(page: string, html: string, issues: Issue[]) {
  // Intro links (FAQs, Contact Us) should be bolded
  const introLine = html.match(/Visit our.*?FAQs.*?Contact Us.*?directly/s);
  if (introLine) {
    const intro = introLine[0];
    if (!intro.includes("<strong><a")) {
      issues.push({
        page,
        rule: "contact-bold",
        severity: "warning",
        detail: `Contact block intro links (FAQs / Contact Us) should be wrapped in <strong>`,
      });
    }
  }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  console.log(chalk.bold.cyan("\n=== Content Validator ===\n"));

  const config = await loadConfig("Royal Reform");
  if (!config) {
    console.log(chalk.red("Config not found"));
    process.exit(1);
  }

  // Generate all content
  const pages: Array<{ name: string; html: string }> = [
    { name: "About Us", html: generateAboutUs(config) },
    { name: "FAQs", html: generateFaq(config) },
    { name: "Contact Us", html: generateContactUs(config) },
    { name: "Track Your Order", html: generateTrackOrder(config) },
    { name: "Billing Terms", html: generateBillingTerms(config) },
    { name: "Refund Policy", html: generateRefundPolicy(config) },
    { name: "Shipping Policy", html: generateShippingPolicy(config) },
    { name: "Privacy Policy", html: generatePrivacyPolicy(config) },
    { name: "Terms of Service", html: generateTermsOfService(config) },
  ];

  const configFlat: Record<string, string> = {
    responseTime: config.responseTime,
    returnWindow: config.returnWindow,
    handlingTime: config.handlingTime,
    transitTime: config.transitTime,
    estimatedDeliveryTime: config.estimatedDeliveryTime,
    refundProcessingTime: config.refundProcessingTime,
    customerServiceHours: config.customerServiceHours,
  };

  const allIssues: Issue[] = [];

  for (const page of pages) {
    checkEmDashes(page.name, page.html, allIssues);
    checkOxfordCommas(page.name, page.html, allIssues);
    checkBannedWords(page.name, page.html, allIssues);
    checkDashRanges(page.name, page.html, allIssues);
    checkOverpromising(page.name, page.html, allIssues);
    checkLinkTitles(page.name, page.html, allIssues);
    checkTelFormat(page.name, page.html, allIssues);
    checkBoldRule(page.name, page.html, allIssues);
    checkPhoneLabel(page.name, page.html, allIssues);
    checkHoursLabel(page.name, page.html, allIssues);
    checkAddressFormat(page.name, page.html, allIssues);
    checkConfigConsistency(page.name, page.html, configFlat, allIssues);
    checkContactBlockPresence(page.name, page.name, page.html, allIssues);
    checkContactBlockBolding(page.name, page.html, allIssues);
  }

  // Print results
  const errors = allIssues.filter((i) => i.severity === "error");
  const warnings = allIssues.filter((i) => i.severity === "warning");

  if (allIssues.length === 0) {
    console.log(chalk.bold.green("  All 9 pages/policies passed all checks.\n"));
  } else {
    // Group by page
    const byPage = new Map<string, Issue[]>();
    for (const issue of allIssues) {
      if (!byPage.has(issue.page)) byPage.set(issue.page, []);
      byPage.get(issue.page)!.push(issue);
    }

    for (const [page, issues] of byPage) {
      console.log(chalk.bold.white(`  ${page}:`));
      for (const issue of issues) {
        const icon = issue.severity === "error" ? chalk.red("  ERROR") : chalk.yellow("  WARN ");
        const lineInfo = issue.line ? chalk.gray(` (line ${issue.line})`) : "";
        console.log(`${icon} [${issue.rule}] ${issue.detail}${lineInfo}`);
      }
      console.log();
    }

    console.log(chalk.bold.white("  Summary:"));
    console.log(chalk.red(`    ${errors.length} error${errors.length !== 1 ? "s" : ""}`));
    console.log(chalk.yellow(`    ${warnings.length} warning${warnings.length !== 1 ? "s" : ""}`));
    console.log();

    if (errors.length > 0) {
      console.log(chalk.red.bold("  FAILED — fix errors before pushing.\n"));
      process.exit(1);
    } else {
      console.log(chalk.yellow.bold("  PASSED with warnings — review before pushing.\n"));
    }
  }
}

main().catch((err) => {
  console.error(chalk.red("Fatal error:"), err);
  process.exit(1);
});
