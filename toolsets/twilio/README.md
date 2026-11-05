# twilio

Twilio's official MCP server (`@twilio-alpha/mcp` from Twilio Labs, Alpha, runs locally with `npx`): exposes Twilio's public REST APIs as tools, generated from Twilio's OpenAPI specs, so an agent can send messages, manage phone numbers, Studio flows, Serverless functions and other Twilio resources.

## Variables

- `TWILIO_ACCOUNT_SID`: your Twilio Account SID (starts with `AC`), from the Twilio Console.
- `TWILIO_API_KEY` and `TWILIO_API_SECRET`: an API key SID and secret created in the Console under API keys. They are passed together as one argument, `ACCOUNT_SID/API_KEY:API_SECRET`. Prefer a restricted API key with only the permissions the agent needs, and a test or sub-account where you can.

## Notes

- Twilio's APIs are too large to load at once; `--services` picks which spec to load (here `twilio_api_v2010`, the core API). Change it, or use `--tags` to select individual endpoints (pass `--services ''` when filtering by tags only).
- This is a Twilio Labs proof of concept; expect changes. Twilio advises not running community MCP servers alongside it.
- Tools can send messages and buy numbers on your account; keep write tools behind approval prompts. Requires Node.js 18+.

Docs: https://github.com/twilio-labs/mcp
