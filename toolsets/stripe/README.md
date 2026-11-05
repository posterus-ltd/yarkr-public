# stripe

Stripe's official hosted MCP server: search and call most of the Stripe API through `stripe_api_read` and `stripe_api_write` (customers, charges, PaymentIntents, refunds, invoices, subscriptions and more), query analytics, and search Stripe's documentation and support articles.

## Variables

None required: in Claude Code, run `/mcp` and authenticate with Stripe OAuth. The consent page lets you pick live accounts or sandboxes and set permissions per environment.

For autonomous clients that can't use OAuth, Stripe documents an agent API key (created in the Dashboard, shown with an **Agent** badge) sent as a bearer token:

```json
"headers": { "Authorization": "Bearer ${STRIPE_AGENT_API_KEY}" }
```

Give the key only the permissions the agent needs. From December 2026 the server rejects full-access secret keys and restricted keys without the Agent tag.

## Notes

- `stripe_api_write` can create refunds, customers and other live objects; connect to a sandbox first and keep write tools behind approval prompts.
- Admins can turn MCP access on or off per team, separately for live mode and sandboxes, and revoke OAuth sessions in the Dashboard.

Docs: https://docs.stripe.com/mcp
