/**
 * Store configuration — load, save, and list per-store JSON configs.
 *
 * Config files live in `<project-root>/configs/{store-name-slug}.json`.
 */

import { readFile, writeFile, readdir, mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { defaults } from "./defaults.js";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface StoreConfig {
  shopifyClientId: string;
  shopifyClientSecret: string;
  shopifyStoreUrl: string;
  storeName: string;
  businessEntityName: string;
  brandNiche: string;
  businessAddress: {
    street: string;
    city: string;
    state: string;
    zip: string;
    country: string;
  };
  supportEmail: string;
  supportPhone: string;
  customerServiceHours: string;
  responseTime: string;
  shippingRegions: string;
  orderCutoffTime: string;
  handlingTime: string;
  transitTime: string;
  estimatedDeliveryTime: string;
  carriers: string;
  returnWindow: string;
  refundProcessingTime: string;
  restockingFee: string;
  paymentMethods: string;
  currency: string;
  governingLawState: string;
  shopifyAdminEmail?: string;
  shopifyAdminPassword?: string;
  checkoutButtonColor?: string;
  checkoutLogoPath?: string;
}

// ---------------------------------------------------------------------------
// Paths
// ---------------------------------------------------------------------------

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/** Project root is two levels up from src/config/ */
const PROJECT_ROOT = path.resolve(__dirname, "..", "..");
const CONFIGS_DIR = path.join(PROJECT_ROOT, "configs");

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Derive the public domain from a store name, e.g. "Kind Clouds" → "https://kindclouds.com" */
export function getStoreBaseUrl(config: StoreConfig): string {
  return `https://${config.storeName.toLowerCase().replace(/\s+/g, '')}.com`;
}

/** Convert a store name like "My Store" into "my-store" for file naming. */
function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Ensure the configs directory exists. */
async function ensureConfigsDir(): Promise<void> {
  await mkdir(CONFIGS_DIR, { recursive: true });
}

/** Build the full path to a store's config file. */
function configPath(storeName: string): string {
  return path.join(CONFIGS_DIR, `${slugify(storeName)}.json`);
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Save a store configuration to disk.
 *
 * Any fields not provided in `partial` will be filled with defaults.
 * Returns the fully-resolved config that was written.
 */
export async function saveConfig(
  partial: Partial<StoreConfig> & Pick<StoreConfig, "storeName">,
): Promise<StoreConfig> {
  await ensureConfigsDir();

  const config: StoreConfig = { ...defaults, ...partial };
  const filePath = configPath(config.storeName);

  await writeFile(filePath, JSON.stringify(config, null, 2), "utf-8");
  return config;
}

/**
 * Load a store configuration by its public-facing store name.
 *
 * Returns `null` if no config file exists for the given name.
 */
export async function loadConfig(
  storeName: string,
): Promise<StoreConfig | null> {
  const filePath = configPath(storeName);

  try {
    const raw = await readFile(filePath, "utf-8");
    const parsed = JSON.parse(raw) as Partial<StoreConfig>;
    // Merge with defaults so newly-added fields are always present
    return { ...defaults, ...parsed } as StoreConfig;
  } catch (err: unknown) {
    if (
      err instanceof Error &&
      (err as NodeJS.ErrnoException).code === "ENOENT"
    ) {
      return null;
    }
    throw err;
  }
}

/**
 * List all saved store configs.
 *
 * Returns an array of `{ storeName, fileName }` for every `.json`
 * file in the configs directory.
 */
export async function listConfigs(): Promise<
  { storeName: string; fileName: string }[]
> {
  await ensureConfigsDir();

  const files = await readdir(CONFIGS_DIR);
  const results: { storeName: string; fileName: string }[] = [];

  for (const file of files) {
    if (!file.endsWith(".json")) continue;

    try {
      const raw = await readFile(path.join(CONFIGS_DIR, file), "utf-8");
      const parsed = JSON.parse(raw) as Partial<StoreConfig>;
      results.push({
        storeName: parsed.storeName ?? file.replace(/\.json$/, ""),
        fileName: file,
      });
    } catch {
      // Skip files that aren't valid JSON
      continue;
    }
  }

  return results;
}
