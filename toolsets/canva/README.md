# canva

Canva's official hosted MCP server: generate designs from text, edit existing designs, search designs and folders, upload assets, use brand kits and templates, export to PDF, PNG, JPG, PPTX or MP4, resize designs and add comments.

## Variables

None required: the server uses OAuth. Each user signs in with their own Canva account on first use; Canva does not support organization-level or service-account auth.

## Notes

- Operations follow the user's own Canva permissions on each design and asset.
- Resizing, autofill, brand kits and brand templates need Canva Pro or above.
- Design generation can be slow; raise the client's tool timeout to 60 seconds if calls time out.

Docs: https://www.canva.dev/docs/apps/mcp/
