# asana

Asana's official hosted MCP server (V2): search and read tasks, projects, sections, portfolios and goals, create and update tasks and projects, and summarise project status across the Asana work graph, acting as the signed-in Asana user.

## Variables

None in the config file, but the V2 server requires OAuth with a pre-registered client: create an Asana MCP app at https://app.asana.com/0/my-apps (see Asana's integration guide), set its redirect URL to `http://localhost:8080/callback` for Claude Code, and note the client ID and client secret. Asana documents adding the server with:

```bash
claude mcp add --transport http --client-id YOUR_CLIENT_ID --client-secret --callback-port 8080 asana https://mcp.asana.com/v2/mcp
```

`--client-secret` prompts for the secret so it isn't stored in shell history. Then run `/mcp` to sign in to Asana.

## Notes

- The V1 beta endpoint `https://mcp.asana.com/sse` is deprecated and shut down on 2026-05-11; use the V2 URL.
- Enterprise+ admins can allow or block each MCP client app through Asana app management; a blocked app prompts the user to request access.
- Write tools create and modify real tasks and projects; keep them behind approval prompts.

Docs: https://developers.asana.com/docs/connecting-mcp-clients-to-asanas-v2-server
