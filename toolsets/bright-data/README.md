# bright-data

Bright Data's official hosted MCP server: search engines, scrape any page to markdown or HTML, run Bright Data's pre-built structured scrapers (e-commerce, social, business data), and drive a remote browser (navigate, click, type, screenshot). Requests go through Bright Data's unblocking infrastructure, so pages behind bot detection, CAPTCHAs or geo-restrictions still return.

## Variables

- `BRIGHTDATA_API_TOKEN`: a Bright Data API token, sent as the `token` query parameter in the server URL (no username needed). Find or create it in Bright Data's account settings (https://brightdata.com/cp/setting/users). Use a token for a dedicated user so you can revoke it without affecting other integrations.

## Notes

- All 32 tools load by default. Limit them with URL parameters: `&groups=scrapers,browser` (groups: `scrapers`, `browser`, `advanced_scraping`, `geo`) or `&tools=<name,...>`.
- An SSE endpoint is also offered: `https://mcp.brightdata.com/sse?token=...`.
- Usage is billed per request after the free monthly allowance; the token in the URL is a secret, so keep this config out of shared logs.
- Local alternative: `npx -y @brightdata/mcp` with `API_TOKEN` (Node.js).

Docs: https://docs.brightdata.com/products/mcp-server/remote/quickstart
