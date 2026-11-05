# shadcn

The official shadcn/ui MCP server (the `shadcn` CLI's `mcp` command, run with `npx`): browse and search components, blocks and templates in the shadcn/ui registry and any registries configured in the project's `components.json`, and install them into the project.

## Variables

None required for the public shadcn/ui registry.

Private registries declare their auth headers in `components.json` (e.g. `"Authorization": "Bearer ${REGISTRY_TOKEN}"`); set those variables in the project's `.env.local`.

## Notes

- Requires Node.js (for `npx`). Run it from the project root so it finds `components.json`.
- Installing components writes files into the project.

Docs: https://ui.shadcn.com/docs/mcp
