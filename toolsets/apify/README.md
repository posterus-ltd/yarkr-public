# apify

Apify's official hosted MCP server: search Apify Store for Actors (ready-made scrapers and crawlers), read an Actor's input schema and pricing, run it, then read the resulting datasets and key-value stores. Default tools also browse and fetch web pages through the `apify/rag-web-browser` and `apify/web-fetch` Actors and search the Apify docs.

## Variables

None required: on first use the client opens a browser to sign in to Apify and approve access (OAuth).

For clients without OAuth, Apify documents sending an API token instead (create one in Apify Console → Settings → API & Integrations):

```json
"headers": { "Authorization": "Bearer ${APIFY_TOKEN}" }
```

## Notes

- Choose tools with the `tools` URL parameter, e.g. `https://mcp.apify.com?tools=actors,docs,apify/rag-web-browser`; categories `runs`, `storage`, `tasks` and `schedules` are off by default.
- With only `search-actors`, `fetch-actor-details`, `search-apify-docs` and `fetch-apify-docs` in `tools`, the server works without an account.
- Running Actors costs Apify platform credits; set run limits such as `maxTotalChargeUsd` and keep `call-actor` behind approval prompts.
- Local alternative: `npx -y @apify/actors-mcp-server` with `APIFY_TOKEN` (Node.js).

Docs: https://docs.apify.com/mcp
