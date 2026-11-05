# new-relic

New Relic's official remote MCP server (hosted by New Relic): run NRQL or turn plain-English questions into NRQL, look up entities, check alerts and generate alert insight reports, analyze deployment impact, logs and golden metrics, and investigate traces and service dependencies in your New Relic accounts.

## Variables

None required: the server uses OAuth. Your client opens a browser to sign in to New Relic on first use; tokens act as you and never exceed your roles. New Relic documents OAuth as the supported method for Claude Code.

## Notes

- EU accounts: change the URL to `https://mcp.eu.newrelic.com/mcp/`.
- Your group needs an organization role that can read the MCP server, and the "New Relic MCP Server" and "Local Clients" toggles must be on in the feature control manager.
- A User API key (`NRAK-...`, `api-key` header) works only for some clients, needs the "API Keys" toggle, and loses the AI-powered and preview tools, which are OAuth-only.
- Narrow the tool list with an `include-tags` header, e.g. `"headers": { "include-tags": "discovery,alerting" }`.

Docs: https://docs.newrelic.com/docs/agentic-ai/mcp/setup/
