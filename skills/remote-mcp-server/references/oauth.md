# OAuth 2.1 authorization server

Everything that lets a client go from "401" to an opaque bearer token. Substitute `<product>`, `<APP_ORIGIN>`,
`<ISSUER>` and the token prefixes (`vmt_` access, `vmr_` refresh, `vmc_` code, `vmc-` client id in the reference).

Skip this file if an external identity provider is your authorization server
([delegation.md](delegation.md#external-identity-provider)).

## Data model

Codes and tokens are stored as SHA-256 hashes. A delegated secret, when the adapter needs one (a session it must
replay), is stored AES-GCM encrypted with a key kept in server config, never in the database. Postgres shown; any
database with unique partial indexes (or a unique nullable column) works.

```sql
create table if not exists mcp_clients (
    id            uuid        not null default gen_random_uuid() primary key,
    created_at    timestamptz not null default now(),
    client_id     varchar     not null unique,
    client_name   varchar     not null,
    client_uri    varchar,
    redirect_uris text[]      not null,
    check (array_length(redirect_uris, 1) between 1 and 10)
);

-- One grant per (user, client). client_name is snapshotted so settings keeps
-- naming what the user approved even if the client re-registers.
create table if not exists mcp_grants (
    id           uuid        not null default gen_random_uuid() primary key,
    created_at   timestamptz not null default now(),
    user_id      uuid        not null references users(id) on delete cascade,
    client_id    varchar     not null references mcp_clients(client_id) on delete cascade,
    client_name  varchar     not null,
    scope        varchar     not null,
    last_used_at timestamptz,
    unique (user_id, client_id)
);
create index if not exists mcp_grants_user_id_idx on mcp_grants (user_id);

create table if not exists mcp_grant_secrets (
    grant_id                uuid        not null primary key references mcp_grants(id) on delete cascade,
    updated_at              timestamptz not null default now(),
    code_hash               varchar,
    code_challenge          varchar,
    code_redirect_uri       varchar,
    code_expires_at         timestamptz,
    access_token_hash       varchar,
    access_token_expires_at timestamptz,
    refresh_token_hash      varchar,
    delegated_secret        text         -- encrypted; null for adapters that store nothing
);
create unique index if not exists mcp_grant_secrets_code_hash_idx
    on mcp_grant_secrets (code_hash) where code_hash is not null;
create unique index if not exists mcp_grant_secrets_access_token_hash_idx
    on mcp_grant_secrets (access_token_hash) where access_token_hash is not null;
create unique index if not exists mcp_grant_secrets_refresh_token_hash_idx
    on mcp_grant_secrets (refresh_token_hash) where refresh_token_hash is not null;
```

Access rules, enforced however your stack enforces them (RLS policies, DB grants, or an API endpoint):

- `mcp_clients` and `mcp_grant_secrets`: only the MCP server's privileged path.
- `mcp_grants`: the privileged path, plus the signed-in user may **list and delete their own rows** (the settings
  panel). Nothing else.

Supabase policies for this: [supabase.md](supabase.md#migration).

## Discovery

Two documents, and possibly on two hosts:

- **Protected resource metadata** (RFC 9728) is served by the MCP server at `<E>/.well-known/oauth-protected-resource`.
  The 401 challenge names this URL, because a client can't derive it.
- **Authorization server metadata** (RFC 8414) is fetched from the *issuer's host root*,
  `<ISSUER>/.well-known/oauth-authorization-server`. When you own that root, the server answers it. When a gateway
  owns it, the issuer is `<APP_ORIGIN>` and a static copy is published there; the server still answers the same
  document under `<E>`, since some clients try both.

`oauth/metadata` is pure (no runtime globals), so the web app's test runner can import it:

```ts
export const SERVER_NAME = '<product>';
export const SCOPE = '<product>:agent';
export const PROTECTED_RESOURCE_PATH = '/.well-known/oauth-protected-resource';
export const AUTHORIZATION_SERVER_PATH = '/.well-known/oauth-authorization-server';

export interface MetadataOrigins { issuer: string; base: string } // base = <E>

export const resourceMetadataUrl = (base: string) => `${base}${PROTECTED_RESOURCE_PATH}`;

export const protectedResourceMetadata = ({ issuer, base }: MetadataOrigins) => ({
  resource: base,
  resource_name: SERVER_NAME,
  authorization_servers: [issuer],
  scopes_supported: [SCOPE],
  bearer_methods_supported: ['header'],
  resource_documentation: '<docs url>',
});

export const authorizationServerMetadata = ({ issuer, base }: MetadataOrigins) => ({
  issuer,
  authorization_endpoint: `${base}/authorize`,
  token_endpoint: `${base}/token`,
  registration_endpoint: `${base}/register`,
  scopes_supported: [SCOPE],
  response_types_supported: ['code'],
  response_modes_supported: ['query'],
  grant_types_supported: ['authorization_code', 'refresh_token'],
  token_endpoint_auth_methods_supported: ['none'],
  code_challenge_methods_supported: ['S256'], // never 'plain'
  service_documentation: '<docs url>',
});
```

When the issuer is the web app, check in `oauth/authorization-server.json` with the production values and add a
test asserting it deep-equals `authorizationServerMetadata({ issuer: APP_ORIGIN, base: PUBLIC_ENDPOINT })`.

Newer MCP spec revisions also allow Client ID Metadata Documents as an alternative to dynamic registration.
Supporting DCR covers the current clients; add CIMD when a client you care about needs it.

## Crypto

There are three jobs, and they are never mixed: a random token for the client, a SHA-256 hash for storage, and
AES-GCM for a delegated secret. The AES key is the SHA-256 digest of `MCP_TOKEN_KEY`, so the secret can be any
high-entropy string. WebCrypto only, so this runs on every runtime listed in SKILL.md.

```ts
export const randomToken = (prefix: string, bytes = 32) =>
  prefix + base64UrlEncode(crypto.getRandomValues(new Uint8Array(bytes)));

export const sha256Hex = async (input: string) => {
  const d = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(input));
  return [...new Uint8Array(d)].map((b) => b.toString(16).padStart(2, '0')).join('');
};
const sha256Base64Url = async (input: string) =>
  base64UrlEncode(new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(input))));

export const base64UrlEncode = (bytes: Uint8Array) =>
  btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const base64UrlDecode = (v: string) => {
  const p = v.replace(/-/g, '+').replace(/_/g, '/');
  return Uint8Array.from(atob(p.padEnd(Math.ceil(p.length / 4) * 4, '=')), (c) => c.charCodeAt(0));
};

const importKey = async (secret: string) =>
  crypto.subtle.importKey('raw', await crypto.subtle.digest('SHA-256', new TextEncoder().encode(secret)),
    { name: 'AES-GCM' }, false, ['encrypt', 'decrypt']);

// "iv.ciphertext", both base64url.
export const encrypt = async (plaintext: string, secret: string) => {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, await importKey(secret),
    new TextEncoder().encode(plaintext));
  return `${base64UrlEncode(iv)}.${base64UrlEncode(new Uint8Array(ct))}`;
};
export const decrypt = async (payload: string, secret: string) => {
  const [iv, ct] = payload.split('.');
  if (!iv || !ct) throw new Error('malformed ciphertext');
  return new TextDecoder().decode(await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: base64UrlDecode(iv) }, await importKey(secret), base64UrlDecode(ct)));
};

export const verifyCodeChallenge = async (verifier: string, challenge: string) =>
  !!verifier && !!challenge && (await sha256Base64Url(verifier)) === challenge;
```

## Store

`oauth/store` is the only module with privileged database access (service role, admin connection).

- `findClient(clientId)`, `insertClient(record)`
- `replaceGrant({ userId, clientId, clientName, scope })` deletes the existing `(user_id, client_id)` grant and
  inserts a fresh one. The cascade drops the old secrets, so re-approving also recovers a client that lost its
  tokens.
- `storeAuthorizationCode(grantId, { codeHash, codeChallenge, redirectUri, expiresAt }, delegatedSecret)`
- `findByCode | findByAccessToken | findByRefreshToken(hash)` run one query on `mcp_grant_secrets` **inner joined**
  to `mcp_grants` and return `{ grant, secrets } | null`. Because the join is inner, a deleted grant fails the
  lookup on the very next request.
- `issueTokens(grantId, { accessTokenHash, accessTokenExpiresAt, refreshTokenHash })` is one UPDATE that writes the
  new hashes **and nulls the code columns**, which makes codes single-use.
- `updateDelegatedSecret(grantId, secret)` (after an upstream refresh) and `touchGrant(grantId)` (`last_used_at`,
  fire-and-forget).

## Authenticate

`auth` turns the bearer into a context. Tools get the delegated context and nothing else: no project id they can
trust, no user id to substitute, no privileged client.

```ts
export const authenticate = async (token: string): Promise<AgentContext> => {
  const entry = await findByAccessToken(await sha256Hex(token));
  if (!entry) throw new UnauthorizedError('unknown access token');
  if (Date.parse(entry.secrets.access_token_expires_at ?? '') < Date.now())
    throw new UnauthorizedError('the access token has expired');
  const context = await delegation.context(entry); // the adapter, see delegation.md
  touchGrant(entry.grant.id).catch((e) => console.error('failed to record agent usage', e));
  return { grant: entry.grant, context };
};
```

## Endpoints

**`POST /register`** (RFC 7591, open). It is safe to leave open because registering grants nothing. Validate
`redirect_uris`: 1–10 entries, each `https:`, or `http:` only on `localhost`/`127.0.0.1`, or a custom scheme (for
desktop clients). Insert `{ client_id: randomToken('vmc-', 16), client_name (trimmed, ≤120, default "Unnamed agent"),
client_uri (≤500), redirect_uris }`. Respond 201 with `client_id, client_id_issued_at, client_name, redirect_uris,
grant_types: ["authorization_code","refresh_token"], response_types: ["code"], token_endpoint_auth_method: "none",
scope`. Rate-limit it per IP if your platform makes that easy.

**`GET /authorize`** runs before any user is involved. Validate that `client_id` is known, `redirect_uri` exactly
matches a registered URI, `response_type=code`, and `code_challenge` is present with `code_challenge_method=S256`.
**On any failure answer 400 directly and never redirect.** On success, 302 to
`${APP_ORIGIN}/agent/authorize?<same query>`.

**`GET /consent`** is called by the consent page with the user's web-app credentials (a bearer JWT, or the session
cookie when the server shares the web app's origin). It identifies the user with the same check the web API uses,
re-runs the `/authorize` validation, and returns `{ client_name, client_uri, scope, capabilities: AGENT_CAPABILITIES }`.

**`POST /consent`** is the only path that creates a grant. The body is the forwarded params plus `approved`. Require
the user's credentials and re-validate every param; never trust the browser to keep them intact. When it relies on a
cookie, also require a CSRF token or a same-origin check. On deny, return
`{ redirect_url: "<redirect_uri>?error=access_denied&state=…" }`. On approve:

1. `secret = await delegation.capture(user)` (null for adapters that store nothing)
2. `grant = await replaceGrant({ userId, clientId, clientName, scope })`
3. `code = randomToken('vmc_')`; store `sha256Hex(code)`, the challenge, the redirect URI, `expiresAt = now + 60 s`
   and the encrypted secret
4. return `{ redirect_url: "<redirect_uri>?code=…&state=…" }`; the page calls `window.location.assign`.

**`POST /token`** is form-encoded (accept JSON too, for tolerance).

- `authorization_code`: require `code` and `code_verifier`, then look up by `sha256Hex(code)`. Reject an unknown
  (already used) or expired code, a `client_id` or `redirect_uri` that is sent and doesn't match, or a failed PKCE
  check.
- `refresh_token`: look up by `sha256Hex(refresh_token)` and reject an unknown token or a mismatched `client_id`.
- Every rejection is `400 invalid_grant`; any other grant type gets `unsupported_grant_type`.
- Both grant types end in `issue()`: a new access token (1 h) and a new refresh token, stored as hashes in one UPDATE
  that also clears the code. Reply `{ access_token, token_type: "Bearer", expires_in: 3600, refresh_token, scope }`.
  Never return the product's own session token.
