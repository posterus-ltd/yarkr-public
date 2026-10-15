# git

The MCP reference Git server (`mcp-server-git`, run with `uvx`): read, search and change a local Git repository. Tools: `git_status`, `git_diff_unstaged`, `git_diff_staged`, `git_diff`, `git_add`, `git_reset`, `git_commit`, `git_log`, `git_create_branch`, `git_checkout`, `git_show`, `git_branch`.

## Variables

- `GIT_REPOSITORY` (optional): path to the repository the server operates on, passed as `--repository`. Defaults to `.`, the directory the client starts the server in (the project root in Claude Code).

## Notes

- Requires `uv` (for `uvx`) and `git` on the PATH.
- It has no push or remote operations; pushing stays with the developer or a GitHub server.
- `git_commit`, `git_reset` and `git_checkout` change the working tree: keep them behind your client's approval prompts.

Docs: https://github.com/modelcontextprotocol/servers/tree/main/src/git
