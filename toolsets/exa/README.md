# exa

Exa's official hosted MCP server: web search that returns ready-to-use page content (`web_search_exa`), clean content from known URLs (`web_fetch_exa`), filtered search (`web_search_advanced_exa`, opt-in) and `agent_run`, a multi-step research agent for list-building, enrichment and structured answers.

## Variables

None required: the plain URL works without a key for search and fetch at a free rate limit (`agent_run` is unavailable keyless).

To use your Exa account, either connect to `https://mcp.exa.ai/mcp?login` to sign in with OAuth in the browser, or add an API key from https://dashboard.exa.ai/api-keys as a header, as Exa documents:

```json
"headers": { "x-api-key": "${EXA_API_KEY}" }
```

## Notes

- Pick tools with the `tools` URL parameter, e.g. `?tools=web_search_exa,web_fetch_exa,web_search_advanced_exa,agent_run`; an explicit list replaces the defaults.
- `agent_run` is usage-based and billed to your Exa team.
- Local alternative: `npx -y exa-mcp-server` with `EXA_API_KEY` (Node.js).

Docs: https://exa.ai/docs/get-started/exa-mcp
