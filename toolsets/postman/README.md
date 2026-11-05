# postman

Postman's official remote MCP server: create, read and update workspaces, collections, requests, environments and environment variables, API specifications and mocks in your Postman account. The default minimal toolset covers everyday edits; the full toolset has 100+ Postman API tools.

## Variables

None required: the US remote server uses OAuth. Your client opens a browser to sign in to Postman on first use.

The EU server and API-key setups use a Postman API key (create one in Postman under Settings → API keys) as a header:

```json
"headers": { "Authorization": "Bearer ${POSTMAN_API_KEY}" }
```

## Notes

- Toolsets by path: `/minimal` (default here), `/code` (client code generation from API definitions), `/mcp` (full).
- EU region: `https://mcp.eu.postman.com/minimal` (or `/code`, `/mcp`); OAuth isn't supported there, so the API-key header is required.
- To test APIs on localhost, use the local server instead (`npx @postman/postman-mcp-server` with `POSTMAN_API_KEY`); the remote server can't reach your machine.

Docs: https://github.com/postmanlabs/postman-mcp-server
