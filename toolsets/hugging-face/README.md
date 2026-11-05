# hugging-face

Hugging Face's official remote MCP server, hosted at huggingface.co: search and explore models, datasets, Spaces and papers on the Hub with their metadata and links, and call community tools from MCP-enabled Gradio Spaces (for example image generation or transcription) that you add in your Hugging Face MCP settings.

## Variables

None required: the `?login` URL makes the client sign in to Hugging Face in the browser on first use.

To use a token instead, Hugging Face documents the plain URL with a header:

```json
"url": "https://huggingface.co/mcp",
"headers": { "Authorization": "Bearer ${HF_TOKEN}" }
```

Create the token at https://huggingface.co/settings/tokens; a read-only token is enough for search.

## Notes

- Choose which built-in tools and Spaces are exposed at https://huggingface.co/settings/mcp; restart or reload the client to pick up changes.
- Without authentication the server offers only an anonymous tool set. Repository creation, Jobs and sandbox tools require a signed-in account, and Spaces calls and Jobs can use your account's compute quota.

Docs: https://huggingface.co/docs/hub/en/hf-mcp-server
