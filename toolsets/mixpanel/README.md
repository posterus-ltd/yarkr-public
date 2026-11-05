# mixpanel

Mixpanel's official hosted MCP server: run event, funnel and retention queries, explain and build reports and dashboards, inspect and clean up Lexicon events and properties, triage data quality issues, look at user sessions, create and manage experiments and feature flags, and query the audit log in your Mixpanel projects.

## Variables

None required: the server uses OAuth. Your client opens a browser to sign in to Mixpanel on first use, and your existing project permissions apply.

For headless use, Mixpanel documents service-account auth (beta): base64-encode `<username>:<secret>` of a service account (`echo -n "<username>:<secret>" | base64`) and send it as a header:

```json
"headers": { "Authorization": "Bearer Basic ${MIXPANEL_SA_TOKEN}" }
```

Add the service account only to the projects the agent should see.

## Notes

- EU data residency: `https://mcp-eu.mixpanel.com/mcp`; India: `https://mcp-in.mixpanel.com/mcp`.
- An org admin must enable MCP in the organization settings (it is on by default only for free and growth accounts created after August 1, 2026); changes can take 15 minutes.
- The assistant can write (boards, Lexicon, flags, experiments); changes are recorded in the audit log with Origin "MCP".

Docs: https://docs.mixpanel.com/docs/features/mcp
