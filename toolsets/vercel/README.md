# vercel

Vercel's official remote MCP server (hosted by Vercel, Streamable HTTP with OAuth): search Vercel documentation, list and manage teams, projects and deployments, read deployment and build logs, deploy code, and query Web Analytics (visitors, page views, custom events).

## Variables

None required: on first use the client opens a browser to sign in to Vercel and approve the connection (in Claude Code, run `/mcp` and authenticate `vercel`). No API key is used.

## Notes

- The connection gets the same access as your Vercel user account, limited by the OAuth grant and your team role.
- Only reviewed clients, or clients that identify themselves with a Client ID Metadata Document, can connect.
- Deploy and project-management tools change live projects; keep human confirmation on.
- Always check the endpoint is exactly `https://mcp.vercel.com`.

Docs: https://vercel.com/docs/agent-resources/vercel-mcp
