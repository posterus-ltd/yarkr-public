# auth0

Auth0's official MCP server (`@auth0/auth0-mcp-server`, run locally with `npx`, beta): list, create and update applications, APIs (resource servers) and client grants, write and deploy Actions, read tenant logs, create and publish Forms, and onboard a project by creating an application and writing its credentials to a `.env` file, through the Auth0 Management API.

## Variables

None required in the config. Before first use, run `npx @auth0/auth0-mcp-server init` once: it starts an OAuth device authorization flow in the browser, lets you pick the tenant, and stores the token in the OS keychain. Run `init` again to switch tenants or after the token expires, and `npx @auth0/auth0-mcp-server logout` when done.

## Notes

- Requires Node.js. Private Cloud tenants can't use the device flow; use `init --auth0-domain ... --auth0-client-id ... --auth0-client-secret ...` with a machine-to-machine app limited to the scopes you need.
- Read-only mode: add `--read-only` to `args` (or set `AUTH0_MCP_READ_ONLY=true`); `--tools 'auth0_list_*,auth0_get_*'` narrows tools further. `--read-only` wins if both are set.
- Write tools (`auth0_deploy_action`, `auth0_publish_form`, application updates) change the live tenant; keep them behind approval prompts and use a development tenant where possible.
- Sends anonymized usage analytics; set `AUTH0_MCP_ANALYTICS=false` to opt out.

Docs: https://github.com/auth0/auth0-mcp-server
