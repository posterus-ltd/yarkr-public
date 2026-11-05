# pinecone

Pinecone's official Developer MCP server (`@pinecone-database/mcp`, run with `npx`), aimed at coding assistants: search the Pinecone documentation, list and describe indexes and their stats, create indexes with integrated embedding, upsert records and documents, search an index with metadata filters and reranking, search across several indexes at once (`cascading-search`) and rerank documents.

## Variables

- `PINECONE_API_KEY`: a Pinecone API key, passed to the server as an environment variable. Create it in the Pinecone console (https://app.pinecone.io), ideally in a development project rather than production. Without a key the server can still search the documentation but can't touch indexes.

## Notes

- Requires Node.js 22 or later (for `npx`).
- Only indexes with integrated inference (and document indexes with string fields) are supported; searching with your own vectors, standalone embeddings and Assistants are not.
- Upsert and create tools write to your project. Pinecone's separate Assistant MCP is a different server, for retrieving context from a Pinecone Assistant knowledge base.

Docs: https://docs.pinecone.io/guides/agents/mcp-server
