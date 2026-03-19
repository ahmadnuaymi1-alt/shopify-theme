/**
 * Create footer menus and URL redirects for Royal Reform store.
 *
 * - Creates "Policies" and "Info" footer menus (or updates if they exist)
 * - Creates URL redirects for /collections/vendors, /collections/types, /pages/track-your-order
 */

import { createShopifyClient } from "./src/shopify/client.js";
import type { StoreConfig } from "./src/config/store-config.js";
import chalk from "chalk";

// ---------------------------------------------------------------------------
// Config (inline — no need to load from disk)
// ---------------------------------------------------------------------------

import { loadConfig } from "./src/config/store-config.js";

const storeName = process.argv[2] || "Kind Clouds";
const config = await loadConfig(storeName);
if (!config) {
  console.error(chalk.red(`Config not found for ${storeName}`));
  process.exit(1);
}

const client = createShopifyClient(config);

// ---------------------------------------------------------------------------
// Menu definitions
// ---------------------------------------------------------------------------

interface MenuItem {
  title: string;
  url: string;
}

interface MenuDef {
  title: string;
  handle: string;
  items: MenuItem[];
}

const MENUS: MenuDef[] = [
  {
    title: "Main menu",
    handle: "main-menu",
    items: [
      { title: "Home", url: "/" },
      { title: "About Us", url: "/pages/about-us" },
      { title: "Contact Us", url: "/pages/contact-us" },
      { title: "FAQs", url: "/pages/faqs" },
      { title: "Track Your Order", url: "/apps/track123" },
    ],
  },
  {
    title: "Policies",
    handle: "policies",
    items: [
      { title: "Privacy Policy", url: "/policies/privacy-policy" },
      { title: "Return & Refund Policy", url: "/policies/refund-policy" },
      { title: "Shipping Policy", url: "/policies/shipping-policy" },
      { title: "Terms of Service", url: "/policies/terms-of-service" },
      {
        title: "Billing Terms and Conditions",
        url: "/pages/billing-terms-and-conditions",
      },
    ],
  },
  {
    title: "Info",
    handle: "info",
    items: [
      { title: "About Us", url: "/pages/about-us" },
      { title: "Contact Us", url: "/pages/contact-us" },
      { title: "FAQs", url: "/pages/faqs" },
      { title: "Track Your Order", url: "/apps/track123" },
    ],
  },
];

// ---------------------------------------------------------------------------
// Redirect definitions
// ---------------------------------------------------------------------------

interface RedirectDef {
  path: string;
  target: string;
}

const REDIRECTS: RedirectDef[] = [
  { path: "/collections/vendors", target: "/" },
  { path: "/collections/types", target: "/" },
  { path: "/pages/track-your-order", target: "/apps/track123" },
];

// ---------------------------------------------------------------------------
// GraphQL queries & mutations
// ---------------------------------------------------------------------------

const MENUS_LIST_QUERY = `
  query listMenus {
    menus(first: 50) {
      edges {
        node {
          id
          title
          handle
          items {
            id
            title
            url
          }
        }
      }
    }
  }
`;

const MENU_CREATE_MUTATION = `
  mutation menuCreate($title: String!, $handle: String!, $items: [MenuItemCreateInput!]!) {
    menuCreate(title: $title, handle: $handle, items: $items) {
      menu {
        id
        title
        handle
        items {
          id
          title
          url
        }
      }
      userErrors {
        field
        message
      }
    }
  }
`;

const MENU_UPDATE_MUTATION = `
  mutation menuUpdate($id: ID!, $title: String!, $items: [MenuItemUpdateInput!]!) {
    menuUpdate(id: $id, title: $title, items: $items) {
      menu {
        id
        title
        handle
        items {
          id
          title
          url
        }
      }
      userErrors {
        field
        message
      }
    }
  }
`;

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

// Query to check existing redirects
const URL_REDIRECTS_QUERY = `
  query urlRedirects($query: String) {
    urlRedirects(first: 10, query: $query) {
      edges {
        node {
          id
          path
          target
        }
      }
    }
  }
`;

// ---------------------------------------------------------------------------
// Menu logic
// ---------------------------------------------------------------------------

// Cache for the menus list query (so we only fetch once)
let _menusCache: { id: string; title: string; handle: string; items: { id: string; title: string; url: string }[] }[] | null = null;

async function getAllMenus() {
  if (_menusCache) return _menusCache;

  const result = await client.query<{
    menus: {
      edges: {
        node: { id: string; title: string; handle: string; items: { id: string; title: string; url: string }[] };
      }[];
    };
  }>(MENUS_LIST_QUERY);

  _menusCache = result.menus.edges.map((e) => e.node);
  return _menusCache;
}

