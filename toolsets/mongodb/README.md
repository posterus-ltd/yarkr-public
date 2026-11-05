# mongodb

MongoDB's official MCP server (`mongodb-mcp-server`, run locally with `npx`): connect to any MongoDB deployment to list databases and collections, inspect schemas and indexes, run find, aggregate and count, and (with writes enabled) insert, update and delete documents and manage indexes. With Atlas API credentials it also administers Atlas projects, clusters, database users and IP access lists.

## Variables

- `MDB_MCP_CONNECTION_STRING`: a MongoDB connection string (`mongodb://` or `mongodb+srv://`), passed as an environment variable. Use a database user with only the roles the agent needs (e.g. `read` on one database).

For Atlas administration tools, also add `MDB_MCP_API_CLIENT_ID` and `MDB_MCP_API_CLIENT_SECRET` (an Atlas service account's credentials, with the minimum Atlas permissions) to `env`.

## Notes

- Starts with `--readOnly`; remove it only when the agent must write. Destructive tools (drop, delete-many, Atlas user and access-list creation) ask for confirmation in clients that support elicitation.
- Requires Node.js 22.13 or later.
- Narrow tools with `MDB_MCP_DISABLED_TOOLS` (names, operation types or categories).
- MongoDB also runs an Atlas-managed remote server with OAuth; see the docs for client-specific setup.

Docs: https://github.com/mongodb-js/mongodb-mcp-server
