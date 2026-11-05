# intercom

Intercom's official hosted MCP server: search and fetch conversations, contacts and companies, filter conversations by state, assignee and source, add internal notes, and list, search, create and update Help Center articles in your Intercom workspace.

## Variables

None required: OAuth is the recommended setup and the client opens an Intercom sign-in on first use.

For headless use, Intercom documents a bearer token instead (an Intercom access token with the read users/companies, read/write conversations and read/write articles permissions):

```json
"headers": { "Authorization": "Bearer ${INTERCOM_ACCESS_TOKEN}" }
```

The header isn't in the default config because an unset variable would send an empty token.

## Notes

- EU-hosted workspaces (`app.eu.intercom.com`): use `https://mcp.eu.intercom.com/mcp`. AU-hosted workspaces aren't supported yet.
- Fin Operator tools are only granted through OAuth, not bearer tokens.
- The `/sse` endpoints are deprecated; use `/mcp`.

Docs: https://developers.intercom.com/docs/guides/mcp
