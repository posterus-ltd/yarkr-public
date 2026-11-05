# dbt

dbt Labs' official remote MCP server, hosted on the dbt platform: query Semantic Layer metrics, explore models, sources and lineage through the Discovery API, use Administrative API tools, and run SQL (`execute_sql`, `text_to_sql`) against your warehouse. It does not run dbt CLI commands such as `dbt run`, `dbt build` or `dbt test`.

## Variables

- `DBT_HOST` (optional): your dbt platform host name, without `https://`. Defaults to `cloud.getdbt.com`; multi-cell accounts use a host like `ACCOUNT_PREFIX.us1.dbt.com`. The exact URL is under Account settings → Access URLs → MCP Endpoint URL.

No key is needed: sign in to dbt in the browser on first use (OAuth, public beta for Starter, Enterprise and Enterprise+ accounts) and approve the requested scopes and projects.

For clients or automation without OAuth, dbt documents token headers instead:

```json
"headers": {
  "Authorization": "Token ${DBT_TOKEN}",
  "x-dbt-prod-environment-id": "${DBT_PROD_ENV_ID}"
}
```

The token needs Developer access on the project that owns that environment. `execute_sql` additionally needs a personal access token (not a service token) plus `x-dbt-dev-environment-id` and `x-dbt-user-id` headers.

## Notes

- Token access is all-or-nothing: a valid token gets every tool. Use OAuth scopes, or the `x-dbt-disable-tools` / `x-dbt-disable-toolsets` headers, to narrow it.
- `text_to_sql` uses dbt Copilot actions and is hidden when an admin turns AI features off; the other tools keep working.
- To run dbt commands against a local project, use dbt's self-hosted server (`uvx dbt-mcp`).

Docs: https://docs.getdbt.com/docs/dbt-ai/setup-remote-mcp
