# semgrep

Semgrep's official MCP server, built into the Semgrep CLI (`semgrep mcp`, run locally): scan code the agent writes or reads with Semgrep's static analysis rules for security vulnerabilities and other issues, across many languages, and return findings the agent can fix. With a Semgrep AppSec Platform account it uses your organization's policies and Semgrep Code, Supply Chain and Secrets.

## Variables

None required for open-source rules. To connect to Semgrep AppSec Platform, either run `semgrep login` once, or create a token at Semgrep → Settings → Tokens and add it to the server's `env`:

```json
"env": { "SEMGREP_APP_TOKEN": "${SEMGREP_APP_TOKEN}" }
```

## Notes

- Requires the Semgrep CLI on `PATH` (Python 3.10+): `pipx install semgrep`, `uv tool install semgrep` or `brew install semgrep`. Semgrep recommends `semgrep login && semgrep install-semgrep-pro` for full coverage.
- The standalone `semgrep-mcp` PyPI package and `semgrep/mcp` repository are deprecated; the server now ships in the `semgrep` binary.
- Semgrep also offers a Claude Code plugin (Semgrep Guardian) that bundles this server with hooks that scan every generated file.
- Docker alternative: `docker run -i --rm semgrep/semgrep semgrep mcp -t stdio`.

Docs: https://github.com/semgrep/semgrep/tree/develop/cli/src/semgrep/mcp
