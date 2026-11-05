# tavily

Tavily's official hosted MCP server: real-time web search (`tavily_search`), clean content extraction from URLs (`tavily_extract`), site crawling (`tavily_crawl`), site-structure mapping (`tavily_map`) and multi-source research with a detailed answer (`tavily_research`).

## Variables

None required: on first use the client opens a browser to sign in to Tavily (OAuth). Requests are billed to the key named `mcp_auth_default` in your Tavily account, or your `default` key if none has that name.

For clients without OAuth, Tavily documents sending an API key (from https://app.tavily.com) as a header:

```json
"headers": { "Authorization": "Bearer ${TAVILY_API_KEY}" }
```

## Notes

- A `DEFAULT_PARAMETERS` header with a JSON object (e.g. `{"search_depth": "advanced", "max_results": 10}`) sets defaults for every request.
- The key can also be passed as `?tavilyApiKey=...` in the URL; prefer the header so the key stays out of URLs and logs.
- Local alternative: `npx -y tavily-mcp` with `TAVILY_API_KEY` (Node.js).

Docs: https://docs.tavily.com/documentation/mcp
