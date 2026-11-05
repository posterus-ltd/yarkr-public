# shopify-dev

Shopify's official Dev MCP server (`@shopify/dev-mcp`, runs locally with `npx`): search Shopify developer docs, look up Admin and Storefront GraphQL API schemas, and validate GraphQL queries, Liquid templates and Shopify extension code against Shopify's schemas. It reads developer resources and does not touch a store.

## Variables

None required: the server runs locally and needs no authentication.

## Notes

- Requires Node.js 18 or higher.
- Shopify now recommends its AI Toolkit plugin (which bundles this server with agent skills); this package is the MCP-only option.

Docs: https://shopify.dev/docs/apps/build/ai-toolkit
