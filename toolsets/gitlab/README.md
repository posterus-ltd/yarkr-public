# gitlab

GitLab's built-in MCP server (generally available since GitLab 19.5, on GitLab.com, Self-Managed and Dedicated): read and work on issues and work items, merge requests, repository content and CI pipelines in the projects you can access.

## Variables

- `GITLAB_HOST` (optional): your GitLab host, e.g. `gitlab.example.com`. Defaults to `gitlab.com`.

No token is required: the server uses OAuth with dynamic client registration. Approve the authorization request in the browser on first use (in Claude Code, run `/mcp` and authenticate).

## Notes

- An owner must allow MCP server access first: for the top-level group on GitLab.com, for the instance on Self-Managed and Dedicated.
- Limit tools with the `X-Gitlab-Enabled-Mcp-Server-Toolsets` header (e.g. `core,work_items`); defaults are `core`, `merge_requests`, `work_items`, `repository`, `ci`. `wikis`, `code_security` and `orbit` are opt-in.
- Fine-grained personal access tokens with the MCP tool resource are accepted; legacy, project and group access tokens are rejected.

Docs: https://docs.gitlab.com/user/model_context_protocol/mcp_server/
