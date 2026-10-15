# github

GitHub's official remote MCP server (github/github-mcp-server, hosted by GitHub): browse repositories and code, manage issues and pull requests, review diffs, inspect and re-run GitHub Actions workflows, read code-scanning and Dependabot alerts, and search across GitHub.

## Variables

- `GITHUB_PAT`: a GitHub personal access token, sent as `Authorization: Bearer ${GITHUB_PAT}`. Create one at GitHub → Settings → Developer settings → Personal access tokens. Prefer a fine-grained token limited to the repositories the agent works on, with only the permissions it needs (e.g. Contents, Issues, Pull requests, Actions; read-only where you can).

## Notes

- The server also supports OAuth in clients that implement GitHub's OAuth flow; in that case drop the `headers` block and sign in in the browser on first use. The PAT header is the documented setup for Claude Code.
- Tools are grouped into toolsets (repos, issues, pull_requests, actions, code_security, ...); GitHub documents how to narrow them and enable a read-only mode.

Docs: https://github.com/github/github-mcp-server
