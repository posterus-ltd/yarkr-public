# neon

Neon's official hosted MCP server: list, create and delete Neon projects; create, reset and delete branches; run SQL and transactions; inspect and compare schemas; apply schema changes on a temporary branch before committing them; run database diagnostics (table sizes, unused indexes, slow queries, locks, bloat); and manage computes, snapshots, Neon Auth, Data API, functions and storage.

## Variables

None required: on first use the client opens a browser to authorize access to your Neon account (OAuth). You can pick read-only scope during authorization.

For clients without OAuth or remote agents, Neon documents a Neon API key (create one in the Neon Console) sent as a header:

```json
"headers": { "Authorization": "Bearer ${NEON_API_KEY}" }
```

## Notes

- Restrict scope with URL parameters: `?readonly=true`, `?projectId=<id>` (one project), `?category=querying&category=schema` (tool categories), `?roleName=<role>` (SQL runs as that Postgres role).
- Neon recommends MCP for development and testing only, not production databases; review every write before approving it.
- If IP Allow is on, allowlist the hosted server's addresses `34.192.103.46` and `23.22.233.166`.
- The local `@neondatabase/mcp-server-neon` package is deprecated and the old `/sse` endpoint is retired (410).

Docs: https://neon.com/docs/ai/neon-mcp-server
