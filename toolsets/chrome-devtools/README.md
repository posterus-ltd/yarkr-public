# chrome-devtools

The Chrome DevTools team's official MCP server (`chrome-devtools-mcp`, run with `npx`): controls and inspects a live Chrome browser, with navigation and input automation, console messages with source-mapped stack traces, network requests, screenshots, performance traces with insights, Lighthouse audits and heap snapshots.

## Variables

None required.

## Notes

- Requires Node.js LTS and current stable Chrome. The browser starts on the first tool that needs it.
- Google collects usage statistics by default; add `--no-usage-statistics` to `args` to opt out. Performance tools may send URLs to the CrUX API; add `--no-performance-crux` to disable.
- Useful flags: `--headless`, `--isolated`, and `--slim` for a reduced tool set.
- The agent can read and change anything in the browser profile it controls; avoid profiles holding personal or sensitive sessions.

Docs: https://github.com/ChromeDevTools/chrome-devtools-mcp
