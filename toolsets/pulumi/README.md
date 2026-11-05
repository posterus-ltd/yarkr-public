# pulumi

Pulumi's official hosted MCP server (Streamable HTTP, nothing to install): query Pulumi Cloud stacks, users and policy violations, search resources across your organization, look up Pulumi Registry docs, generate infrastructure code, deploy to AWS, and start Pulumi Neo tasks.

## Variables

None required: on first connect the client opens a browser where you paste a Pulumi access token, choose a default organization and authorize the connection (in Claude Code, run `/mcp` and authenticate `pulumi`).

For headless use, Pulumi documents sending the token as headers instead:

```json
"headers": { "Authorization": "Bearer ${PULUMI_MCP_TOKEN}", "X-Pulumi-Org": "<your-org>" }
```

`PULUMI_MCP_TOKEN` is a Pulumi access token; create a separate one for the agent, preferably an organization token (scoped to one org and its role) rather than a personal token. The header isn't in the default config because an unset variable would send an empty token.

## Notes

- If `X-Pulumi-Org` is missing or names an org the token can't access, the server silently uses the first organization the token can reach.
- The server never runs `pulumi up`, but `neo-bridge` starts Neo tasks that can incur usage costs.

Docs: https://www.pulumi.com/docs/iac/guides/ai-integration/mcp-server/
