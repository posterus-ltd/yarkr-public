# gcloud

Google Cloud's gcloud MCP server (`@google-cloud/gcloud-mcp`, from the googleapis/gcloud-mcp repo, run locally with `npx`): the agent runs gcloud CLI commands through a single `run_gcloud_command` tool to inspect and manage Google Cloud resources (projects, Compute Engine, IAM, Cloud Run, GKE and anything else gcloud covers).

## Variables

None required: the server uses the active account of your installed gcloud CLI (`gcloud auth login`). Its permissions are exactly that account's IAM permissions. For least privilege, impersonate a service account that holds a narrowly scoped role (`gcloud config set auth/impersonate_service_account <sa-email>`).

## Notes

- Requires Node.js 20 or newer and an installed, authenticated gcloud CLI.
- By default it refuses gcloud commands that take arbitrary input or open interactive sessions; everything else the account is allowed to do, including deletes, can run.
- The repo is in preview, may see breaking changes, and is described by Google as not an officially supported Google product.
- The same repo publishes sibling servers (`@google-cloud/observability-mcp`, `@google-cloud/storage-mcp`, `@google-cloud/backupdr-mcp`) with the same setup.

Docs: https://github.com/googleapis/gcloud-mcp
