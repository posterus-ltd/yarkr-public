# render

Render's official hosted MCP server: list and select workspaces, create web services, static sites, cron jobs, Postgres databases and Key Value instances, update a service's environment variables, trigger and inspect deploys, filter logs, fetch CPU, memory, bandwidth and response metrics, and run read-only SQL against Render Postgres.

## Variables

- `RENDER_API_KEY`: a Render API key, sent as `Authorization: Bearer ${RENDER_API_KEY}`. Create one on your Account Settings page in the Render Dashboard. The key has your account's access across workspaces, so use an account that only belongs to the workspaces the agent should touch.

## Notes

- OAuth sign-in is supported through Render's official plugins, which configure the server with a pre-registered client (`"oauth": { "clientId": "claude" }` in Claude Code); with OAuth, drop the `headers` block and sign in in the browser on first use.
- Set the workspace first ("Set my Render workspace to ..."); every action is scoped to it.
- Render warns the server can do destructive things: updating environment variables and triggering deploys change live services.
- Render recommends the hosted server over running it locally (Docker image or binary).

Docs: https://render.com/docs/mcp-server
