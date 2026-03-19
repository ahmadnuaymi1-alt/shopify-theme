/**
 * Shopify Admin API — URL redirect management.
 *
 * Create URL redirects (e.g. /collections/vendors → /).
 * Gracefully handles "already exists" errors by skipping duplicates.
 */

import chalk from "chalk";
import ora from "ora";
import type { ShopifyClient } from "./client.js";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface UrlRedirectCreateResult {
  urlRedirectCreate: {
    urlRedirect: { id: string; path: string; target: string } | null;
    userErrors: Array<{ field: string[]; message: string }>;
  };
}

// ---------------------------------------------------------------------------
// GraphQL mutations
// ---------------------------------------------------------------------------

const URL_REDIRECT_CREATE_MUTATION = `
  mutation urlRedirectCreate($urlRedirect: UrlRedirectInput!) {
    urlRedirectCreate(urlRedirect: $urlRedirect) {
      urlRedirect {
        id
        path
        target
      }
      userErrors {
        field
        message
      }
    }
  }
`;

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Create a single URL redirect.
 *
 * If the redirect already exists (detected via user errors), it is silently
 * skipped rather than throwing.
 */
export async function createRedirect(
  client: ShopifyClient,
  fromPath: string,
  toPath: string,
): Promise<void> {
  const result = await client.query<UrlRedirectCreateResult>(
    URL_REDIRECT_CREATE_MUTATION,
    {
      urlRedirect: { path: fromPath, target: toPath },
    },
  );

  const errors = result.urlRedirectCreate.userErrors;

  if (errors.length > 0) {
    // Check if the error is "already exists" — skip gracefully
    const alreadyExists = errors.some(
      (e) =>
        e.message.toLowerCase().includes("already exists") ||
        e.message.toLowerCase().includes("has already been taken"),
    );

    if (alreadyExists) {
      console.log(
        chalk.dim(`  Redirect already exists: ${fromPath} → ${toPath} (skipped)`),
      );
      return;
    }

    const msg = errors.map((e) => e.message).join("; ");
    console.log(
      chalk.red(`  Failed to create redirect ${fromPath} → ${toPath}: ${msg}`),
    );
    throw new Error(
      `Failed to create redirect ${fromPath} → ${toPath}: ${msg}`,
    );
  }

  const redirect = result.urlRedirectCreate.urlRedirect!;
  console.log(
    chalk.green(
      `  Created redirect: ${redirect.path} → ${redirect.target} (${redirect.id})`,
    ),
  );
}

/**
 * Standard contact page URL variants that commonly return 404.
 * All redirect to the store's full Contact Us URL.
 */
const CONTACT_REDIRECT_PATHS = [
  '/contact',
  '/pages/contact',
  '/pages/get-in-touch',
  '/pages/reach-us',
  '/pages/support',
  '/pages/help',
];

/**
 * Create redirects for common contact page URL variants → full Contact Us URL.
 *
 * @param storeBaseUrl - Full base URL e.g. "https://kindclouds.com"
 */
export async function createContactRedirects(
  client: ShopifyClient,
  storeBaseUrl: string,
): Promise<void> {
  const target = `${storeBaseUrl}/pages/contact-us`;
  const spinner = ora('Creating contact page redirects...').start();
  let created = 0;
  let skipped = 0;

  for (const path of CONTACT_REDIRECT_PATHS) {
    spinner.text = `Redirect: ${path} → ${target}`;
    try {
      const result = await client.query<UrlRedirectCreateResult>(
        URL_REDIRECT_CREATE_MUTATION,
        { urlRedirect: { path, target } },
      );
      const errors = result.urlRedirectCreate.userErrors;
      if (errors.some(e => e.message.toLowerCase().includes('already exists') || e.message.toLowerCase().includes('has already been taken'))) {
        skipped++;
      } else if (errors.length > 0) {
        spinner.warn(chalk.yellow(`  ${path}: ${errors.map(e => e.message).join('; ')}`));
      } else {
        created++;
      }
    } catch (err: unknown) {
      spinner.warn(chalk.yellow(`  ${path}: ${err instanceof Error ? err.message : String(err)}`));
    }
  }

  spinner.succeed(chalk.green(`Contact redirects: ${created} created, ${skipped} already existed.`));
}

/**
 * Create the default set of URL redirects for a new store.
 *
 * - /collections/vendors → /
 * - /collections/types   → /
 * - /collections/all     → /collections
 */
export async function createDefaultRedirects(
  client: ShopifyClient,
): Promise<void> {
  const spinner = ora("Creating URL redirects...").start();

  const redirects = [
    { from: "/collections/vendors", to: "/" },
    { from: "/collections/types", to: "/" },
    { from: "/collections/all", to: "/collections" },
  ];

  let succeeded = 0;
  let skipped = 0;
  let failed = 0;

  for (const { from, to } of redirects) {
    spinner.text = `Creating redirect: ${from} → ${to}`;

    try {
      // We need to detect "skipped" vs "created" — capture console output
      // by checking the result before createRedirect logs
      await createRedirect(client, from, to);
      succeeded++;
    } catch (err: unknown) {
      failed++;
      const message = err instanceof Error ? err.message : String(err);
      console.log(
        chalk.red(`  Error creating redirect ${from} → ${to}: ${message}`),
      );
    }
  }

  if (failed > 0) {
    spinner.warn(
      chalk.yellow(
        `Redirects done: ${succeeded} created, ${failed} failed out of ${redirects.length}.`,
      ),
    );
  } else {
    spinner.succeed(
      chalk.green(`All ${redirects.length} redirects processed successfully.`),
    );
  }
}
