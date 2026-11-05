# sentry

Sentry's official hosted MCP server: look up issues and events, read stack traces, search errors, traces and logs, inspect projects, releases and teams, and trigger Seer root-cause analysis on an issue. It is built for debugging workflows in coding agents.

## Variables

None required: the server uses OAuth. Sign in to Sentry in the browser on first use (in Claude Code, run `/mcp` and authenticate).

Clients that send custom headers can skip OAuth and pass a Sentry user auth token instead, as Sentry documents:

```json
"headers": { "Authorization": "Sentry-Bearer ${SENTRY_AUTH_TOKEN}" }
```

Create a User Auth Token in Sentry with only the scopes you need (Sentry lists `org:read`, `project:read`, `project:write`, `team:read`, `team:write`, `event:write`). Note the `Sentry-Bearer` prefix, not `Bearer`.

## Notes

- Scope the connection to one org or project with `https://mcp.sentry.dev/mcp/<org-slug>/<project-slug>`.
- Narrow the exposed tools with `?skills=inspect,triage` or `?disable-skills=seer`.
- Self-hosted Sentry: use the local `npx @sentry/mcp-server@latest` with `SENTRY_HOST` and `SENTRY_AUTH_TOKEN` (Node.js required). Its AI-powered search tools need an LLM provider key.

Docs: https://github.com/getsentry/sentry-mcp
