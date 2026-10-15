# context7

Context7's official remote MCP server (Upstash): fetches current, version-specific documentation and code examples for libraries and frameworks into the prompt, so the agent writes code against today's APIs instead of its training data.

## Variables

None required: the server works without a key at lower rate limits.

For higher limits, get an API key at https://context7.com/dashboard and add it as a header, as Context7 documents:

```json
"headers": { "Authorization": "Bearer ${CONTEXT7_API_KEY}" }
```

The header isn't in the default config because an unset variable would send an empty token.

Docs: https://github.com/upstash/context7
