# perplexity

Perplexity's official hosted MCP server: ranked web search results (`perplexity_search`), quick cited answers (`perplexity_ask`), in-depth multi-source research reports (`perplexity_research`) and step-by-step reasoning over a question (`perplexity_reason`).

## Variables

None required: on first use the client opens a browser to sign in to Perplexity and choose the API organization to bill (OAuth). You must be an admin of an API organization that can pay for usage.

For clients without OAuth, Perplexity documents sending an API key (create one at https://console.perplexity.ai/project/keys) as a header:

```json
"headers": { "Authorization": "Bearer ${PERPLEXITY_API_KEY}" }
```

## Notes

- Tool calls are billed at standard Perplexity API pricing to the key or organization you connect with, and that organization's rate limits apply.
- The OAuth connection can only call the API; it cannot create keys, view balances or manage the organization.
- Local alternative: `npx -y @perplexity-ai/mcp-server` with `PERPLEXITY_API_KEY` (Node.js).

Docs: https://docs.perplexity.ai/docs/getting-started/integrations/mcp-server
