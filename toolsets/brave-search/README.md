# brave-search

Brave's official Brave Search MCP server (`@brave/brave-search-mcp-server`, run locally with `npx`): web, news, image and video search, local business and place search, an LLM-context tool that returns page content for grounding, and AI summaries of search results (`brave_summarizer`), all from Brave's independent search index.

## Variables

- `BRAVE_API_KEY`: a Brave Search API key, passed to the server as an environment variable. Sign up at https://brave.com/search/api/ and create a key in the developer dashboard (https://api-dashboard.search.brave.com/app/keys). Some parameters (e.g. `extra_snippets`) need a Pro plan.

## Notes

- Requires Node.js (for `npx`).
- Narrow the tool list with `BRAVE_MCP_ENABLED_TOOLS` or `BRAVE_MCP_DISABLED_TOOLS` (space-separated tool names) in `env`.
- A Docker image is also published: `docker run -i --rm -e BRAVE_API_KEY mcp/brave-search`.

Docs: https://github.com/brave/brave-search-mcp-server
