# hubspot

HubSpot's official hosted MCP server: search and read CRM records (contacts, companies, deals, tickets, leads, custom objects), activities, conversations, marketing content and analytics, and create or update records, activities, pages, campaigns, pipelines and properties, always within the signed-in user's HubSpot permissions.

## Variables

None in the config file, but you need an MCP connector: in HubSpot go to **Development → MCP Connectors → Create MCP connector**, set the redirect URL your client uses, and copy the connector's client ID and client secret into your client's OAuth settings. HubSpot requires OAuth with PKCE.

## Notes

- Scopes aren't chosen on the connector; they follow the server's tools and what the user grants at install. Re-install when HubSpot adds tools that need new scopes.
- With Sensitive Data turned on, activities and conversations are blocked through MCP.
- This is separate from HubSpot's developer MCP server for building apps and CMS assets.
- Write tools change live CRM data and can publish pages; keep them behind approval prompts.

Docs: https://developers.hubspot.com/docs/apps/developer-platform/build-apps/integrate-with-the-remote-hubspot-mcp-server
