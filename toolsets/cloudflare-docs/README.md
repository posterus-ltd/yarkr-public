# cloudflare-docs

Cloudflare's official hosted documentation MCP server: searches the full Cloudflare Developer Documentation (Workers, R2, D1, KV, AI Search, Zero Trust and every other product) through one tool, `search_cloudflare_documentation`, so the agent answers from current docs.

## Variables

None required: this public server needs no authentication and no Cloudflare account.

## Notes

- Read-only; it cannot see or change your Cloudflare account.
- Use the `/mcp` URL; the old `/sse` URL now returns `410 Gone`.
- For acting on your account, Cloudflare recommends its API MCP server at `https://mcp.cloudflare.com/mcp` (OAuth), documented in the cloudflare/mcp repo.

Docs: https://github.com/cloudflare/mcp-server-cloudflare/tree/main/apps/docs-ai-search
