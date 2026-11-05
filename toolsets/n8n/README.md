# n8n

n8n's built-in instance-level MCP server (on n8n Cloud and self-hosted): search workflows, run and test workflows you've marked as available in MCP, build and edit workflows and data tables, and manage agents on your own n8n instance.

## Variables

- `N8N_HOST`: your n8n domain without `https://`, e.g. `your-instance.app.n8n.cloud` or `n8n.example.com`. The full Server URL is shown in n8n under **Settings → Instance-level MCP → Connect a client**; it ends in `/mcp-server/http`.

Authentication is OAuth: in Claude Code run `/mcp`, select `n8n` and approve access in n8n. Alternatively, n8n's **API key** tab generates a personal access token sent as `"headers": { "Authorization": "Bearer ${N8N_MCP_TOKEN}" }`.

## Notes

- An owner or admin must first turn on **Enable MCP access** under **Settings → Instance-level MCP**; each workflow must then be enabled for MCP individually (or per project/folder).
- `execute_workflow` runs the published version by default; workflow-building tools need n8n 2.13.0+.
- Use `http://` for a local instance such as `localhost:5678`. Cloud-based clients need the instance to be publicly reachable.
- Owners and admins can restrict OAuth callback URLs to trusted ones.

Docs: https://docs.n8n.io/connect/connect-to-n8n-mcp-server
