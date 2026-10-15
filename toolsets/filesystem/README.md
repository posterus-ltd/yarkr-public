# filesystem

The MCP reference filesystem server (`@modelcontextprotocol/server-filesystem`, run with `npx`): read, write, edit, move, search and list files, restricted to the directories passed as arguments. Tools include `read_text_file`, `read_media_file`, `write_file`, `edit_file` (with dry-run diff), `create_directory`, `list_directory`, `directory_tree`, `move_file`, `search_files`, `get_file_info` and `list_allowed_directories`.

## Variables

- `FILESYSTEM_ALLOWED_DIR` (optional): the directory the server may access. Defaults to `.`, the directory the client starts the server in. To allow more directories, add more paths to `args`.

## Notes

- Requires Node.js (for `npx`).
- Access outside the allowed directories is refused. Clients that support MCP Roots can replace the allowed directories at runtime.
- Write tools change files on disk; never allow your home directory or a directory holding secrets.

Docs: https://github.com/modelcontextprotocol/servers/tree/main/src/filesystem
