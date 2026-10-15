# slack

Slack's official remote MCP server: search messages, files, users and channels, read channels and threads, send and schedule messages, and read and create canvases. In incident response it lets the agent follow and post to the incident channel.

## Variables

None. The server uses OAuth only: the config carries Slack's published client ID for Claude Code (`1601185624273.8899143856786`, callback port 3118), and on first use the client opens a browser to approve access to your workspace. No token goes in the config.

## Notes

- A workspace admin must approve the MCP integration first.
- Streamable HTTP only. Actions run as you, with the scopes you approve.
- In Claude Code you can also install it as a plugin: `claude plugin install slack`.

Docs: https://docs.slack.dev/ai/slack-mcp-server/
