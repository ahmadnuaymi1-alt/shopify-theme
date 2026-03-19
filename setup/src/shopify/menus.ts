/**
 * Shopify Admin API — Navigation menu management.
 *
 * Create or update navigation menus (footer links, policies, etc.).
 * For updates, the existing menu is deleted and recreated — simpler than
 * diffing individual menu items.
 */

import chalk from "chalk";
import ora from "ora";
import type { ShopifyClient } from "./client.js";
import type { StoreConfig } from "../config/store-config.js";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface MenuItemNode {
  id: string;
  title: string;
  url: string;
}

interface MenuNode {
  id: string;
  title: string;
  handle: string;
  items: {
    edges: Array<{ node: MenuItemNode }>;
  };
}

interface MenusQueryResult {
  menus: {
    edges: Array<{ node: MenuNode }>;
  };
}

interface MenuCreateResult {
  menuCreate: {
    menu: { id: string; title: string; handle: string } | null;
    userErrors: Array<{ field: string[]; message: string }>;
  };
}

interface MenuDeleteResult {
  menuDelete: {
    deletedMenuId: string | null;
    userErrors: Array<{ field: string[]; message: string }>;
  };
}

interface MenuItem {
  title: string;
  url: string;
}

// ---------------------------------------------------------------------------
// GraphQL queries / mutations
// ---------------------------------------------------------------------------

const MENUS_QUERY = `
  query getMenuByHandle($query: String!) {
    menus(first: 10, query: $query) {
      edges {
        node {
          id
          title
          handle
          items(first: 20) {
            edges {
              node {
                id
                title
                url
              }
            }
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
      }
      userErrors {
        field
        message
      }
    }
  }
`;

const MENU_DELETE_MUTATION = `
  mutation menuDelete($id: ID!) {
    menuDelete(id: $id) {
      deletedMenuId
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
 * Create a navigation menu, or replace it if one with the same handle exists.
 *
 * If the menu already exists it is deleted first, then recreated with the
 * new items. This is simpler (and less error-prone) than trying to diff and
 * patch individual menu items.
 */
export async function createOrUpdateMenu(
  client: ShopifyClient,
  title: string,
  handle: string,
  items: MenuItem[],
): Promise<void> {
  // 1. Check if a menu with this handle already exists
  const existing = await client.query<MenusQueryResult>(MENUS_QUERY, {
    query: `handle:${handle}`,
  });

  const existingMenu = existing.menus.edges.find(
    (e) => e.node.handle === handle,
  )?.node;

  // 2. Delete the existing menu if found
  if (existingMenu) {
    console.log(
      chalk.dim(`  Deleting existing menu "${handle}" (${existingMenu.id})...`),
    );

    const deleteResult = await client.query<MenuDeleteResult>(
      MENU_DELETE_MUTATION,
      { id: existingMenu.id },
    );

    const deleteErrors = deleteResult.menuDelete.userErrors;
    if (deleteErrors.length > 0) {
      const msg = deleteErrors.map((e) => e.message).join("; ");
      console.log(
        chalk.red(`  Failed to delete existing menu "${handle}": ${msg}`),
      );
      throw new Error(`Failed to delete existing menu "${handle}": ${msg}`);
    }
  }

  // 3. Create the menu with the new items
  const menuItems = items.map((item) => ({
    title: item.title,
    url: item.url,
  }));

  const createResult = await client.query<MenuCreateResult>(
    MENU_CREATE_MUTATION,
    { title, handle, items: menuItems },
  );

  const createErrors = createResult.menuCreate.userErrors;
  if (createErrors.length > 0) {
    const msg = createErrors.map((e) => e.message).join("; ");
    console.log(chalk.red(`  Failed to create menu "${handle}": ${msg}`));
    throw new Error(`Failed to create menu "${handle}": ${msg}`);
  }

  const menu = createResult.menuCreate.menu!;
  console.log(
    chalk.green(
      `  ${existingMenu ? "Replaced" : "Created"} menu: ${menu.handle} (${menu.id}) with ${items.length} items.`,
    ),
  );
}

/**
 * Create the default footer menus ("Policies" and "Info").
 */
export async function createFooterMenus(
  client: ShopifyClient,
  _config: StoreConfig,
): Promise<void> {
  const spinner = ora("Creating footer menus...").start();

  try {
    // ---- Policies menu ----
    spinner.text = "Creating Policies menu...";
    await createOrUpdateMenu(client, "Policies", "policies", [
      { title: "Privacy Policy", url: "/policies/privacy-policy" },
      { title: "Return & Refund Policy", url: "/policies/refund-policy" },
      { title: "Shipping Policy", url: "/policies/shipping-policy" },
      { title: "Terms of Service", url: "/policies/terms-of-service" },
      {
        title: "Billing Terms and Conditions",
        url: "/pages/billing-terms-and-conditions",
      },
    ]);

    // ---- Info menu ----
    spinner.text = "Creating Info menu...";
    await createOrUpdateMenu(client, "Info", "info", [
      { title: "About Us", url: "/pages/about-us" },
      { title: "Contact Us", url: "/pages/contact-us" },
      { title: "FAQ", url: "/pages/faqs" },
      { title: "Track Your Order", url: "/apps/track123" },
    ]);

    spinner.succeed(chalk.green("Footer menus created successfully."));
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    spinner.fail(chalk.red(`Failed to create footer menus: ${message}`));
    throw err;
  }
}
