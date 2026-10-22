---
name: remote-mcp-server
description: Add a remote MCP server to a product so users connect their agent (Claude Code, Cursor, VS Code, claude.ai) with one URL — MCP Streamable HTTP over POST, OAuth 2.1 with dynamic client registration and PKCE, a consent screen in the web app, and tools that run as the approving user so the product's existing authorization (row-level security, policies, service-layer checks) decides access. Stack-neutral, with adapters for Supabase, Postgres RLS, app-layer authorization, Firebase and an external identity provider. Use when adding agent access or an MCP endpoint to a SaaS, designing MCP tools, instructions or resources for a product, debugging MCP OAuth discovery (401 loops, issuer mismatch), or reviewing what an agent should be allowed to write.
---

# Remote MCP Server

A product-hosted MCP server that a user adds with one string, the endpoint `<E>` (e.g. `https://api.example.com/mcp`).
Everything else is discovered from it: the 401 challenge points at the protected-resource metadata, which names the
authorization server, which offers dynamic registration, a consent screen in the web app, and a PKCE code exchange
for an opaque token. Every tool call then executes **as the user who approved it**.

The core (OAuth, JSON-RPC, tool registry, agent-surface design) is the same on every stack. Two things depend on the
stack, and you decide them first:

- **Delegation**: how a tool call gets to act as the user, so the authorization you already have applies unchanged.
- **Issuer placement**: where `/.well-known/oauth-authorization-server` can be served from a host's root.

Code samples are TypeScript against the web-standard `Request`/`Response` and WebCrypto, so they run as-is on Deno,
Bun, Cloudflare Workers, Node 18+ with Hono or Next.js route handlers. Validation uses Zod 4; in Python, Pydantic
plays the same role. Reference implementation: Vibesmonitor's MCP server (one Supabase Edge Function, ~5k lines,
16 tools).

## 1. Design rules (keep all of them)

1. **No API keys.** Access is a consent grant the user can see and revoke in settings. Revoking deletes a row.
2. **The client never holds the product's session token.** It holds an opaque `<prefix>t_…` token that only the MCP
   server can resolve, so the tool surface is the only way to spend a grant.
3. **Tools act as the user, never as admin.** The privileged path (service role, admin DB user) touches only the
   three OAuth bookkeeping tables. A record the user can't see is invisible to the agent too.
4. **Delegation never shares the browser's session.** If the adapter needs a stored session, mint a separate one
   per grant. Reusing the web session would sign the user out the first time the agent rotates a refresh token.
5. **Stateless MCP.** JSON-RPC over `POST`, no session ids, no SSE. `GET` → 405, `DELETE` → 204.
6. **One schema per tool.** The schema that validates arguments is the one serialized into `inputSchema`.
7. **The issuer's metadata lives at its host's root.** If something else owns the API host's root (a gateway,
   a functions platform), put the issuer on the web-app origin and publish the document statically there.
8. **The write surface is a decision, not a default** (section 5).

## 2. Decide the stack-dependent parts

**Delegation.** Choose the adapter that reuses your existing authorization layer:

| Your authorization lives in | Adapter | Stored secret per grant |
|---|---|---|
| Supabase RLS via PostgREST | Mint a GoTrue session per grant, refresh it | encrypted session |
| Postgres RLS on your own backend | `set local` the user id/claims in a transaction per call | none |
| Service/policy layer (Rails, Django, Nest, Laravel…) | Build the same `currentUser` principal the web API uses | none |
| A downstream API that takes a user JWT you can sign | Sign a short-lived JWT per request (`aud` = that API) | none |
| Firebase security rules | Custom token → ID token + refresh token per grant | encrypted session |
| An IdP that already does DCR + consent | Skip the authorization server and validate its JWTs | none (the IdP holds it) |

Details and code: [references/delegation.md](references/delegation.md). Supabase end to end:
[references/supabase.md](references/supabase.md).

**Issuer placement.**

- **You control the root of `<E>`'s host** (own server, `mcp.example.com`, a Worker): issuer = that origin. The
  server answers both discovery documents itself and nothing is published statically.
- **A gateway owns the root** (Supabase, API Gateway stages, path-mounted functions): issuer = `<APP_ORIGIN>`, with
  the authorization-server document published as a static file there and the endpoints left on `<E>`.

## 3. Files

