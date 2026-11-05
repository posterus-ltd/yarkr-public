# linear

Linear's official hosted MCP server: find, create and update issues, projects, cycles, milestones and comments in your Linear workspace, for example turning a planning doc into a project with issues, or posting standup notes as comments on the matching issues.

## Variables

None required: the server uses OAuth 2.1. Sign in to Linear in the browser on first use (in Claude Code, run `/mcp` and authenticate).

Linear also accepts a personal API key or OAuth token in a header instead of the sign-in flow:

```json
"headers": { "Authorization": "Bearer ${LINEAR_API_KEY}" }
```

Create a personal API key in your Linear settings; a key with only the Read permission gives read-only access.

## Notes

- For read-only access, use `https://mcp.linear.app/mcp/readonly`, which only exposes read tools.
- Each sign-in is bound to one workspace; use a separate server entry per workspace.
- The SSE endpoint `https://mcp.linear.app/sse` is deprecated.

Docs: https://linear.app/docs/mcp
