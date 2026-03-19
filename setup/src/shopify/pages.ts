/**
 * Shopify Admin API — Page management.
 *
 * Create or update store pages (About Us, FAQ, Contact, etc.).
 */

import chalk from "chalk";
import ora from "ora";
import type { ShopifyClient } from "./client.js";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface PageNode {
  id: string;
  title: string;
  handle: string;
}

interface PagesQueryResult {
  pages: {
    edges: Array<{ node: PageNode }>;
  };
}

interface PageCreateResult {
  pageCreate: {
    page: PageNode | null;
    userErrors: Array<{ field: string[]; message: string }>;
  };
}

interface PageUpdateResult {
  pageUpdate: {
    page: PageNode | null;
    userErrors: Array<{ field: string[]; message: string }>;
  };
}

// ---------------------------------------------------------------------------
// GraphQL queries / mutations
// ---------------------------------------------------------------------------

const PAGES_QUERY = `
  query getPageByHandle($query: String!) {
    pages(first: 1, query: $query) {
      edges {
        node {
          id
          title
          handle
        }
      }
    }
  }
`;

const PAGE_CREATE_MUTATION = `
  mutation pageCreate($page: PageCreateInput!) {
    pageCreate(page: $page) {
      page {
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

const PAGE_UPDATE_MUTATION = `
  mutation pageUpdate($id: ID!, $page: PageUpdateInput!) {
    pageUpdate(id: $id, page: $page) {
      page {
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

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Create a page if it doesn't exist, or update it if it does.
 *
 * Matching is done by `handle`.
 */
export async function createOrUpdatePage(
  client: ShopifyClient,
  title: string,
  handle: string,
  bodyHtml: string,
  templateSuffix: string = "",
): Promise<{ id: string; handle: string }> {
  // 1. Check if a page with this handle already exists
  const existing = await client.query<PagesQueryResult>(PAGES_QUERY, {
    query: `handle:${handle}`,
  });

  const existingPage = existing.pages.edges[0]?.node;

  if (existingPage) {
    // ---- Update existing page ----
    const result = await client.query<PageUpdateResult>(PAGE_UPDATE_MUTATION, {
      id: existingPage.id,
      page: { title, body: bodyHtml, templateSuffix },
    });

    const errors = result.pageUpdate.userErrors;
    if (errors.length > 0) {
      const msg = errors.map((e) => e.message).join("; ");
      console.log(chalk.red(`  Failed to update page "${handle}": ${msg}`));
      throw new Error(`Failed to update page "${handle}": ${msg}`);
    }

    const page = result.pageUpdate.page!;
    console.log(chalk.green(`  Updated page: ${page.handle} (${page.id})`));
    return { id: page.id, handle: page.handle };
  }

  // ---- Create new page ----
  const result = await client.query<PageCreateResult>(PAGE_CREATE_MUTATION, {
    page: { title, handle, body: bodyHtml, templateSuffix },
  });

  const errors = result.pageCreate.userErrors;
  if (errors.length > 0) {
    const msg = errors.map((e) => e.message).join("; ");
    console.log(chalk.red(`  Failed to create page "${handle}": ${msg}`));
    throw new Error(`Failed to create page "${handle}": ${msg}`);
  }

  const page = result.pageCreate.page!;
  console.log(chalk.green(`  Created page: ${page.handle} (${page.id})`));
  return { id: page.id, handle: page.handle };
}

/**
 * Create or update multiple pages with progress feedback.
 */
export async function createAllPages(
  client: ShopifyClient,
  pages: Array<{ title: string; handle: string; bodyHtml: string; templateSuffix?: string }>,
): Promise<void> {
  const spinner = ora("Creating/updating pages...").start();

  let succeeded = 0;
  let failed = 0;

  for (const page of pages) {
    spinner.text = `Creating/updating page: ${page.handle} (${succeeded + failed + 1}/${pages.length})`;

    try {
      await createOrUpdatePage(client, page.title, page.handle, page.bodyHtml, page.templateSuffix ?? "");
      succeeded++;
    } catch (err: unknown) {
      failed++;
      const message = err instanceof Error ? err.message : String(err);
      console.log(chalk.red(`  Error with page "${page.handle}": ${message}`));
    }
  }

  if (failed > 0) {
    spinner.warn(
      chalk.yellow(
        `Pages done: ${succeeded} succeeded, ${failed} failed out of ${pages.length}.`,
      ),
    );
  } else {
    spinner.succeed(
      chalk.green(`All ${succeeded} pages created/updated successfully.`),
    );
  }
}
