# todoist

Doist's official hosted Todoist MCP server: find tasks by date, project or filter, add, update and complete tasks, and manage projects, sections and comments in a Todoist account.

## Variables

None required: the client opens a Todoist OAuth sign-in on first use (in Claude Code, run `/mcp` and select `todoist`).

## Notes

- Local alternative: `npx @doist/todoist-mcp` with `TODOIST_API_KEY` set to your Todoist API token.
- Includes `search` and `fetch` tools in the shape OpenAI's MCP integration expects.
- Write tools change your real task list; use a test project when trying them out.

Docs: https://github.com/Doist/todoist-mcp
