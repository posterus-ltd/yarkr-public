# paypal

PayPal's official hosted MCP server: create and manage invoices, orders and payments, disputes, shipment tracking, catalog products and subscriptions through PayPal's APIs from natural-language requests.

## Variables

None required: the client sends you to a PayPal login and consent screen on first use.

## Notes

- For development, use the sandbox endpoint `https://mcp.sandbox.paypal.com/http`; the production endpoint acts on your live PayPal account.
- PayPal also documents token authorization with your REST app's client credentials from the PayPal Developer Dashboard, sent as an `Authorization: Bearer` header.
- SSE endpoints exist at `/sse` on both hosts; prefer the Streamable HTTP `/http` URL.
- Local alternative: `npx -y @paypal/mcp --tools=all` with `PAYPAL_ACCESS_TOKEN` and `PAYPAL_ENVIRONMENT` (`SANDBOX` or `PRODUCTION`); requires Node.js 18+.

Docs: https://developer.paypal.com/ai-tools/mcp-server
