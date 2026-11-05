# elasticsearch

Elastic's official MCP server, built into Elastic Agent Builder in Kibana (Elastic Stack 9.2+ and Serverless): exposes Agent Builder's built-in tools, such as index search, listing indices and mappings and running ES|QL queries, plus any custom ES|QL, index search and workflow tools you define, so the agent can query your Elasticsearch data without opening Kibana.

## Variables

- `KIBANA_URL`: your Kibana base URL, including `https://`. For a custom space, use `https://<kibana>/s/<space-id>`.
- `ES_API_KEY`: an Elasticsearch (or Serverless project) API key, sent as `Authorization: ApiKey ${ES_API_KEY}`. Create it with `POST /_security/api_key` or in Kibana. It must include the Kibana application privilege `feature_agentBuilder.read` (otherwise you get a 403); limit index privileges to `read` and `view_index_metadata` on the indices the agent needs, and set an expiration.

## Notes

- Serverless projects also support OAuth 2.1 through an application connection: register an MCP client in Elastic, drop the `headers` block and use the MCP server URL shown in that client's details.
- Tools run with the API key's permissions; an over-broad key exposes every index it can read.
- This replaces the deprecated `mcp-server-elasticsearch` package.

Docs: https://www.elastic.co/docs/explore-analyze/ai-features/agent-builder/mcp-server
