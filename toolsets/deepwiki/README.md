# deepwiki

DeepWiki's official remote MCP server (Cognition): read the generated wiki for any public GitHub repository and ask questions about it. Tools: `read_wiki_structure` (topics of a repo's docs), `read_wiki_contents` (the docs themselves) and `ask_question` (an AI-grounded answer about a repo). Useful for understanding an unfamiliar dependency before changing code that uses it.

## Variables

None. The server is free and needs no authentication. It covers public repositories only; private repositories need Devin's authenticated server.

## Notes

- Streamable HTTP at `/mcp` (used here); a legacy SSE endpoint at `/sse` exists for older clients.

Docs: https://docs.devin.ai/work-with-devin/deepwiki-mcp
