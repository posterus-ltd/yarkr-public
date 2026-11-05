# microsoft-learn

Microsoft's official hosted Learn MCP server: searches Microsoft Learn and Azure documentation, fetches full doc pages as markdown, and finds official Microsoft/Azure code samples, so the agent answers .NET, Azure, Microsoft 365 and Windows questions from current first-party docs. Tools: `microsoft_docs_search`, `microsoft_docs_fetch`, `microsoft_code_sample_search`.

## Variables

None required: the server is free and needs no key or sign-in.

## Notes

- Read-only; it only accesses public Microsoft documentation.
- Append `?maxTokenBudget=2000` to the URL to cap how much text search results return (marked experimental by Microsoft).

Docs: https://github.com/MicrosoftDocs/mcp
