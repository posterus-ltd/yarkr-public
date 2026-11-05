# google-mcp-toolbox

Google's open-source MCP Toolbox for Databases (`@toolbox-sdk/server`, run locally with `npx`), started with a prebuilt toolset: the agent can list schemas and tables, inspect table structure and run SQL against one database. Prebuilt toolsets cover PostgreSQL, MySQL, SQL Server, SQLite, AlloyDB, Cloud SQL, Spanner, BigQuery, Firestore, Looker, Oracle, MongoDB, Redis, Elasticsearch, ClickHouse, Neo4j, Snowflake, Trino and more.

## Variables

- `TOOLBOX_PREBUILT` (optional): which prebuilt toolset to load, e.g. `postgres`, `mysql`, `bigquery`, `spanner`, `sqlite`. Defaults to `postgres`. Use `<database>/<toolset>` to load a subset, e.g. `postgres/data` for only the SQL tools.
- Connection variables for that database, read from the environment the client starts the server in. For `postgres`: `POSTGRES_HOST`, `POSTGRES_PORT`, `POSTGRES_DATABASE`, `POSTGRES_USER`, `POSTGRES_PASSWORD`. Other databases use their own names, listed in the prebuilt configs reference. Connect as a database user with only the privileges the agent needs, read-only where possible.

## Notes

- Requires Node.js (for `npx`). Toolbox also ships as a standalone binary and via Homebrew (`brew install mcp-toolbox`).
- Prebuilt toolsets include tools that execute arbitrary SQL; use a read-only database role or a non-production database.
- For your own curated tools, start it with `--config tools.yaml` instead of `--prebuilt`.
- The project was formerly `googleapis/genai-toolbox` and is now `googleapis/mcp-toolbox`.

Docs: https://mcp-toolbox.dev/documentation/configuration/prebuilt-configs/
