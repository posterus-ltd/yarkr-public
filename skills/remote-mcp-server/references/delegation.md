# Delegation adapters

Delegation is the one piece that lets a tool call act as the approving user, so that whatever already decides access
in the product (RLS, security rules, a policy layer) decides it for the agent too. Pick the adapter that reaches
your existing authorization; never write a second set of access checks for the agent.

```ts
export interface Delegation<C> {
  // Runs once at consent, while the user is present. Returns an encrypted secret
  // to store on the grant, or null when nothing needs storing.
  capture(user: { id: string; email?: string }): Promise<string | null>;
  // Runs on every MCP request after the grant is re-checked. The result is the
  // only thing tools receive.
  context(entry: GrantWithSecrets): Promise<C>;
}
```

Prefer an adapter that stores nothing: there is no `MCP_TOKEN_KEY` to lose, and revoking a grant takes effect
everywhere on the next request.

## Supabase (PostgREST + RLS)

Mint a separate GoTrue session per grant at consent, store it encrypted, refresh it 60 s before expiry, and hand
tools a Supabase client carrying its access token. Full code: [supabase.md](supabase.md#delegated-session).

## Postgres RLS on your own backend

Run each tool call in a transaction that sets the user for that transaction only. Policies read the setting.

```ts
export const postgresDelegation: Delegation<ToolContext> = {
  capture: async () => null,
  context: async ({ grant }) => ({
    withUser: async <T>(fn: (db: PoolClient) => Promise<T>) => {
      const db = await pool.connect();
      try {
        await db.query('begin');
        await db.query(`select set_config('app.user_id', $1, true)`, [grant.user_id]); // true = transaction-local
        await db.query('set local role app_user'); // a role without BYPASSRLS that doesn't own the tables
        const result = await fn(db);
        await db.query('commit');
        return result;
      } catch (e) {
        await db.query('rollback');
        throw e;
      } finally {
        db.release();
      }
    },
  }),
};
```

```sql
create policy "own projects" on projects for all to app_user
  using (owner_id = current_setting('app.user_id', true)::uuid);
```

- The pool's login role must be a member of `app_user`; table owners and `BYPASSRLS` roles skip policies unless the
  table has `force row level security`.
- `set local`/`set_config(..., true)` are transaction-scoped, so this is safe behind PgBouncer in transaction mode.
- If the web app already sets claims differently (e.g. `request.jwt.claims` JSON), set exactly what it sets.

## Service or policy layer (Rails, Django, Nest, Laravel, …)

Build the same principal the web API builds for a signed-in request, and have tools call the same services.

```ts
export const appDelegation: Delegation<ToolContext> = {
  capture: async () => null,
  context: async ({ grant }) => {
    const user = await users.findById(grant.user_id);
    if (!user || user.disabled) throw new UnauthorizedError('this account is no longer active');
    return { user, projects: projectService.forUser(user), canvas: canvasService.forUser(user) };
  },
};
```

- If checks live in controllers (Pundit `authorize`, Django view mixins, Nest guards) rather than in services, the
  tools would bypass them. Either move the checks into the services, or call the product's own HTTP API as the user
  (next adapter) instead of the services.
- Python: the same shape with Pydantic models as tool schemas (`model_json_schema()` for `inputSchema`,
  `extra='forbid'` to refuse unknown fields).

## A downstream API that accepts a user JWT you can sign

When the API (or PostgREST, Hasura, an internal service) trusts JWTs signed with a key you hold, sign a short-lived
token per request instead of storing a session.

```ts
import { SignJWT } from 'jose';

export const jwtDelegation: Delegation<ToolContext> = {
  capture: async () => null,
  context: async ({ grant }) => {
    const user = await loadClaims(grant.user_id); // the same claims the web login puts in: role, org, email…
    const jwt = await new SignJWT({ ...user.claims, sub: grant.user_id })
      .setProtectedHeader({ alg: 'ES256', kid: SIGNING_KID })
      .setAudience('<api audience>')
      .setIssuedAt()
      .setExpirationTime('5m')
      .sign(signingKey);
    return { api: createApiClient({ token: jwt }) };
  },
};
```

Load real claims from the user record; never invent elevated ones. Keep the TTL short, since the token never leaves
the server.

## Firebase (security rules)

The Admin SDK bypasses security rules, so tools must use the REST APIs with a user ID token.

- **capture**: `admin.auth().createCustomToken(uid)`, then `POST
  https://identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key=<WEB_API_KEY>` with
  `{ token, returnSecureToken: true }` → `{ idToken, refreshToken, expiresIn }`. Encrypt and store all three.
- **context**: if the ID token expires within 60 s, `POST https://securetoken.googleapis.com/v1/token?key=<WEB_API_KEY>`
  with form `grant_type=refresh_token&refresh_token=…`, then store the rotated values. Call Firestore/Storage REST
  with `Authorization: Bearer <idToken>`.

## Stored sessions in general

Any adapter that stores an upstream session follows the same rules (Supabase and Firebase above):

- Mint a **new** session per grant; never copy the browser's.
- Refresh about 60 s before expiry and persist the rotated refresh token with `updateDelegatedSecret` before using
  the new access token.
- A failed refresh is a 401 with "the agent session has expired — reconnect the agent", not a 500.
- Revoking the grant blocks the next request immediately, but the upstream session stays valid until it expires.
  Nothing except the MCP server ever sees it.

## External identity provider

If your IdP already offers dynamic client registration (or Client ID Metadata Documents), PKCE `S256`, a consent
screen and audience-bound tokens (Auth0, Keycloak, WorkOS, Stytch, Descope and others; check that DCR is enabled on
your tenant or plan), let it be the authorization server:

- `protectedResourceMetadata` names the IdP issuer in `authorization_servers`. There is no `/register`, `/authorize`,
  `/consent`, `/token`, and no OAuth tables.
- `authenticate` verifies the JWT instead of looking up a hash:

  ```ts
  import { createRemoteJWKSet, jwtVerify } from 'jose';
  const jwks = createRemoteJWKSet(new URL('<IdP jwks_uri>'));

  export const authenticate = async (token: string) => {
    const { payload } = await jwtVerify(token, jwks, { issuer: IDP_ISSUER, audience: PUBLIC_ENDPOINT })
      .catch(() => { throw new UnauthorizedError('invalid access token'); });
    const user = await users.findByIdpSubject(payload.sub!);
    if (!user) throw new UnauthorizedError('no account for this identity');
    return { context: await appDelegation.context({ grant: { user_id: user.id } } as GrantWithSecrets) };
  };
  ```

- Check the audience. A token minted for another API at the same IdP must not work here.
- Revocation happens at the IdP. Self-contained JWTs keep working until they expire, so keep access tokens short
  (≤ 15 min), or use token introspection if the IdP supports it.
- The consent screen is the IdP's. Put `AGENT_CAPABILITIES` wherever it lets you describe the scope, and on the
  settings panel, which links to the IdP's "connected apps" page or lists grants through its management API.

The trade: less code to own, but the consent screen, the grant list and revocation all live in the IdP's UI.
