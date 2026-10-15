# memory

The MCP reference memory server (`@modelcontextprotocol/server-memory`, run with `npx`): persistent knowledge-graph memory kept in a local file. The agent stores entities, relations between them and observations about them, and recalls them across sessions. Tools: `create_entities`, `create_relations`, `add_observations`, `delete_entities`, `delete_observations`, `delete_relations`, `read_graph`, `search_nodes`, `open_nodes`.

## Variables

- `MEMORY_FILE_PATH` (optional, recommended): where the graph is stored. Without it the server writes `memory.jsonl` next to its own code, which can disappear when the npx cache is cleared. To set it, add to the server config:

  ```json
  "env": { "MEMORY_FILE_PATH": "${MEMORY_FILE_PATH}" }
  ```

## Notes

- Requires Node.js (for `npx`).
- The file is plain JSONL: don't store secrets in it, and keep it out of version control unless you mean to share it.

Docs: https://github.com/modelcontextprotocol/servers/tree/main/src/memory
