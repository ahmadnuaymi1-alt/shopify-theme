/**
 * Shopify Admin login automation via Playwright.
 *
 * Launches a visible browser, navigates to the store's admin panel,
 * handles email/password login, and returns the authenticated page.
 */

import { chromium, type Browser, type Page } from "playwright";
import chalk from "chalk";
import type { StoreConfig } from "../config/store-config.js";

// ---------------------------------------------------------------------------
// Module-level browser reference (so callers can close it later)
// ---------------------------------------------------------------------------

let _browser: Browser | null = null;

/**
 * Get the current browser instance (if any).
 * Call `await browser.close()` when you're done with automation.
 */
export function getBrowser(): Browser | null {
  return _browser;
}

/**
 * Close the browser instance if it's open.
 */
export async function closeBrowser(): Promise<void> {
  if (_browser) {
    await _browser.close();
    _browser = null;
  }
}

// ---------------------------------------------------------------------------
// Login
// ---------------------------------------------------------------------------

/**
 * Log in to the Shopify Admin for the given store.
 *
 * Opens a visible (non-headless) Chromium browser so the user can
 * watch the automation and intervene for 2FA if needed.
 *
 * @returns The authenticated Playwright Page object.
 */
export async function loginToShopifyAdmin(
  config: StoreConfig,
): Promise<Page> {
  console.log(chalk.blue("Launching browser..."));
  _browser = await chromium.launch({ headless: false });
  const context = await _browser.newContext();
  const page = await context.newPage();

  const adminUrl = `https://${config.shopifyStoreUrl}/admin`;
  console.log(chalk.blue(`Navigating to ${adminUrl}`));
  await page.goto(adminUrl, { waitUntil: "networkidle" });

  // ── Email step ──────────────────────────────────────────────────────
  console.log(chalk.blue("Filling in email..."));
  try {
    // Shopify's login redirects to accounts.shopify.com
    await page.waitForSelector('input[name="account[email]"], input[type="email"]', {
      timeout: 15_000,
    });
    const emailInput = page.locator('input[name="account[email]"], input[type="email"]').first();
    await emailInput.fill(config.shopifyAdminEmail ?? '');

    // Click the "Next" / "Continue" button
    const nextButton = page.locator(
      'button[type="submit"], button:has-text("Next"), button:has-text("Continue")',
    ).first();
    await nextButton.click();
    console.log(chalk.green("Email submitted."));
  } catch {
    console.log(
      chalk.yellow("Could not find email field — the page may have a different layout. Continuing..."),
    );
  }

  // ── Password step ──────────────────────────────────────────────────
  console.log(chalk.blue("Filling in password..."));
  try {
    await page.waitForSelector('input[type="password"]', { timeout: 15_000 });
    const passwordInput = page.locator('input[type="password"]').first();
    await passwordInput.fill(config.shopifyAdminPassword ?? '');

    const loginButton = page.locator(
      'button[type="submit"], button:has-text("Log in"), button:has-text("Sign in")',
    ).first();
    await loginButton.click();
    console.log(chalk.green("Password submitted."));
  } catch {
    console.log(
      chalk.yellow("Could not find password field — the page may have a different layout. Continuing..."),
    );
  }

  // ── 2FA check ──────────────────────────────────────────────────────
  // Give the page a moment to settle
  await page.waitForTimeout(3_000);

  const currentUrl = page.url();
  const is2FA =
    currentUrl.includes("two_factor") ||
    currentUrl.includes("otp") ||
    currentUrl.includes("verify");

  if (is2FA) {
    console.log(
      chalk.yellow.bold(
        "\n============================================\n" +
        "  Two-Factor Authentication detected.\n" +
        "  Please complete 2FA manually in the browser.\n" +
        "  The script will resume once the admin dashboard loads.\n" +
        "============================================\n",
      ),
    );
  }

  // ── Wait for the admin dashboard ───────────────────────────────────
  console.log(chalk.blue("Waiting for admin dashboard to load..."));
  try {
    await page.waitForURL(/\/admin\/?$|\/admin\/.*/, {
      timeout: 120_000, // 2 minutes — generous for manual 2FA
    });
    // Wait for a known admin element to confirm the page is ready
    await page.waitForSelector('a[href*="/admin"], [class*="Polaris"]', {
      timeout: 30_000,
    });
    console.log(chalk.green("Successfully logged into Shopify Admin."));
  } catch {
    console.log(
      chalk.yellow(
        "Dashboard detection timed out. The page may still be usable — proceeding.",
      ),
    );
  }

  return page;
}