async function createOrUpdateMenu(menuDef: MenuDef): Promise<void> {
  console.log(chalk.cyan(`\nChecking menu "${menuDef.title}" (handle: ${menuDef.handle})...`));

  // Check if menu already exists by listing all menus and filtering by handle
  const allMenus = await getAllMenus();
  const existingMenu = allMenus.find((m) => m.handle === menuDef.handle);

  const storeUrl = `https://${config.storeName.toLowerCase().replace(/\s+/g, '')}.com`;

  if (existingMenu) {
    console.log(chalk.yellow(`  Menu "${menuDef.title}" already exists (${existingMenu.id}). Updating...`));

    // For update, we need to provide items with URLs and type
    const items = menuDef.items.map((item) => ({
      title: item.title,
      url: `${storeUrl}${item.url}`,
      type: "HTTP",
    }));

    const result = await client.query<{
      menuUpdate: {
        menu: { id: string; title: string; items: { title: string; url: string }[] } | null;
        userErrors: { field: string; message: string }[];
      };
    }>(MENU_UPDATE_MUTATION, {
      id: existingMenu.id,
      title: menuDef.title,
      items,
    });

    if (result.menuUpdate.userErrors.length > 0) {
      console.log(chalk.red(`  Errors updating menu "${menuDef.title}":`));
      result.menuUpdate.userErrors.forEach((e) =>
        console.log(chalk.red(`    - ${e.field}: ${e.message}`))
      );
    } else {
      console.log(chalk.green(`  Menu "${menuDef.title}" updated successfully.`));
      result.menuUpdate.menu?.items.forEach((item) =>
        console.log(chalk.gray(`    - ${item.title} → ${item.url}`))
      );
    }
  } else {
    console.log(chalk.blue(`  Menu "${menuDef.title}" does not exist. Creating...`));

    const items = menuDef.items.map((item) => ({
      title: item.title,
      url: `${storeUrl}${item.url}`,
      type: "HTTP",
    }));

    const result = await client.query<{
      menuCreate: {
        menu: { id: string; title: string; items: { title: string; url: string }[] } | null;
        userErrors: { field: string; message: string }[];
      };
    }>(MENU_CREATE_MUTATION, {
      title: menuDef.title,
      handle: menuDef.handle,
      items,
    });

    if (result.menuCreate.userErrors.length > 0) {
      console.log(chalk.red(`  Errors creating menu "${menuDef.title}":`));
      result.menuCreate.userErrors.forEach((e) =>
        console.log(chalk.red(`    - ${e.field}: ${e.message}`))
      );
    } else {
      console.log(chalk.green(`  Menu "${menuDef.title}" created successfully.`));
      result.menuCreate.menu?.items.forEach((item) =>
        console.log(chalk.gray(`    - ${item.title} → ${item.url}`))
      );
    }
  }
}

// ---------------------------------------------------------------------------
// Redirect logic
// ---------------------------------------------------------------------------

async function createRedirect(redirectDef: RedirectDef): Promise<void> {
  console.log(chalk.cyan(`\nChecking redirect: ${redirectDef.path} → ${redirectDef.target}...`));

  // Check if redirect already exists by querying for the path
  const existing = await client.query<{
    urlRedirects: {
      edges: { node: { id: string; path: string; target: string } }[];
    };
  }>(URL_REDIRECTS_QUERY, { query: `path:${redirectDef.path}` });

  const existingRedirect = existing.urlRedirects.edges.find(
    (e) => e.node.path === redirectDef.path
  );

  if (existingRedirect) {
    console.log(
      chalk.yellow(
        `  Redirect already exists: ${existingRedirect.node.path} → ${existingRedirect.node.target} (${existingRedirect.node.id}). Skipping.`
      )
    );
    return;
  }

  console.log(chalk.blue(`  Creating redirect: ${redirectDef.path} → ${redirectDef.target}...`));

  const result = await client.query<{
    urlRedirectCreate: {
      urlRedirect: { id: string; path: string; target: string } | null;
      userErrors: { field: string; message: string }[];
    };
  }>(URL_REDIRECT_CREATE_MUTATION, {
    urlRedirect: {
      path: redirectDef.path,
      target: redirectDef.target,
    },
  });

  if (result.urlRedirectCreate.userErrors.length > 0) {
    console.log(chalk.red(`  Errors creating redirect:`));
    result.urlRedirectCreate.userErrors.forEach((e) =>
      console.log(chalk.red(`    - ${e.field}: ${e.message}`))
    );
  } else {
    const r = result.urlRedirectCreate.urlRedirect!;
    console.log(chalk.green(`  Redirect created: ${r.path} → ${r.target} (${r.id})`));
  }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  console.log(chalk.bold.white("\n=== Creating Footer Menus & URL Redirects ===\n"));

  // 1. Create/update menus
  console.log(chalk.bold.white("--- Footer Menus ---"));
  for (const menuDef of MENUS) {
    await createOrUpdateMenu(menuDef);
  }

  // 2. Create redirects
  console.log(chalk.bold.white("\n--- URL Redirects ---"));
  for (const redirectDef of REDIRECTS) {
    await createRedirect(redirectDef);
  }

  console.log(chalk.bold.green("\n=== Done! ===\n"));
}

main().catch((err) => {
  console.error(chalk.red("Fatal error:"), err);
  process.exit(1);
});
