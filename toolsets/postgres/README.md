# postgres

Postgres MCP Pro, a community server by Crystal DBA (`postgres-mcp`, run locally with `uvx`), for any PostgreSQL database: list schemas and objects, describe tables, run SQL, explain query plans (including with hypothetical indexes), report the slowest queries, recommend indexes for a workload or specific queries, and run health checks (cache hit rate, connections, constraints, index health, sequences, vacuum).

## Variables

- `DATABASE_URI`: a PostgreSQL connection URI (`postgresql://user:password@host:5432/dbname`), passed as an environment variable. Connect as a dedicated role with only the grants the agent needs; a read-only role for production.

## Notes

- Runs in `--access-mode=restricted`: read-only transactions with execution-time limits. Change to `--access-mode=unrestricted` only for development databases.
- Index tuning and top-queries need the `pg_stat_statements` and `hypopg` extensions on the database.
- Requires `uv` (Python 3.12+); a Docker image `crystaldba/postgres-mcp` is also published.
- Not an official PostgreSQL project.

Docs: https://github.com/crystaldba/postgres-mcp
