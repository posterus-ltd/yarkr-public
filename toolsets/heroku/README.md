# heroku

Heroku's official Platform MCP server (`@heroku/mcp-server`, run locally with `npx`): list, create, rename and transfer apps, deploy from an `app.json`, run one-off dynos, scale and restart dynos, toggle maintenance mode, read app logs, provision add-ons, manage pipelines and promotions, and inspect or query Heroku Postgres (`pg_psql`, locks, outliers, backups, upgrades).

## Variables

- `HEROKU_API_KEY`: a Heroku authorization token, passed to the server as an environment variable. Create one with `heroku authorizations:create`, or in the Dashboard under Account Settings → Applications → Authorizations. A dedicated authorization is easier to revoke than reusing `heroku auth:token`; the token acts with your account's full access, so prefer an account that only belongs to the teams the agent should touch.

## Notes

- Requires Node.js and the Heroku CLI v10.8.1 or later installed globally.
- Heroku's recommended alternative skips the API key and reuses your CLI login: set `"command": "heroku"` and `"args": ["mcp:start"]` instead.
- Write tools act on production: `ps_scale`, `ps_restart`, `maintenance_on`, `pipelines_promote`, `pg_kill`, `pg_upgrade` and `pg_psql` should stay behind approval prompts.
- Heroku describes the server as early development; tools may change.

Docs: https://devcenter.heroku.com/articles/heroku-mcp-server
