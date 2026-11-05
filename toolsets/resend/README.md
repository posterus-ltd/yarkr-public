# resend

Resend's official hosted MCP server: send emails, and manage templates, contacts, broadcasts, domains, segments, webhooks and email logs in your Resend account.

## Variables

None required: the client opens a Resend OAuth login on first use (in Claude Code, run `/mcp` and select `resend`).

For servers, CI or headless agents, Resend documents an API key sent as a bearer token:

```json
"headers": { "Authorization": "Bearer ${RESEND_API_KEY}" }
```

Create a key at https://resend.com/api-keys; prefer a sending-only key restricted to one domain if the agent only sends mail. The header isn't in the default config because an unset variable would send an empty token.

## Notes

- Local alternative: `npx -y resend-mcp` with `RESEND_API_KEY` (same open-source code as the hosted server; stdio by default).
- Sending requires a verified domain. Broadcast and send tools reach real recipients; keep them behind approval prompts.

Docs: https://resend.com/docs/mcp-server
