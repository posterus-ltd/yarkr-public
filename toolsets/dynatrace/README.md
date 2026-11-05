# dynatrace

Dynatrace's official remote MCP server, hosted in your own Dynatrace environment: generate, explain and run DQL queries, investigate problems and vulnerabilities, analyze Kubernetes events, forecast and analyze timeseries, resolve entity names and IDs, and answer product questions from Dynatrace documentation.

## Variables

- `DT_ENVIRONMENT`: your environment URL, e.g. `https://abc12345.apps.dynatrace.com` (no trailing slash).
- `DT_PLATFORM_TOKEN`: a Dynatrace platform token (`dt0s16.…`), sent as `Authorization: Bearer ${DT_PLATFORM_TOKEN}`. Generate one under Access Tokens → Generate new token. It needs `mcp-gateway:servers:invoke` and `mcp-gateway:servers:read` plus the scopes of the tools you want (e.g. `storage:logs:read`, `storage:metrics:read`, `davis:analyzers:execute`); grant only those, and the token never exceeds your user permissions.

## Notes

- A confidential OAuth client (authorization code grant, client ID and secret) is the alternative; the server does not support dynamic client registration or public clients yet.
- Dynatrace's own Claude Code plugin uses this same URL and `DT_ENVIRONMENT` / `DT_PLATFORM_TOKEN` variables.
- Some tools use Davis CoPilot generative AI and need the `davis-copilot:*` scopes.

Docs: https://docs.dynatrace.com/docs/dynatrace-intelligence/dynatrace-mcp
