# grafana

Grafana's official MCP server (`mcp-grafana`, run locally with `uvx`): search and edit dashboards, run panel queries, query Prometheus, Loki, InfluxDB, Elasticsearch, CloudWatch, SQL and other datasources, manage alert rules and annotations, work with Grafana Incident and OnCall schedules, and render panel images, against a self-hosted Grafana or Grafana Cloud stack.

## Variables

- `GRAFANA_URL`: the Grafana base URL, e.g. `http://localhost:3000` or `https://myinstance.grafana.net` for Grafana Cloud.
- `GRAFANA_SERVICE_ACCOUNT_TOKEN`: a service account token, passed as an environment variable. Create a service account in Grafana and generate a token for it. Grant only the RBAC permissions the tools you use need; Grafana notes the built-in `Editor` role is the simple but broad option.

## Notes

- Requires uv (for `uvx`) and Grafana 9.0 or later. Also published as the Docker image `grafana/mcp-grafana`.
- Add `--disable-write` to `args` for read-only mode; `--disable-<category>` flags (e.g. `--disable-oncall`, `--disable-admin`) remove tool groups.
- `GRAFANA_ORG_ID` selects a non-default organization.
- Broad Loki or Prometheus queries can be expensive; `--loki-guardrail-mode=enforce` and `--prometheus-guardrail-mode=enforce` cap them.

Docs: https://github.com/grafana/mcp-grafana
