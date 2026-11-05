# atlassian

Atlassian's official hosted MCP server (Rovo, v2): search and summarize Jira, Jira Service Management, Confluence, Bitbucket, Goals and Loom content, and create or update Jira work items and Confluence pages, all with your existing Atlassian permissions.

## Variables

None required: the server uses OAuth 2.1. Sign in to your Atlassian site in the browser on first use (in Claude Code, run `/mcp` and authenticate).

Atlassian also supports API-token auth in a header, with fewer tools available:

- Personal API token: `"Authorization": "Basic ${ATLASSIAN_BASIC_AUTH}"`, where the value is base64 of `email:api_token`.
- Service account API key: `"Authorization": "Bearer ${ATLASSIAN_API_KEY}"`, created by an Atlassian admin.

Give tokens only the scopes the agent needs.

## Notes

- Calls that pull or reason over data consume Rovo credits from your organization's shared pool.
- MCP gateways that need a flat tool list can use `https://mcp.atlassian.com/v2/mcp?tools=all`.
- Write tools change live Jira and Confluence content; review high-impact changes before confirming.

Docs: https://support.atlassian.com/atlassian-ai-gateway/docs/get-started-with-the-atlassian-remote-mcp-server/
