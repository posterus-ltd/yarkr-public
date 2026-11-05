# azure

Microsoft's official Azure MCP Server (`@azure/mcp`, run locally with `npx`): work with Azure resources from the agent, including subscriptions and resource groups, Storage, Cosmos DB, Key Vault, Monitor and Log Analytics, AKS, App Configuration, Event Hubs, Advisor recommendations, Microsoft Foundry models and agents, and many more services, using your own Azure identity.

## Variables

None required: the server signs in with credentials already on your machine through the Azure Identity credential chain (environment variables, Visual Studio / VS Code sign-in, Azure CLI `az login`, Azure PowerShell, Azure Developer CLI, then an interactive browser login). Run `az login` before starting the agent.

- To pin one credential type, set `AZURE_TOKEN_CREDENTIALS` in `env` (for example `AzureCliCredential`).
- For CI, use a service principal via `AZURE_CLIENT_ID`, `AZURE_CLIENT_SECRET` and `AZURE_TENANT_ID`.
- The signed-in identity's Azure RBAC roles decide what the agent can do; use an identity with reader-level roles where you can.

## Notes

- Requires Node.js (LTS). A `uvx` (PyPI) and Docker variant are also documented.
- Add `--read-only` to `args` to block write operations. Narrow the tool surface with `--namespace <service>` (repeatable) or `--tool <name>`; `--mode` chooses `namespace` (default), `all` or `single`.
- Sovereign clouds: pass `--cloud AzureChinaCloud` or `AzureUSGovernment` (or set `AZURE_CLOUD`) and sign in to that cloud first.
- Write tools create, update and delete live Azure resources; keep them behind approval prompts.

Docs: https://learn.microsoft.com/azure/developer/azure-mcp-server/
