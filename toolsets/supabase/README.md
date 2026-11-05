# supabase

Supabase's official hosted MCP server: list and manage projects and organizations, inspect tables, extensions and migrations, run SQL and apply migrations, query logs and security/performance advisors, list and deploy Edge Functions, generate TypeScript types, manage branches (paid plans) and search the Supabase docs.

## Variables

None required: on first use the client opens a browser to sign in to Supabase and choose the organization to grant access to (OAuth with dynamic client registration; no personal access token needed).

For CI or headless use, Supabase documents a personal access token (create one at https://supabase.com/dashboard/account/tokens, scoped to one project with only the permissions your tools need) sent as a header:

```json
"headers": { "Authorization": "Bearer ${SUPABASE_ACCESS_TOKEN}" }
```

## Notes

- Scope the server with URL parameters: `?project_ref=<id>` (one project, hides account tools), `?read_only=true` (queries run as a read-only Postgres user), `?features=database,docs` (tool groups). They combine, e.g. `?project_ref=abc123&read_only=true`.
- `execute_sql`, `apply_migration`, `deploy_edge_function` and `create_project` change live resources; Supabase recommends connecting development projects, not production, and keeping manual approval of tool calls on.
- Local development with the Supabase CLI: use `http://localhost:54321/mcp`.

Docs: https://supabase.com/docs/guides/ai-tools/mcp