```
<server>/mcp/
  router                    discovery, OAuth, JSON-RPC, server instructions
  http                      CORS, json(), 401 challenge, form parsing
  env                       PUBLIC_ENDPOINT, ISSUER, APP_ORIGIN, TTLs, token prefixes, protocol versions
  auth                      bearer token → { grant, context } via the delegation adapter
  delegate                  the adapter: capture at consent, context per request
  guide, resources          the guide resource (+ any contract resource)
  oauth/
    metadata                pure builders for both discovery documents (+ static copy when the issuer is the app)
    crypto                  random tokens, sha256, AES-GCM, PKCE S256
    store                   the only privileged database access
    register, authorize, consent, token
  tools/
    shared                  Tool type, toInputSchema, ToolError, access helpers
    index                   TOOLS registry, callTool, AGENT_CAPABILITIES
    <domain>                one file per tool group
migrations/<ts>_agent_access  mcp_clients, mcp_grants, mcp_grant_secrets
<web app>/
  /agent/authorize          consent route (signed in, outside the app shell)
  settings → agent access   list + revoke the user's grants; connect snippets
```

## 4. Build it, in this order

1. **Migration**: three tables, hashes for codes and tokens, any delegated secret AES-GCM encrypted, and the web
   app allowed only to list and delete the user's own grants.
   [references/oauth.md](references/oauth.md#data-model).
2. **Env and HTTP shell**: `PUBLIC_ENDPOINT` from config, never from the request URL. Missing `MCP_TOKEN_KEY` is
   fatal when the adapter stores a secret. [references/mcp-endpoint.md](references/mcp-endpoint.md#env-and-http-shell).
3. **Discovery documents**: protected-resource metadata on `<E>`, authorization-server metadata at the issuer's
   root; a test pins any static copy to the builder output. [references/oauth.md](references/oauth.md#discovery).
4. **OAuth endpoints**: `/register`, `/authorize`, `GET`+`POST /consent`, `/token` with code + refresh rotation.
   [references/oauth.md](references/oauth.md#endpoints).
5. **Delegation and `authenticate()`**: re-check the grant on every request, then build the user context.
   [references/oauth.md](references/oauth.md#authenticate), [references/delegation.md](references/delegation.md).
6. **Router and JSON-RPC**: `initialize`, `ping`, `tools/list`, `tools/call`, `resources/list|read`, batches,
   notifications → 202, version negotiation. [references/mcp-endpoint.md](references/mcp-endpoint.md#router).
7. **Tools**, then **instructions and the guide resource** (section 5).
   [references/mcp-endpoint.md](references/mcp-endpoint.md#tools).
8. **Web app**: consent route, settings panel, connect snippets.
   [references/deploy.md](references/deploy.md#web-app).
9. **Deploy and smoke test against production**, in order.
   [references/deploy.md](references/deploy.md#deploy-order).

With an external IdP (last row of the table) skip steps 1, 3's authorization-server half, and 4; the IdP's consent
screen replaces yours. See [references/delegation.md](references/delegation.md#external-identity-provider).

## 5. Designing the agent surface

Most of the work after the plumbing goes here, and it decides whether agents actually use the server well.

**Instructions are the steering wheel.** `initialize.result.instructions` is a short system prompt: what the product
is, which tool to call first (`list_projects` → an id), which tool answers which question, side effects of writes,
and how to present results. Write it as prose, one paragraph per area. Repeat it as a `guide` resource
(`<product>://guide`, markdown), because some clients truncate or hide instructions but show resources.

**Tool descriptions say when, not just what.** One paragraph each: what it returns, when to call it, what to call
before it, and what the arguments mean ("Project UUID, as returned by list_projects"). Mark tools with
`readOnlyHint`, or `destructiveHint`/`idempotentHint` for writes.

**Ask for diagrams.** For trends, shares and breakdowns, tell the agent to render Mermaid (`xychart-beta` for
series, `pie` for splits), and return data in chart-ready shape (a daily series, a `byService` map).

**Choose the writes deliberately.** Allow writes whose mistakes are visible, reversible and destroy nothing:
creating an empty project (returning the id *and* the install snippet with the id filled in, so onboarding takes one
turn), editing a layout, toggling a widget. Keep renames, deletes, billing, membership, triage and captured data for
humans. List every capability in plain language in `AGENT_CAPABILITIES`, built from the same registry as `TOOLS`, so
the consent screen can't hide a tool.

**Writes that need privileges go through the existing code path.** If creating something takes more than the user's
own permissions (a project plus its owner row), call the endpoint or service the web app already uses, as the user.
You don't end up with a second definition of what a project is.

**Agents send intent, not presentation.** A canvas node is `{widgetId, position?, size?}`; labels and sizes come
from the catalog. Expose the catalog both as a `describe_*` tool and as a resource. Agents must read it before
writing, and not every client lets the model read resources.

**Shared vocabulary is published, not copied.** When the MCP server can't import the web app's schemas (separate
deploy unit, separate language), have the web build serialize them (`z.toJSONSchema`) into
`<APP_ORIGIN>/schema/agent-contract.json`. The server fetches the file and rebuilds validators
(`z.fromJSONSchema`): cache it 5 min, cache failures 30 s, 5 s timeout, no bundled fallback. A stale fallback is
worse than an honest error. In a monorepo that deploys both together, import the schemas directly instead.

**Errors are for the agent to act on.** Throw `ToolError` with a message that names the fix ("no project X — either
it does not exist or this account cannot access it"). Return validation failures as `invalid arguments for <tool>:
<details>`. Log anything else and answer with a generic message. All of these use `isError: true`, not a JSON-RPC
error.

## Pitfalls

- **Discovery loops**: the authorization-server document is missing from the issuer host's root, or its `issuer`
  differs from the host it was fetched from (RFC 8414 clients reject it). On static hosting, make sure no SPA
  fallback rewrites `/.well-known/*` to `index.html` and that deploys don't delete the file.
- **401s before your code runs**: platform auth in front of `<E>` (Supabase `verify_jwt`, a gateway authorizer,
  framework auth middleware) rejects the request before the server can answer with its own challenge.
- **Advertised endpoints point at an internal host**: the base URL was read off the request behind a proxy.
- **Writes silently do nothing**: with RLS, a blocked UPDATE affects 0 rows without an error. Check the affected
  row count on every write; in an app-layer adapter, make the service raise on not-found/forbidden.
- **"Empty" instead of "forbidden"**: a record the user can't see reads as no rows. Wrap single-record reads in a
  `requireProject`-style helper that names the possible causes.
- **Silent truncation**: data layers cap results (PostgREST `max_rows`, ORM defaults, API page sizes). State the
  ceiling and bound the `limit` argument.
- **Every call 500s after a secrets change**: `MCP_TOKEN_KEY` is missing or was rotated. Rotation disconnects
  every agent whose grant stores a secret.
- **Revocation lag**: deleting the grant blocks the next request, but a stored delegated session lives until it
  expires upstream. Never let anything except the MCP server hold it.
- **Redirecting errors to an unverified `redirect_uri`**: `/authorize` answers 400 directly until the client and URI
  are validated.
- **Admin context leaks into tools**: a convenience "system" client passed into a tool bypasses rule 3. Tools receive
  only the delegated context.
- **Local-only verification**: a local stack proves nothing about prod routing, gateways and static hosting. Curl
  the production discovery chain after every deploy.

## Checklist

- [ ] Unauthenticated `POST` → 401 whose `WWW-Authenticate` carries `resource_metadata="<E>/.well-known/oauth-protected-resource"`.
- [ ] `<E>/.well-known/oauth-protected-resource` → `authorization_servers: ["<ISSUER>"]`.
- [ ] `<ISSUER>/.well-known/oauth-authorization-server` → `issuer` exactly `<ISSUER>`, endpoints reachable, only
      `S256`; a test pins any static copy equal to the builder.
- [ ] `POST /register` → 201; `http:` is refused except on localhost/127.0.0.1; custom schemes are accepted.
- [ ] A real client connects, consent shows the client name and `AGENT_CAPABILITIES`, `tools/list` works, and a read
      tool returns only the approving user's data.
- [ ] Codes are single-use and expire in 60 s; refresh rotates both tokens; PKCE mismatch → `invalid_grant`.
- [ ] Every tool's `inputSchema` comes from its validating schema; unknown args/fields are refused.
- [ ] Each write proves it landed (affected rows, or a service that raises).
- [ ] Tools never receive a privileged client.
- [ ] Instructions name the first tool to call; the guide resource repeats them; the `describe_*` tool mirrors the
      contract resource.
- [ ] Revoking in settings makes the next tool call return 401.
