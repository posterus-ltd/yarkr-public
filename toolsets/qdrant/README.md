# qdrant

Qdrant's official local MCP server (`mcp-server-qdrant`, run with `uvx`): a semantic memory layer over a Qdrant collection. It has two tools: `qdrant-store` saves a piece of information with optional metadata, and `qdrant-find` retrieves the stored entries most relevant to a query. Text is embedded locally with FastEmbed.

## Variables

- `QDRANT_URL`: URL of your Qdrant server or Qdrant Cloud cluster, for example `http://localhost:6333`.
- `QDRANT_API_KEY`: API key for the cluster, passed to the server as an environment variable. Create one in Qdrant Cloud; a key limited to the one collection is enough. Leave it empty for a local Qdrant without auth.
- `COLLECTION_NAME`: the default collection to store in and search. With a default set, the tools don't take a collection argument.

## Notes

- Requires `uv` (for `uvx`). The embedding model is downloaded on first use.
- The default model is `sentence-transformers/all-MiniLM-L6-v2`; set `EMBEDDING_MODEL` in `env` to change it, and keep it the same for everything that reads the collection.
- Set `QDRANT_READ_ONLY=true` in `env` to remove `qdrant-store`. Set `QDRANT_LOCAL_PATH` instead of `QDRANT_URL` to use an on-disk database (not both).
- `TOOL_STORE_DESCRIPTION` and `TOOL_FIND_DESCRIPTION` rewrite the tool descriptions, e.g. to turn it into a code-snippet store.

Docs: https://github.com/qdrant/mcp-server-qdrant
