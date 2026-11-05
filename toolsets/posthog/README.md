# posthog

PostHog's official hosted MCP server: query product analytics and run HogQL/SQL, read and create insights and dashboards, manage feature flags and experiments, triage error tracking issues and stack traces, and work with surveys, CDP destinations and support tickets in your PostHog projects.

## Variables

None required: the server uses OAuth. Your client opens a browser to sign in to PostHog on first use, and the auth server routes you to the US or EU region of your account.

If your client can't do OAuth, create a personal API key with the "MCP Server" preset (scoped to one project) and add it as a header, as PostHog documents:

```json
"headers": { "Authorization": "Bearer ${POSTHOG_API_KEY}" }
```

## Notes

- Read-only: add `?readonly=true` to the URL (or the `x-posthog-read-only: true` header) to hide tools that create, update or delete.
- Pin a connection to one project with `?project_id=...` (or `x-posthog-project-id`); this also removes the switch-project tools so writes can't land in the wrong project.
- Some tools run LLMs internally, are billed as PostHog AI spend, and only appear when AI data processing is enabled for the organization.
- Rate limits: 480 requests per minute and 4,800 per hour per credential.

Docs: https://posthog.com/docs/model-context-protocol
