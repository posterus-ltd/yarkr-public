# incident-io

incident.io's official remote MCP server: declare, triage and update incidents, manage alerts and escalations, check and edit on-call schedules, run investigations, draft status page updates, search runbooks and post-mortems, and track follow-ups, with 80+ tools.

## Variables

None. The server uses OAuth: on first use the client opens a browser to sign in to incident.io, and actions are attributed to your user. The grant lasts 28 days before you approve it again.

## Notes

- Available on incident.io Team, Pro and Enterprise plans.
- For unattended automation, incident.io also accepts an API key (Settings → API keys) as `Authorization: Bearer <key>`; add a `headers` block with `${INCIDENT_IO_API_KEY}` for that case.

Docs: https://docs.incident.io/ai/remote-mcp
