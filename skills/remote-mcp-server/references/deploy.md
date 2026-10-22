# Web app, deploy and verification

## Web app

**Consent route `/agent/authorize`** is signed-in only and sits outside the app shell. It forwards `client_id,
redirect_uri, response_type, code_challenge, code_challenge_method, state, scope, resource` verbatim:

1. `GET <E>/consent?<params>` with the user's web-app credentials (bearer JWT, or the session cookie on a shared
   origin), then render the client name, URI, scope and `capabilities`.
2. Approve or Deny → `POST <E>/consent` with JSON `{ ...params, approved }` → `window.location.assign(redirect_url)`.

A signed-out visitor goes to sign-in and comes back with the query string intact.

**Settings panel** (agent access): list the user's grants (`client_name, created_at, last_used_at`) and revoke one
by deleting its row, through whatever scopes data to the user in the web app (RLS, an API endpoint). Treat "nothing
deleted" as "already gone".

**Connect snippets**: the endpoint string itself plus copy-ready configs.

```bash
claude mcp add --transport http <product> <E>
```

```json
{ "mcpServers": { "<product>": { "type": "http", "url": "<E>" } } }
```

Cursor (`.cursor/mcp.json`) uses `{ "mcpServers": { "<product>": { "url": "<E>" } } }` and infers the transport.
VS Code (`.vscode/mcp.json`) uses `servers` instead of `mcpServers`, with `"type": "http"`.

## Config and secrets

- **Let unauthenticated requests reach the server.** Exempt `<E>` and everything under it from platform or framework
  auth (gateway authorizers, auth middleware, Supabase `verify_jwt`). The server authenticates its own tokens, and
  the OAuth endpoints must answer before any token exists.
- **Secrets**: `MCP_PUBLIC_ENDPOINT`, `MCP_ISSUER`, `APP_ORIGIN`, and `MCP_TOKEN_KEY=$(openssl rand -base64 32)` when
  the adapter stores a secret. Rotating `MCP_TOKEN_KEY` disconnects every such agent.
- **Proxies**: don't buffer or rewrite the `WWW-Authenticate` header, and don't cache any `/.well-known/` response
  for long while you are still changing it.

## Publish the static document (issuer on the web app)

Only when the issuer is `<APP_ORIGIN>`. The file must be served at exactly
`<APP_ORIGIN>/.well-known/oauth-authorization-server`, as `application/json`, and survive every deploy. S3 example:

```yaml
- run: aws s3 sync ./<web>/dist s3://$BUCKET/ --delete --exclude ".well-known/*"
- run: aws s3 cp ./<server>/mcp/oauth/authorization-server.json \
    s3://$BUCKET/.well-known/oauth-authorization-server \
    --content-type application/json --cache-control "max-age=300"
```

The key has no extension, so set its content type explicitly; exclude it from `--delete`. On Netlify, Vercel,
Cloudflare Pages or behind CloudFront, check that the SPA fallback doesn't rewrite `/.well-known/*` to `index.html`
and add a header rule for the content type if the host infers it from the extension.

## Deploy order

1. The migration (OAuth tables and their access rules)
2. Platform config that exempts `<E>` from upstream auth
3. Secrets
4. The MCP server
5. The web app, with the consent route, the static `.well-known/oauth-authorization-server` (if the issuer is the
   app) and any `schema/agent-contract.json`

Supabase commands: [supabase.md](supabase.md#config-secrets-and-deploy).

## Smoke test (production, in this order)

```bash
E=https://<api host>/mcp     # the public endpoint
I=https://<issuer>           # origin of $E, or the app origin

curl -si -X POST "$E" -H 'content-type: application/json' \
  -d '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{}}'
#  → 401, WWW-Authenticate: Bearer … resource_metadata="$E/.well-known/oauth-protected-resource"
curl -s "$E/.well-known/oauth-protected-resource" | jq .authorization_servers     # ["$I"]
curl -s "$I/.well-known/oauth-authorization-server" | jq '.issuer, .token_endpoint' # "$I", "$E/token"
curl -s -X POST "$E/register" -H 'content-type: application/json' \
  -d '{"client_name":"smoke","redirect_uris":["http://127.0.0.1:9/cb"]}'           # 201 + client_id
curl -s "<APP_ORIGIN>/schema/agent-contract.json" | jq .version                    # 1, if used
```

Then connect a real client (`claude mcp add --transport http …`), approve once in the browser, and run `tools/list`
plus one read tool. Check that the grant appears in settings, that the tool sees only that user's data, and that
deleting the grant makes the next call return 401.

Delete the smoke client row afterwards: `delete from mcp_clients where client_name = 'smoke'`.
