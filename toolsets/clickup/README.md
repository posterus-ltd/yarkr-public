# clickup

ClickUp's official hosted MCP server: search tasks, docs and comments, create and update tasks with assignees, priorities and due dates across lists and spaces, log time and manage timers, and post comments and chat messages in a ClickUp workspace. It has no delete tools.

## Variables

None required: ClickUp supports OAuth 2.1 with PKCE only (API keys and personal tokens are not accepted). The client opens a ClickUp sign-in on first use.

## Notes

- Available on all ClickUp plans. Without the Everything AI add-on, tool calls are capped per workspace and per client over a rolling 24 hours (100 on Free Forever up to 25,000 on Enterprise Plus); with the add-on, public API limits apply.
- Rate-limited calls return `RATE_LIMIT_EXCEEDED` with `retryAfter`.

Docs: https://developer.clickup.com/docs/connect-an-ai-assistant-to-clickups-mcp-server
