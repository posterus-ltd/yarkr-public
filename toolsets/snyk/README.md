# snyk

Snyk's official MCP server, built into the Snyk CLI (run locally with `npx snyk@latest mcp`): run Snyk Code (SAST), open-source dependency (SCA), Infrastructure as Code, container image and SBOM scans on local projects and return the findings to the agent so it can fix and rescan. Tools include `snyk_code_scan`, `snyk_sca_scan`, `snyk_iac_scan`, `snyk_container_scan`, `snyk_sbom_scan`, `snyk_auth` and `snyk_trust`.

## Variables

None required: on first use the server asks you to trust the project folder and opens a browser to sign in to Snyk (`snyk_auth`).

Where browser login is blocked, Snyk documents passing a token instead: add `"env": { "SNYK_TOKEN": "${SNYK_TOKEN}" }` with a Snyk personal access token or API token from the Snyk web UI. Use a token for an account limited to the Organization you scan.

## Notes

- Requires Node.js (for `npx`). If the Snyk CLI is installed, you can point `command` at the `snyk` binary with `"args": ["mcp", "-t", "stdio"]`.
- If your account belongs to several Organizations, set `SNYK_CFG_ORG` in `env` so scans land in the right one.
- Code scans need Snyk Code enabled for your Organization; if a scan fails, run the same `snyk code test` / `snyk test` directly to see the CLI error.

Docs: https://docs.snyk.io/agent-security/agentic-security-with-snyk-studio/quickstart-guides/cline-guide
