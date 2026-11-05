# monday

monday.com's official hosted MCP server: read board schemas and items, create and update items, column values, groups and updates, create boards and columns, look up users and teams, and work with WorkForms in a monday.com account.

## Variables

None required: the server uses OAuth, and the client opens a monday.com sign-in on first use. Install the monday MCP app from the monday.com marketplace (https://monday.com/marketplace/listing/10000806/monday-mcp) to enable OAuth and restrict access to specific workspaces.

## Notes

- Local alternative: `npx @mondaydotcomorg/monday-api-mcp@latest` with `MONDAY_TOKEN` set to a personal API token (avatar → Developers → My access tokens). The local server supports `--read-only` and `--enable-dynamic-api-tools` (full GraphQL access; not compatible with read-only).
- Tools include deletes (`delete_item`, `delete_column`); keep write tools behind approval prompts.

Docs: https://github.com/mondaycom/mcp
