# box

Box's official hosted MCP server: search and read files and folders, ask Box AI questions over documents, and work with Box content, limited to what the signed-in user can already view or edit.

## Variables

None in the config file: the client signs in with Box OAuth on first use. A Box admin must first enable the integration in the Box Admin Console (**Integrations**, MCP category; for Claude Code, set **Claude** to *Available to all users*). For clients that need their own credentials, the admin configures the **Box MCP server** integration, adds integration credentials and copies the generated client ID and client secret, with the client's redirect URI and the scopes it may use.

## Notes

- Requires a Box enterprise account with the MCP server enabled by an admin.
- Scopes are `root_readwrite`, `ai.readwrite` and `docgen.readwrite` (the last needs Enterprise Advanced); grant only what the agent needs.

Docs: https://developer.box.com/guides/box-mcp/setup
