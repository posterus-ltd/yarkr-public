# terraform

HashiCorp's official Terraform MCP server (`hashicorp/terraform-mcp-server`, run locally with Docker): search the Terraform Registry for providers, modules and policies, read provider resource and data-source docs, and, with an HCP Terraform or Terraform Enterprise token, work with organizations, workspaces, variables and runs.

## Variables

None required for public Terraform Registry tools.

For HCP Terraform / Terraform Enterprise tools, pass a token and address into the container by adding these before the image name in `args`, as HashiCorp documents:

```json
"-e", "TFE_TOKEN=${TFE_TOKEN}", "-e", "TFE_ADDRESS=${TFE_ADDRESS}"
```

- `TFE_TOKEN`: an HCP Terraform / TFE API token. Prefer a team token scoped to the workspaces the agent needs over a user or organization token.
- `TFE_ADDRESS`: the API address including protocol, e.g. `https://app.terraform.io`.

They aren't in the default config because an unset variable would send an empty value.

## Notes

- Requires Docker. Pin an image tag (e.g. `hashicorp/terraform-mcp-server:1.4.1`) for reproducible setups.
- Tools that require explicit approval stay disabled unless `ENABLE_TF_OPERATIONS=true` is passed into the container. The server's `--toolsets` and `--tools` options narrow the tool list.
- HashiCorp also hosts a remote server at `https://mcp.terraform.io/mcp` that takes `Authorization: Bearer ${TFE_TOKEN}`.

Docs: https://github.com/hashicorp/terraform-mcp-server
