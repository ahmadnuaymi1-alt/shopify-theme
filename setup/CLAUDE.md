# CLAUDE.md

## Autonomy Rules

- **Never ask permission** to read files, search code, explore the codebase, edit files, or run commands. Just do it.
- **Always ask permission** before starting a new task or major piece of work. Confirm the approach first, then execute without interruption.
- Once a task is approved, complete it fully without stopping to ask follow-up questions. Use your best judgment for implementation details.
- Use Context7 MCP proactively for any library/API documentation — don't rely on training data alone.
- Use agent teams for complex multi-step tasks that benefit from parallel work.

---

## How to Work

1. **When something breaks** — read the full error, fix the issue, verify it works. If a fix involves paid API calls, ask before retrying.
2. **Stay pragmatic** — focus on getting things done reliably. Don't over-engineer.

---

## Integrations (MCP Servers)

### Supabase
Connected via `.mcp.json`. Use for all database and backend operations.

- `mcp__supabase__list_tables` — see what tables exist in the database
- `mcp__supabase__execute_sql` — run SELECT queries, inserts, updates against Postgres
- `mcp__supabase__apply_migration` — create/alter tables, indexes, RLS policies (DDL operations)
- `mcp__supabase__list_migrations` — see all applied migrations
- `mcp__supabase__get_logs` — pull logs by service (api, auth, postgres, edge-function, storage, realtime)
- `mcp__supabase__get_advisors` — check for security vulnerabilities or performance issues
- `mcp__supabase__deploy_edge_function` — deploy serverless Deno functions
- `mcp__supabase__list_edge_functions` / `get_edge_function` — view existing edge functions
- `mcp__supabase__generate_typescript_types` — generate TypeScript types from the database schema
- `mcp__supabase__get_project_url` / `get_publishable_keys` — get connection details
- `mcp__supabase__create_branch` / `list_branches` / `merge_branch` / `reset_branch` — manage dev branches
- `mcp__supabase__search_docs` — search Supabase documentation via GraphQL

### Context7
Use for looking up **any** library or API documentation with up-to-date code examples. Always use this proactively when working with libraries — don't rely on training data alone.

- `mcp__context7__resolve-library-id` — search for a library by name to get its Context7 ID (must call this first)
- `mcp__context7__query-docs` — fetch documentation and code examples using the resolved library ID

**Example flow:** To look up how to use Supabase Auth in JavaScript:
1. `resolve-library-id` with query "supabase javascript auth" → gets `/supabase/supabase`
2. `query-docs` with libraryId `/supabase/supabase` and query "how to set up authentication"

### Playwright
Use for browser automation, testing, and web scraping.

- `mcp__playwright__browser_navigate` — go to a URL
- `mcp__playwright__browser_click` — click an element
- `mcp__playwright__browser_type` — type text into an input
- `mcp__playwright__browser_screenshot` — capture a screenshot
- `mcp__playwright__browser_snapshot` — get the accessibility tree of the page (useful for understanding page structure)
- `mcp__playwright__browser_wait` — wait for a condition or timeout
- `mcp__playwright__browser_tab_*` — manage browser tabs (list, create, select, close)
- `mcp__playwright__browser_console_messages` — read console output

**Typical flow:** navigate → snapshot (to see elements) → click/type → screenshot (to verify)

### Filesystem MCP
Use for file operations when you need MCP-level file access beyond the built-in Read/Write/Edit tools.

- `mcp__filesystem__read_file` / `write_file` — read or write file contents
- `mcp__filesystem__list_directory` — list files in a directory
- `mcp__filesystem__create_directory` — create new directories
- `mcp__filesystem__move_file` — move or rename files
- `mcp__filesystem__search_files` — search for files by pattern
- `mcp__filesystem__get_file_info` — get file metadata (size, modified date, etc.)