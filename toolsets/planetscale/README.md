# planetscale

PlanetScale's official hosted MCP server (Vitess and Postgres): list organizations, databases and branches, read branch schema and metrics, query Insights (slow queries, errors, query tags) and schema recommendations, read Postgres logs and invoices, search the PlanetScale docs, and run read or write queries with short-lived credentials created per query.

## Variables

None required: on first use the client opens a browser to sign in to PlanetScale with OAuth and choose scopes: no access, read-only or full, per organization or per database.

For CI or headless clients, PlanetScale documents a service token (create one in organization settings; use the token value starting `pscale_tkn_`, not the ID) sent as a header:

```json
"headers": { "Authorization": "Bearer ${PLANETSCALE_API_TOKEN}" }
```

Grant the token only the organization and database permissions the tools need.

## Notes

- Insights-only variant without query execution: `https://mcp.pscale.dev/mcp/planetscale-insights-only`.
- `planetscale_execute_write_query` can change production data; grant read-only query scope unless writes are needed. Org admins can cap MCP query access for all members in organization settings.
- Payment-method tools exist; leave payment access at "no access" in the OAuth prompt.

Docs: https://planetscale.com/docs/mcp-server
