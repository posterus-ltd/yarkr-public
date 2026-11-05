# playwright

Microsoft's official Playwright MCP server (`@playwright/mcp`, run with `npx`): drives a real browser through accessibility snapshots instead of screenshots, so the agent can navigate, click, type, fill forms, manage tabs, take screenshots and inspect pages without a vision model.

## Variables

None required.

## Notes

- Requires Node.js 18 or newer.
- The browser is headed by default; add `--headless` to `args` for CI or servers. Add `--isolated` to keep the profile in memory, or when running several clients at once.
- Extra tool groups are opt-in with `--caps` (e.g. `vision`, `pdf`, `devtools`, `network`, `storage`, `testing`).
- Microsoft suggests its Playwright CLI with skills for coding agents where token use matters.

Docs: https://github.com/microsoft/playwright-mcp
