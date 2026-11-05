# aws-documentation

AWS Labs' AWS Documentation MCP server (`awslabs.aws-documentation-mcp-server`, run locally with `uvx`): search AWS documentation through the official search API, read doc pages or selected sections as markdown, filter rows in large doc tables such as service quotas or pricing, and get related-page recommendations. Tools include `search_documentation`, `read_documentation`, `read_sections`, `search_table` and `recommend`.

## Variables

- `AWS_DOCUMENTATION_PARTITION` (optional): `aws` (default) for global AWS docs, or `aws-cn` for AWS China docs. Search, sections, tables and recommendations are global-only; the China partition instead offers a list of services available in China regions.

## Notes

- Requires `uv` (for `uvx`) and Python 3.10 or newer.
- No AWS credentials are needed; it only reads public documentation.
- Behind a corporate proxy that blocks some user agents, set `MCP_USER_AGENT` in `env` as the docs describe.
- AWS also runs a hosted equivalent with more sources; see the `aws-knowledge` toolset.

Docs: https://github.com/awslabs/mcp/tree/main/src/aws-documentation-mcp-server
