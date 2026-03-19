/**
 * Shopify checkout settings automation via Playwright.
 *
 * Logs into the admin, navigates to checkout settings, and attempts
 * to configure button color and logo branding.
 */

import chalk from "chalk";
import type { StoreConfig } from "../config/store-config.js";
import { loginToShopifyAdmin, closeBrowser } from "./login.js";

/**
 * Configure checkout branding settings in the Shopify admin.
 *
 * On standard Shopify plans (non-Plus), checkout customization is
 * limited. This function does its best to apply the available options.
 */
export async function configureCheckout(
  config: StoreConfig,
): Promise<void> {
  let page;

  try {
    // ── Step 1: Login ────────────────────────────────────────────────
    console.log(chalk.cyan("\n[1/5] Logging into Shopify Admin..."));
    page = await loginToShopifyAdmin(config);

    // ── Step 2: Navigate to Checkout Settings ────────────────────────
    console.log(chalk.cyan("[2/5] Navigating to checkout settings..."));
    const checkoutUrl = `https://${config.shopifyStoreUrl}/admin/settings/checkout`;
    await page.goto(checkoutUrl, { waitUntil: "networkidle" });
    await page.waitForTimeout(2_000);
    console.log(chalk.green("Checkout settings page loaded."));

    // ── Step 3: Look for branding / customization section ────────────
    console.log(chalk.cyan("[3/5] Looking for checkout customization options..."));

    // Try to find the "Customize checkout" or branding link
    const customizeLink = page.locator(
      'a:has-text("Customize"), a:has-text("Customize checkout"), button:has-text("Customize")',
    ).first();

    const hasCustomize = await customizeLink.isVisible().catch(() => false);

    if (hasCustomize) {
      await customizeLink.click();
      await page.waitForTimeout(3_000);
      console.log(chalk.green("Opened checkout customization panel."));
    } else {
      console.log(
        chalk.yellow(
          "No 'Customize' button found — checkout branding may be in a different location on this plan.",
        ),
      );
    }

    // ── Step 4: Update accent / button color ─────────────────────────
    console.log(
      chalk.cyan(
        `[4/5] Setting checkout button color to ${config.checkoutButtonColor ?? '#2E7D32'}...`,
      ),
    );

    try {
      // Look for a color input (hex field or color picker)
      const colorInput = page.locator(
        'input[type="color"], input[aria-label*="color" i], input[placeholder*="#"]',
      ).first();

      const colorVisible = await colorInput.isVisible().catch(() => false);

      if (colorVisible) {
        await colorInput.fill(config.checkoutButtonColor ?? '#2E7D32');
        console.log(
          chalk.green(`Button color set to ${config.checkoutButtonColor ?? '#2E7D32'}.`),
        );
      } else {
        // Try clicking into a branding section first
        const brandingSection = page.locator(
          'button:has-text("Branding"), [role="tab"]:has-text("Branding"), summary:has-text("Branding")',
        ).first();

        const brandingVisible = await brandingSection.isVisible().catch(() => false);

        if (brandingVisible) {
          await brandingSection.click();
          await page.waitForTimeout(1_500);

          // Try color input again after expanding branding
          const colorInputRetry = page.locator(
            'input[type="color"], input[aria-label*="color" i], input[placeholder*="#"]',
          ).first();

          const retryVisible = await colorInputRetry.isVisible().catch(() => false);
          if (retryVisible) {
            await colorInputRetry.fill(config.checkoutButtonColor ?? '#2E7D32');
            console.log(
              chalk.green(`Button color set to ${config.checkoutButtonColor ?? '#2E7D32'}.`),
            );
          } else {
            console.log(
              chalk.yellow(
                "Color input not found. On non-Plus Shopify plans, checkout color customization may not be available.",
              ),
            );
          }
        } else {
          console.log(
            chalk.yellow(
              "Branding section not found. Checkout customization may be limited on this Shopify plan.",
            ),
          );
        }
      }
    } catch (err) {
      console.log(
        chalk.yellow(
          `Could not set button color: ${err instanceof Error ? err.message : String(err)}`,
        ),
      );
    }

    // ── Step 5: Upload logo (if provided) ────────────────────────────
    if (config.checkoutLogoPath) {
      console.log(
        chalk.cyan(`[5/5] Uploading checkout logo from ${config.checkoutLogoPath}...`),
      );

      try {
        // Look for a file upload input or an "Upload" / "Add image" button
        const uploadButton = page.locator(
          'button:has-text("Upload"), button:has-text("Add image"), button:has-text("Add logo")',
        ).first();

        const uploadVisible = await uploadButton.isVisible().catch(() => false);

        if (uploadVisible) {
          // Some Shopify pages use a hidden file input triggered by a button
          const fileInput = page.locator('input[type="file"]').first();
          const fileInputExists = await fileInput.count();

          if (fileInputExists > 0) {
            await fileInput.setInputFiles(config.checkoutLogoPath);
            await page.waitForTimeout(3_000);
            console.log(chalk.green("Logo uploaded successfully."));
          } else {
            // Click the upload button and wait for a file chooser
            const [fileChooser] = await Promise.all([
              page.waitForEvent("filechooser", { timeout: 10_000 }),
              uploadButton.click(),
            ]);
            await fileChooser.setFiles(config.checkoutLogoPath);
            await page.waitForTimeout(3_000);
            console.log(chalk.green("Logo uploaded successfully."));
          }
        } else {
          console.log(
            chalk.yellow(
              "Upload button not found. Logo upload may not be available from this page.",
            ),
          );
        }
      } catch (err) {
        console.log(
          chalk.yellow(
            `Could not upload logo: ${err instanceof Error ? err.message : String(err)}`,
          ),
        );
      }
    } else {
      console.log(chalk.dim("[5/5] No logo path provided — skipping logo upload."));
    }

    // ── Save changes ─────────────────────────────────────────────────
    console.log(chalk.cyan("Saving changes..."));
    try {
      const saveButton = page.locator(
        'button:has-text("Save"), button[type="submit"]:has-text("Save")',
      ).first();

      const saveVisible = await saveButton.isVisible().catch(() => false);

      if (saveVisible) {
        await saveButton.click();
        await page.waitForTimeout(3_000);
        console.log(chalk.green("Changes saved successfully."));
      } else {
        console.log(
          chalk.yellow(
            "Save button not found — changes may have been auto-saved or there were no changes to save.",
          ),
        );
      }
    } catch (err) {
      console.log(
        chalk.yellow(
          `Could not save: ${err instanceof Error ? err.message : String(err)}`,
        ),
      );
    }

    console.log(chalk.green.bold("\nCheckout configuration complete."));
  } catch (err) {
    console.error(
      chalk.red(
        `\nCheckout configuration failed: ${err instanceof Error ? err.message : String(err)}`,
      ),
    );
    throw err;
  } finally {
    // ── Close browser ────────────────────────────────────────────────
    console.log(chalk.blue("Closing browser..."));
    await closeBrowser();
  }
}
