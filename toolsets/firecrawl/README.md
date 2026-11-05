# firecrawl

Firecrawl's official hosted MCP server: search the web, scrape pages to clean markdown, crawl and map sites, parse documents and extract structured data, so the agent can research and pull content from websites.

## Variables

None required: this URL uses browser sign-in. On first use, sign in to Firecrawl and approve a team (in Claude Code, run `/mcp` and authenticate). Review and revoke connections in Firecrawl's MCP settings.

To use an API key instead, switch to the API-key endpoint and add a header, as Firecrawl documents:

```json
"url": "https://mcp.firecrawl.dev/v2/mcp",
"headers": { "Authorization": "Bearer ${FIRECRAWL_API_KEY}" }
```

Create the key at https://www.firecrawl.dev/app/api-keys.

## Notes

- `https://mcp.firecrawl.dev/v2/mcp` without a key works keyless, rate limited, with search, scrape and parse only.
- Usage counts against your Firecrawl team's plan credits.
- A local server (`npx firecrawl-mcp` with `FIRECRAWL_API_KEY`) is also available.

Docs: https://docs.firecrawl.dev/mcp-server
