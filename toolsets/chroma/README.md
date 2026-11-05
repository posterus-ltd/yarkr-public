# chroma

Chroma's official local MCP server (`chroma-mcp`, run with `uvx`), configured here for Chroma Cloud: list, create, modify and delete collections, add, update and delete documents, and query them with semantic search, full-text search and metadata filters. Tools include `chroma_list_collections`, `chroma_create_collection`, `chroma_peek_collection`, `chroma_add_documents`, `chroma_query_documents`, `chroma_get_documents`, `chroma_update_documents` and `chroma_delete_documents`.

## Variables

- `CHROMA_TENANT`: your Chroma Cloud tenant ID.
- `CHROMA_DATABASE`: the Chroma Cloud database the agent works in.
- `CHROMA_API_KEY`: a Chroma Cloud API key, passed to the server as an environment variable. Create it in the Chroma Cloud dashboard and scope it to the one database the agent needs.

## Notes

- Requires `uv` (for `uvx`). The cloud client connects to `api.trychroma.com` over SSL.
- For other setups change `--client-type`: `ephemeral` (in-memory), `persistent` with `--data-dir <path>`, or `http` with `--host`, `--port` and `--ssl` for a self-hosted Chroma. Those modes don't need the cloud variables.
- Collections created with an external embedding function (`cohere`, `openai`, `jina`, `voyageai`, `roboflow`) also need that provider's key as `CHROMA_<PROVIDER>_API_KEY`.
- Delete tools remove collections and documents permanently; keep them behind approval prompts.

Docs: https://github.com/chroma-core/chroma-mcp
