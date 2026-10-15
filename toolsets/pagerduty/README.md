# pagerduty

PagerDuty's official hosted MCP server: read and manage incidents, services, schedules and on-call, teams, escalation policies, event orchestrations, alert grouping and log entries in your PagerDuty account. It exposes read and write tools.

## Variables

- `PAGERDUTY_API_KEY`: a PagerDuty REST API key, sent as `Authorization: Token token=${PAGERDUTY_API_KEY}`. Create one in PagerDuty's API access settings (a user API key acts with that user's permissions; prefer it over an account-wide key).

## Notes

- EU accounts: change the URL to `https://mcp.eu.pagerduty.com/mcp`.
- OAuth is also supported (static client credentials or a bearer token); scoped OAuth clients are the documented way to restrict which tools are available, since the hosted server has no tool filter.
- The older local `uvx pagerduty-mcp` package is deprecated in favour of this hosted server.
- Write tools (acknowledge, resolve, reassign, create) affect live paging: keep them behind approval prompts.

Docs: https://support.pagerduty.com/main/docs/pagerduty-mcp-server
