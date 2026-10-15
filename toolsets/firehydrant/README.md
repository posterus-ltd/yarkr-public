# firehydrant

FireHydrant's official MCP server (`firehydrant-mcp`, generated with Speakeasy, run with `npx`): call the FireHydrant API for incidents, runbooks, services, teams, on-call and retrospectives from the agent.

## Variables

- `FIREHYDRANT_API_KEY`: a FireHydrant API key, passed as `--api-key`. Create one in FireHydrant's API key settings, with the narrowest permissions that cover what the agent does.

## Notes

- Requires Node.js (for `npx`). Run `npx firehydrant-mcp --help` for other options.
- The key is passed on the command line, so it is visible in the local process list.

Docs: https://github.com/firehydrant/firehydrant-mcp
