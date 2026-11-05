# browserbase

Browserbase's official hosted MCP server: runs cloud browser sessions driven by Stagehand, so the agent can start and end sessions, navigate, act on pages in natural language ("click the login button"), observe actionable elements and extract structured data. Sessions and replays appear in the Browserbase dashboard.

## Variables

- `BROWSERBASE_API_KEY`: your Browserbase API key, sent as the `browserbaseApiKey` query parameter on the server URL (Browserbase's documented method). Copy it from the Browserbase dashboard. Because the key is part of the URL, keep it out of shared logs and committed configs.

## Notes

- Stagehand uses `google/gemini-2.5-flash-lite` by default, with model costs covered by Browserbase. To use another model, add `&modelName=...&modelApiKey=...` to the URL.
- Optional query parameters: `keepAlive`, `proxies`, `verified` (exact strings `"true"` or `"false"`).
- The open-source `@browserbasehq/mcp` repository is archived; use the hosted server.

Docs: https://docs.browserbase.com/integrations/mcp/setup
