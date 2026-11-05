# clickhouse

ClickHouse's official MCP server (`mcp-clickhouse`, run locally with `uv`): list databases, list tables with their columns and `CREATE TABLE` statements, and run SQL against any ClickHouse server or ClickHouse Cloud service, including `EXPLAIN ESTIMATE` to check a query's estimated reads before running it.

## Variables

- `CLICKHOUSE_HOST`: hostname of your ClickHouse server (the database endpoint).
- `CLICKHOUSE_USER`: ClickHouse username. Create a dedicated user with `SELECT` grants on only the databases the agent needs.
- `CLICKHOUSE_PASSWORD`: that user's password.

All three are passed as environment variables. The connection uses HTTPS on port 8443 by default; for a local server over plain HTTP, add `"CLICKHOUSE_SECURE": "false"` (port 8123) to `env`. Set `CLICKHOUSE_PORT` or `CLICKHOUSE_DATABASE` if needed.

## Notes

- Queries are read-only by default (enforced server-side with `readonly=1`). `CLICKHOUSE_ALLOW_WRITE_ACCESS=true` enables writes; destructive statements (DROP, TRUNCATE, DELETE, UPDATE) additionally need `CLICKHOUSE_ALLOW_DROP=true`.
- The ClickHouse user's grants are the real security boundary; the server-side checks are a guard against accidents.
- Requires `uv`; it fetches Python 3.12 and the package on first run.
- The optional chDB extra (`mcp-clickhouse[chdb]`) adds an embedded engine for querying files and URLs without a server.

Docs: https://github.com/ClickHouse/mcp-clickhouse
