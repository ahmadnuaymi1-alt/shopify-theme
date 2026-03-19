/**
 * Shopify Admin API — Legal policy management.
 *
 * Update the store's legal policies (refund, privacy, terms, shipping).
 */

import chalk from "chalk";
import ora from "ora";
import type { ShopifyClient } from "./client.js";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ShopPolicyType =
  | "REFUND_POLICY"
  | "PRIVACY_POLICY"
  | "TERMS_OF_SERVICE"
  | "SHIPPING_POLICY";

interface ShopPolicyUpdateResult {
  shopPolicyUpdate: {
    shopPolicy: { id: string; type: string; body: string } | null;
    userErrors: Array<{ field: string[]; message: string }>;
  };
}

// ---------------------------------------------------------------------------
// GraphQL mutations
// ---------------------------------------------------------------------------

const SHOP_POLICY_UPDATE_MUTATION = `
  mutation shopPolicyUpdate($shopPolicy: ShopPolicyInput!) {
    shopPolicyUpdate(shopPolicy: $shopPolicy) {
      shopPolicy {
        id
        type
        body
      }
      userErrors {
        field
        message
      }
    }
  }
`;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const POLICY_LABELS: Record<ShopPolicyType, string> = {
  REFUND_POLICY: "Refund Policy",
  PRIVACY_POLICY: "Privacy Policy",
  TERMS_OF_SERVICE: "Terms of Service",
  SHIPPING_POLICY: "Shipping Policy",
};

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Update a single legal policy on the Shopify store.
 */
export async function updatePolicy(
  client: ShopifyClient,
  type: ShopPolicyType,
  body: string,
): Promise<void> {
  const label = POLICY_LABELS[type] ?? type;

  const result = await client.query<ShopPolicyUpdateResult>(
    SHOP_POLICY_UPDATE_MUTATION,
    {
      shopPolicy: { type, body },
    },
  );

  const errors = result.shopPolicyUpdate.userErrors;
  if (errors.length > 0) {
    const msg = errors.map((e) => e.message).join("; ");
    console.log(chalk.red(`  Failed to update ${label}: ${msg}`));
    throw new Error(`Failed to update ${label}: ${msg}`);
  }

  console.log(chalk.green(`  Updated ${label}.`));
}

/**
 * Update all provided legal policies with progress feedback.
 *
 * @param policies - A record mapping policy type keys (e.g. "REFUND_POLICY")
 *                   to their HTML body content.
 */
export async function updateAllPolicies(
  client: ShopifyClient,
  policies: Record<string, string>,
): Promise<void> {
  const entries = Object.entries(policies) as Array<[ShopPolicyType, string]>;
  const spinner = ora("Updating legal policies...").start();

  let succeeded = 0;
  let failed = 0;

  for (const [type, body] of entries) {
    const label = POLICY_LABELS[type] ?? type;
    spinner.text = `Updating policy: ${label} (${succeeded + failed + 1}/${entries.length})`;

    try {
      await updatePolicy(client, type, body);
      succeeded++;
    } catch (err: unknown) {
      failed++;
      const message = err instanceof Error ? err.message : String(err);
      console.log(chalk.red(`  Error updating ${label}: ${message}`));
    }
  }

  if (failed > 0) {
    spinner.warn(
      chalk.yellow(
        `Policies done: ${succeeded} succeeded, ${failed} failed out of ${entries.length}.`,
      ),
    );
  } else {
    spinner.succeed(
      chalk.green(`All ${succeeded} policies updated successfully.`),
    );
  }
}
