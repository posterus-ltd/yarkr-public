# redis

Redis's official MCP server (`redis-mcp-server`, run locally with `uvx`): read and write strings (with expiry), hashes, lists, sets, sorted sets, streams (including consumer groups), JSON documents and pub/sub; create vector indexes and run vector search; read server info; and search the Redis docs.

## Variables

- `REDIS_URL`: a Redis connection URI passed as the `--url` argument, e.g. `redis://user:password@host:6379/0` or `rediss://...` for TLS. Use a Redis ACL user with only the commands the agent needs, e.g. a read-only user (`ACL SETUSER readonlyuser on >password ~* +@read -@write`).

## Notes

- Requires `uv`; the package targets Python 3.14+, which `uvx` can fetch.
- Connection details can instead be set as environment variables (`REDIS_HOST`, `REDIS_PORT`, `REDIS_USERNAME`, `REDIS_PWD`, `REDIS_SSL`, `REDIS_CLUSTER_MODE`); Azure Managed Redis supports Entra ID auth.
- Write and delete tools change live data; point it at a development instance or a read-only ACL user.
- stdio transport only.

Docs: https://github.com/redis/mcp-redis
