# aws-knowledge

AWS's official remote, fully managed AWS Knowledge MCP server: search and read current AWS documentation, API references, What's New posts, blogs, Well-Architected guidance, CDK and CloudFormation references and Amplify docs, check which regions a service, API or CloudFormation resource is available in, and load AWS agent skills. Tools: `search_documentation`, `read_documentation`, `list_regions`, `get_regional_availability`, `retrieve_skill`.

## Variables

None required: the server needs no authentication and no AWS account.

## Notes

- It is rate limited; heavy automated use may be throttled.
- Read-only: it serves public AWS content and cannot see or change anything in your AWS account.
- For a local, offline-capable alternative limited to AWS docs, use the `aws-documentation` toolset.

Docs: https://github.com/awslabs/mcp/tree/main/src/aws-knowledge-mcp-server
