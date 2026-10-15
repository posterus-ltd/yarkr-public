# sequential-thinking

The MCP reference sequential-thinking server (`@modelcontextprotocol/server-sequential-thinking`, run with `npx`): one `sequential_thinking` tool that lets the model work through a problem in numbered thoughts it can revise, branch from and extend. Useful for planning, multi-step analysis and problems whose scope is unclear at the start.

## Variables

None required. Optionally set `DISABLE_THOUGHT_LOGGING=true` in the server's `env` to stop it logging thoughts to stderr.

## Notes

- Requires Node.js (for `npx`).
- Models with built-in extended thinking gain less from it; add it where step-by-step structure is wanted explicitly.

Docs: https://github.com/modelcontextprotocol/servers/tree/main/src/sequentialthinking
