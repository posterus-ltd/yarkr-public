# motherduck

MotherDuck's official remote MCP server, fully managed by MotherDuck: run read-only and read-write SQL against your MotherDuck databases, explore schemas, tables and columns, attach and detach shares, ask questions about DuckDB and MotherDuck documentation, and manage Dives (data visualizations), Flights (scheduled Python jobs) and Guides (shared metric definitions and SQL conventions).

## Variables

None required: sign in with your MotherDuck account (OAuth) in the browser on first use.

For unattended use, MotherDuck also accepts an access token as a header instead of OAuth:

```json
"headers": { "Authorization": "Bearer ${MOTHERDUCK_TOKEN}" }
```

Create the token in MotherDuck's settings; for shared or automated use, prefer a service-account token over a personal one. The header isn't in the default config because an unset variable would send an empty token.

## Notes

- The server exposes both read-only and read-write tools; MotherDuck documents how to restrict an assistant to read-only access.
- Data is processed in your organization's region, but query results pass through the MCP server, which is routed to the region nearest the client.
- For local `.duckdb` files, in-memory DuckDB or S3 data, use MotherDuck's local server (`uvx mcp-server-motherduck`) instead.

Docs: https://motherduck.com/docs/sql-reference/mcp/
