# Supabase adapter

The reference implementation: one Edge Function `mcp` (Deno), Postgres + RLS, GoTrue, PostgREST. This file holds
everything that is specific to Supabase; the rest of the skill applies unchanged.

Mapping:

| Generic | Supabase |
|---|---|
| `<E>` | `<API_URL or SUPABASE_URL>/functions/v1/mcp` |
| Issuer | `<APP_ORIGIN>`: Kong owns the API host root and returns 404 at `/.well-known/` |
| Privileged path | service-role client, only in `oauth/store.ts` and `mintDelegatedSession` |
| Delegation | a GoTrue session per grant; tools get a PostgREST client carrying it |
| Platform auth in front of `<E>` | `verify_jwt`, turned off for this function |

## Migration

Use the generic tables from [oauth.md](oauth.md#data-model) in `public`, with `user_id` referencing
`auth.users(id)`, then lock them down:

```sql
-- Supabase default privileges grant ALL on new tables to anon/authenticated.
revoke all on public.mcp_clients       from anon, authenticated;
revoke all on public.mcp_grants        from anon, authenticated;
revoke all on public.mcp_grant_secrets from anon, authenticated;
grant select, delete on public.mcp_grants to authenticated;

alter table public.mcp_clients       enable row level security;
alter table public.mcp_grants        enable row level security;
alter table public.mcp_grant_secrets enable row level security;

create policy "All for service role" on public.mcp_clients       to service_role using (true) with check (true);
create policy "All for service role" on public.mcp_grants        to service_role using (true) with check (true);
create policy "All for service role" on public.mcp_grant_secrets to service_role using (true) with check (true);
create policy "Select own" on public.mcp_grants for select to authenticated using (user_id = (select auth.uid()));
create policy "Delete own" on public.mcp_grants for delete to authenticated using (user_id = (select auth.uid()));
```

Store lookups use the PostgREST inner join:
`select('<secret cols>, grant:mcp_grants!inner(<grant cols>)')`.

## Env

```ts
// env.ts — SUPABASE_* are injected by the platform; never set them yourself.
export const ENV = {
  SUPABASE_URL: Deno.env.get('SUPABASE_URL') ?? '',
  SUPABASE_ANON_KEY: Deno.env.get('SUPABASE_ANON_KEY') ?? '',
  SUPABASE_SERVICE_ROLE_KEY: Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
  APP_ORIGIN: Deno.env.get('APP_ORIGIN') ?? 'https://<app>',
  MCP_TOKEN_KEY: Deno.env.get('MCP_TOKEN_KEY') ?? '',
  API_URL: Deno.env.get('API_URL') ?? '', // override for local runs, where SUPABASE_URL is a container host
};

export const PUBLIC_ENDPOINT = `${ENV.API_URL || ENV.SUPABASE_URL}/functions/v1/mcp`;
export const ISSUER = ENV.APP_ORIGIN;
```

Add `apikey` and `x-client-info` to the CORS allowed headers. The router strips everything up to `/mcp` from the
path, because the function sees `/mcp/...` while users see `/functions/v1/mcp/...`.

## Delegated session

```ts
const anonClient = (accessToken?: string) =>
  createClient(ENV.SUPABASE_URL, ENV.SUPABASE_ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
    ...(accessToken ? { global: { headers: { Authorization: `Bearer ${accessToken}` } } } : {}),
  });

// Who is at the consent screen, from their web-app session JWT.
export const verifyUserToken = async (accessToken: string) => {
  const { data, error } = await anonClient().auth.getClaims(accessToken);
  const c = data?.claims;
  return error || !c?.sub || !c.email ? null : { id: c.sub as string, email: c.email as string };
};

interface StoredSession { accessToken: string; refreshToken: string; expiresAt: string }
const toStored = (s: Session): StoredSession => ({ accessToken: s.access_token, refreshToken: s.refresh_token,
  expiresAt: new Date((s.expires_at ?? 0) * 1000).toISOString() });

export const supabaseDelegation: Delegation<ToolContext> = {
  // The agent's own GoTrue session, minted without sending mail.
  capture: async ({ email }) => {
    const admin = createClient(ENV.SUPABASE_URL, ENV.SUPABASE_SERVICE_ROLE_KEY,
      { auth: { persistSession: false, autoRefreshToken: false } });
    const { data, error } = await admin.auth.admin.generateLink({ type: 'magiclink', email: email! });
    const tokenHash = data?.properties?.hashed_token;
    if (error || !tokenHash) throw new Error(`failed to mint agent session: ${error?.message}`);
    const { data: v, error: ve } = await anonClient().auth.verifyOtp({ type: 'magiclink', token_hash: tokenHash });
    if (ve || !v.session) throw new Error(`failed to mint agent session: ${ve?.message}`);
    return encrypt(JSON.stringify(toStored(v.session)), requireTokenKey());
  },

  // A PostgREST client carrying the user's identity; refreshes ~60 s before expiry.
  context: async (entry) => {
    const key = requireTokenKey(); // throws when MCP_TOKEN_KEY is unset
    const stored: StoredSession = JSON.parse(await decrypt(entry.secrets.delegated_secret!, key));
    if (Date.parse(stored.expiresAt) - 60_000 > Date.now()) return { supabase: anonClient(stored.accessToken) };
    const { data, error } = await anonClient().auth.refreshSession({ refresh_token: stored.refreshToken });
    if (error || !data.session) throw new UnauthorizedError('the agent session has expired — reconnect the agent');
    const refreshed = toStored(data.session);
    await updateDelegatedSecret(entry.grant.id, await encrypt(JSON.stringify(refreshed), key));
    return { supabase: anonClient(refreshed.accessToken) };
  },
};
```

`GoTrue`'s email provider must stay enabled: `generateLink` needs it even though no email is sent.

## Tools on PostgREST

```ts
export interface ToolContext { supabase: SupabaseClient }

export const MAX_ROWS = 5000; // PostgREST max_rows: asking for more truncates silently

export const requireProject = async ({ supabase }: ToolContext, projectId: string) => {
  const { data, error } = await supabase.from('projects').select('id, name, domain, config')
    .eq('id', projectId).maybeSingle();
  if (error) throw new ToolError(`failed to read project: ${error.message}`);
  if (!data) throw new ToolError(`no project ${projectId} — either it does not exist or this account cannot access it`);
  return data;
};
```

A blocked UPDATE affects zero rows **without raising**, so every write selects what it changed:

```ts
const { data, error } = await supabase.from('projects').update({ config: next }).eq('id', id).select('id');
if (error) throw new ToolError(`failed to save: ${error.message}`);
if (!data?.length) throw new ToolError('not saved — this account cannot modify that project');
```

A write that needs the service role goes through the existing Edge Function on the delegated client, so the user's
JWT travels with it: `supabase.functions.invoke('new-project', { body })`.

Edge deploys upload only `supabase/functions/`, so the function can't import the web app's schemas; this is the case
the published contract in [mcp-endpoint.md](mcp-endpoint.md#published-contract-optional) exists for.

## Web app

The settings panel reads `select id, client_name, created_at, last_used_at from mcp_grants` on the normal client
(RLS scopes it) and revokes with `delete().eq('id', id).select('id')`, treating an empty result as "already gone".
The consent page sends `Authorization: Bearer <session.access_token>` to `/consent`.

## Config, secrets and deploy

```toml
# supabase/config.toml — the function authenticates its own tokens, and the
# OAuth endpoints must answer before any token exists.
[functions.mcp]
verify_jwt = false
```

```bash
# supabase/.env.functions (never commit)
APP_ORIGIN=https://<app>                   # issuer, consent host
API_URL=https://<api host>                 # optional public API host when it isn't SUPABASE_URL
MCP_TOKEN_KEY=$(openssl rand -base64 32)   # rotating it disconnects every agent
```

1. `supabase db push` (the migration)
2. `supabase config push` (`verify_jwt = false`; forgetting it gives gateway 401s before the function runs)
3. `supabase secrets set --env-file supabase/.env.functions`
4. `supabase functions deploy mcp`
5. Deploy the web app, together with `.well-known/oauth-authorization-server` and any `schema/agent-contract.json`
