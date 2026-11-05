# databricks

Databricks' managed Databricks SQL MCP server (`system.ai.dbsql`), hosted in your workspace and served through Unity Gateway: the agent runs SQL it writes against your Unity Catalog tables on a SQL warehouse, inspects schemas and validates syntax, with your own Unity Catalog and warehouse permissions. Queries run asynchronously; the agent starts a query and polls for the result.

## Variables

- `DATABRICKS_HOST`: your workspace host name, without `https://` or a path (for example `dbc-a1b2c3d4-e5f6.cloud.databricks.com`).
- `DATABRICKS_WORKSPACE_ID`: your workspace ID, used in the `?o=` query parameter.

No token is needed: open `/mcp` and sign in with your Databricks account (OAuth). Databricks endpoints don't support dynamic client registration, so the config uses the Claude Code client ID and callback port 3118 that Databricks documents; to use your own OAuth app instead, have an account admin create one with redirect `http://localhost:8080/callback` and the `ai-gateway` scope, then set its client ID and port 8080.

## Notes

- `system.ai.dbsql` needs the Unity Gateway beta, enabled by an account admin on the account console Previews page.
- It allows writes by default. To make it read-only, set `disallow_writes` to `true` in the built-in `system.ai.dbsql_policy` policy.
- Other Databricks MCPs use the same URL pattern with a different name, e.g. `system.ai.genie_one_mcp` for natural-language analytics. The older workspace endpoint `https://<host>/api/2.0/mcp/sql` (scope `sql`) still works for existing integrations but bypasses Unity Gateway governance.
- Databricks' `ug` CLI (`ug claude`) can configure Claude Code and MCPs for you.

Docs: https://docs.databricks.com/aws/en/agents/mcp-tools/databricks-sql
