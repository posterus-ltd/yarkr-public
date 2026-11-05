# netlify

Netlify's official remote MCP server (hosted by Netlify): lets the agent use the Netlify API and CLI to create projects, build and deploy sites, manage environment variables and secrets, access controls, forms and extensions, and read user and team information.

## Variables

None required: the server uses OAuth, so the client opens a browser to sign in to Netlify on first use.

## Notes

- Use `https://mcp.netlify.com/mcp` for new connections; the older `https://netlify-mcp.netlify.app/mcp` still works.
- Local alternative where remote servers aren't allowed: `"command": "npx", "args": ["-y", "@netlify/mcp"]`, which needs Node.js 22 or newer. If its sign-in fails, Netlify documents temporarily setting `NETLIFY_PERSONAL_ACCESS_TOKEN` in `env` (create one under User settings → OAuth → New access token) and removing it afterwards.
- Deploy, env-var and access-control tools change live sites; keep them behind approval prompts.

Docs: https://docs.netlify.com/welcome/build-with-ai/netlify-mcp-server/
