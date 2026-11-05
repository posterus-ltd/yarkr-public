# zapier

Zapier's official hosted MCP server: run actions across the thousands of apps connected to your Zapier account (send emails, create tasks, update records, search data) through the tools you enable on your Zapier MCP server.

## Variables

None required: in Claude Code, Zapier signs you in with OAuth on first use and connects the client to your default Zapier MCP server, creating it the first time.

For clients that can't do OAuth, Zapier documents a connection token: create a server at https://mcp.zapier.com, choose **Other**, generate a token under **Settings → API token**, and send it as a header:

```json
"headers": { "Authorization": "Bearer ${ZAPIER_MCP_TOKEN}" }
```

Treat it like a password: anyone holding it can run that server's tools. Rotating the token invalidates the old one immediately.

## Notes

- Each successful tool call uses two tasks from your Zapier plan.
- Only the actions you enable on the server are exposed; enable the minimum set.
- On Claude Team or Enterprise, an Owner can roll Zapier out to the organization instead of each user adding it.

Docs: https://docs.zapier.com/mcp/get-started/connect/claude-code
