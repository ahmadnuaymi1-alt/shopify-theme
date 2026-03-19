/**
 * Shopify Admin API GraphQL client.
 *
 * Uses the Client Credentials Grant to obtain a short-lived access token,
 * then makes GraphQL requests with native fetch (Node 18+).
 * Handles rate-limiting (HTTP 429) with automatic retries.
 */

import chalk from "chalk";
import type { StoreConfig } from "../config/store-config.js";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ShopifyClient {
  query<T = unknown>(
    queryString: string,
    variables?: Record<string, unknown>,
  ): Promise<T>;
}

interface GraphQLResponse<T = unknown> {
  data?: T;
  errors?: Array<{ message: string; locations?: unknown; path?: unknown }>;
  extensions?: { cost?: { throttleStatus?: { currentlyAvailable: number } } };
}

interface TokenResponse {
  access_token: string;
  expires_in: number;
  scope: string;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const API_VERSION = "2025-01";
const MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY_MS = 2_000;
/** Refresh the token 5 minutes before expiry */
const TOKEN_REFRESH_BUFFER_MS = 5 * 60 * 1_000;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ---------------------------------------------------------------------------
// Token management
// ---------------------------------------------------------------------------

let _cachedToken: string | null = null;
let _tokenExpiresAt = 0;

/**
 * Obtain an access token via the Client Credentials Grant.
 *
 * Tokens are cached and reused until they're close to expiring.
 */
async function getAccessToken(config: StoreConfig): Promise<string> {
  if (_cachedToken && Date.now() < _tokenExpiresAt) {
    return _cachedToken;
  }

  const tokenUrl = `https://${config.shopifyStoreUrl}/admin/oauth/access_token`;

  console.log(chalk.blue("Requesting Shopify access token..."));

  const response = await fetch(tokenUrl, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      client_id: config.shopifyClientId,
      client_secret: config.shopifyClientSecret,
    }).toString(),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(
      `Failed to obtain Shopify access token (HTTP ${response.status}): ${body}`,
    );
  }

  const data = (await response.json()) as TokenResponse;

  _cachedToken = data.access_token;
  // expires_in is in seconds — convert to ms and subtract buffer
  _tokenExpiresAt = Date.now() + data.expires_in * 1_000 - TOKEN_REFRESH_BUFFER_MS;

  console.log(
    chalk.green(
      `Access token obtained (expires in ${Math.round(data.expires_in / 60)} minutes).`,
    ),
  );

  return _cachedToken;
}

// ---------------------------------------------------------------------------
// Client factory
// ---------------------------------------------------------------------------

/**
 * Create a Shopify Admin API GraphQL client for a given store configuration.
 *
 * Uses Client Credentials Grant to automatically obtain and refresh tokens.
 *
 * @example
 * ```ts
 * const client = createShopifyClient(config);
 * const result = await client.query<{ shop: { name: string } }>(
 *   `{ shop { name } }`,
 * );
 * ```
 */
export function createShopifyClient(config: StoreConfig): ShopifyClient {
  const endpoint = `https://${config.shopifyStoreUrl}/admin/api/${API_VERSION}/graphql.json`;

  async function query<T = unknown>(
    queryString: string,
    variables?: Record<string, unknown>,
  ): Promise<T> {
    let lastError: Error | undefined;

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      try {
        // Get a valid token (cached or fresh)
        const accessToken = await getAccessToken(config);

        const response = await fetch(endpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Shopify-Access-Token": accessToken,
          },
          body: JSON.stringify({ query: queryString, variables }),
        });

        // ----- Rate limiting (429) -----
        if (response.status === 429) {
          const retryAfter = response.headers.get("Retry-After");
          const delayMs = retryAfter
            ? Number(retryAfter) * 1_000
            : INITIAL_RETRY_DELAY_MS * 2 ** attempt;

          if (attempt < MAX_RETRIES) {
            console.log(
              chalk.yellow(
                `Rate limited by Shopify. Retrying in ${Math.round(delayMs / 1_000)}s (attempt ${attempt + 1}/${MAX_RETRIES})...`,
              ),
            );
            await sleep(delayMs);
            continue;
          }

          throw new Error(
            `Shopify rate limit exceeded after ${MAX_RETRIES} retries.`,
          );
        }

        // ----- 401 — token may have expired mid-session -----
        if (response.status === 401) {
          _cachedToken = null;
          _tokenExpiresAt = 0;

          if (attempt < MAX_RETRIES) {
            console.log(
              chalk.yellow(
                `Access token expired. Refreshing... (attempt ${attempt + 1}/${MAX_RETRIES})`,
              ),
            );
            continue;
          }

          throw new Error(
            "Shopify returned 401 after refreshing the access token.",
          );
        }

        // ----- Non-OK HTTP status -----
        if (!response.ok) {
          const body = await response.text();
          throw new Error(
            `Shopify API returned HTTP ${response.status}: ${body}`,
          );
        }

        // ----- Parse JSON -----
        const json = (await response.json()) as GraphQLResponse<T>;

        // ----- GraphQL-level errors -----
        if (json.errors && json.errors.length > 0) {
          const messages = json.errors.map((e) => e.message).join("; ");
          throw new Error(`Shopify GraphQL errors: ${messages}`);
        }

        if (!json.data) {
          throw new Error(
            "Shopify API returned a response with no data and no errors.",
          );
        }

        return json.data;
      } catch (err: unknown) {
        lastError =
          err instanceof Error ? err : new Error(String(err));

        // Retry on network-level failures (not GraphQL/HTTP errors)
        const isNetworkError =
          lastError.message.includes("fetch failed") ||
          lastError.message.includes("ECONNRESET") ||
          lastError.message.includes("ETIMEDOUT");

        if (isNetworkError && attempt < MAX_RETRIES) {
          const delayMs = INITIAL_RETRY_DELAY_MS * 2 ** attempt;
          console.log(
            chalk.yellow(
              `Network error: ${lastError.message}. Retrying in ${Math.round(delayMs / 1_000)}s (attempt ${attempt + 1}/${MAX_RETRIES})...`,
            ),
          );
          await sleep(delayMs);
          continue;
        }

        throw lastError;
      }
    }

    // Should never reach here, but TypeScript needs it
    throw lastError ?? new Error("Unexpected error in Shopify client.");
  }

  return { query };
}
