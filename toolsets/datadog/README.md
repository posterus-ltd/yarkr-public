# datadog

Datadog's official remote MCP server (hosted by Datadog): search logs, spans and events, query metrics, inspect dashboards, monitors, incidents, hosts, services and notebooks, and, with extra toolsets, work with APM, RUM, error tracking, synthetics, CI visibility, DDSQL, feature flags, workflows and more in your Datadog organization.

## Variables

None required: the server uses OAuth 2.0. Your client opens a browser to sign in to Datadog on first use, and tools act with your Datadog role.

Where OAuth isn't possible (CI, servers), Datadog documents header auth with a Personal or Service Access Token:

```json
"headers": { "Authorization": "Bearer ${DD_ACCESS_TOKEN}" }
```

or an API key and application key sent as `DD_API_KEY` and `DD_APPLICATION_KEY` headers. Use a service account with only the permissions it needs.

## Notes

- The URL is for US1. Other sites: `https://mcp.us3.datadoghq.com/v1/mcp`, `mcp.us5.datadoghq.com`, `mcp.datadoghq.eu`, `mcp.ap1.datadoghq.com`, `mcp.ap2.datadoghq.com`, `mcp.uk1.datadoghq.com` (same `/v1/mcp` path). Gov sites are not supported.
- Only the `core` toolset loads by default; add `?toolsets=core,apm,...` (or `toolsets=all`) to the URL, and `omit_tools=` to drop specific tools.
- Users need the `mcp_read` / `mcp_write` role permissions, and an org admin must enable MCP Access (and MCP Write Access for write tools) in Organization Settings.
- Orgs that sign in through a custom subdomain should add `?subdomain=<SUBDOMAIN>` to the URL.

Docs: https://docs.datadoghq.com/bits_ai/mcp_server/setup/
