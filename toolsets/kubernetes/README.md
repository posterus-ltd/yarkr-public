# kubernetes

The containers-org Kubernetes MCP server (`kubernetes-mcp-server`, a community Go implementation run with `npx`, no kubectl needed): list, get, create, update and delete any Kubernetes or OpenShift resource; list pods, read pod logs, show resource usage, exec into pods and run images; view namespaces and events; manage Helm releases; and switch between kubeconfig contexts across multiple clusters.

## Variables

None required: the server uses your current kubeconfig (`~/.kube/config` or the file named by `KUBECONFIG`) or in-cluster configuration. It acts with that context's permissions, so point it at a dedicated ServiceAccount with read-only RBAC where you can.

## Notes

- Requires Node.js for `npx` (also published to PyPI for `uvx`, and as a release binary).
- Runtime settings live in a TOML file passed with `--config`: `read_only = true` blocks writes, `toolsets = [...]` limits tool groups (core, config, helm, kubevirt, ...), and `[[denied_resources]]` can hide kinds such as `Secret`.
- Without read-only mode, delete, exec and run tools act on live clusters; keep them behind approval prompts.

Docs: https://github.com/containers/kubernetes-mcp-server
