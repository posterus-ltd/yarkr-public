# notion

Notion's official hosted MCP server: search the workspace (and, on Business/Enterprise with Notion AI, connected sources), read pages, create and update pages, query databases and data sources, add comments and upload files, acting as the signed-in Notion member.

## Variables

None required: the client opens Notion's OAuth sign-in on first use (in Claude Code, run `/mcp` and pick `notion`). Access is limited to what the signed-in member can see; workspace guests can't connect.

For non-interactive use (CI, headless agents) on Business and Enterprise plans, a workspace owner can create an MCP token in Notion's Developer portal (**New MCP token**) and the client sends it as a bearer token:

```json
"headers": { "Authorization": "Bearer ${NOTION_MCP_TOKEN}" }
```

The header isn't in the default config because an unset variable would send an empty token.

## Notes

- If a client only supports SSE, use `https://mcp.notion.com/sse` with `"type": "sse"`.
- The older self-hosted open-source Notion MCP server is no longer actively maintained; use this hosted endpoint.
- Write tools create and edit real pages; keep them behind approval prompts.

Docs: https://developers.notion.com/guides/mcp/get-started-with-mcp
