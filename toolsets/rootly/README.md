# rootly

Rootly's official hosted MCP server: manage incidents, alerts, on-call schedules, workflows and retrospectives in Rootly, and find similar past incidents to speed up triage.

## Variables

- `ROOTLY_API_TOKEN`: a Rootly API token, sent as `Authorization: Bearer ${ROOTLY_API_TOKEN}`. Create one in Rootly's API key settings.

## Notes

- Rootly recommends OAuth for interactive use: remove the `headers` block and the client opens a browser to sign in to Rootly.
- SSE alternative endpoint: `https://mcp.rootly.com/sse`. To self-host, run `uvx rootly-mcp-server`.

Docs: https://github.com/rootlyhq/rootly-mcp-server
