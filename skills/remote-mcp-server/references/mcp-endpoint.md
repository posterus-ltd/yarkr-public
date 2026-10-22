# The MCP endpoint and its tools

## Env and HTTP shell

```ts
// env.ts — read from your runtime's config (process.env, Deno.env, Worker bindings…).
export const ENV = {
  PUBLIC_ENDPOINT: env('MCP_PUBLIC_ENDPOINT'),  // exactly what users paste, e.g. https://api.example.com/mcp
  APP_ORIGIN: env('APP_ORIGIN'),                // consent page host
  ISSUER: env('MCP_ISSUER'),                    // origin of PUBLIC_ENDPOINT, or APP_ORIGIN when a gateway owns that root
  MCP_TOKEN_KEY: env('MCP_TOKEN_KEY'),          // only needed when the delegation adapter stores a secret
};

// Behind a proxy or gateway the request URL is an internal host, so the
// public endpoint is configured, never read off the request.
export const publicEndpoint = () => ENV.PUBLIC_ENDPOINT;
export const agentContractUrl = () => `${ENV.APP_ORIGIN}/schema/agent-contract.json`;

export const SUPPORTED_PROTOCOL_VERSIONS = ['2025-06-18', '2025-03-26']; // the revisions you implement, newest first
export const DEFAULT_PROTOCOL_VERSION = SUPPORTED_PROTOCOL_VERSIONS[0];
export const CONSENT_PATH = '/agent/authorize';
export const AUTHORIZATION_CODE_TTL_SECONDS = 60;
export const ACCESS_TOKEN_TTL_SECONDS = 60 * 60;
```

```ts
// http.ts
const ALLOWED_HEADERS = ['authorization', 'content-type', 'accept',
  'mcp-protocol-version', 'mcp-session-id', 'last-event-id'].join(', '); // + any your platform's clients send
const EXPOSED_HEADERS = ['www-authenticate', 'mcp-protocol-version', 'mcp-session-id'].join(', ');

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': ALLOWED_HEADERS,
  'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
  'Access-Control-Expose-Headers': EXPOSED_HEADERS, // browser clients must be able to read the challenge
  'Access-Control-Max-Age': '86400',
};

export const json = (status: number, body: unknown, headers: Record<string, string> = {}) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders,
    'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', ...headers } });

export const oauthError = (status: number, error: string, description: string) =>
  json(status, { error, error_description: description });
export const noContent = (status = 204) => new Response(null, { status, headers: corsHeaders });
export const redirect = (location: string) =>
  new Response(null, { status: 302, headers: { ...corsHeaders, location, 'cache-control': 'no-store' } });

// The 401 that bootstraps discovery (RFC 9728).
export const unauthorized = (resourceMetadataUrl: string, description: string) =>
  json(401, { error: 'invalid_token', error_description: description }, {
    'WWW-Authenticate': `Bearer realm="<product>", error="invalid_token", error_description="${description}", resource_metadata="${resourceMetadataUrl}"`,
  });

export const bearerToken = (req: Request) => {
  const h = req.headers.get('Authorization') ?? '';
  return h.toLowerCase().startsWith('bearer ') ? h.slice(7).trim() : null;
};

export const readParams = async (req: Request): Promise<Record<string, string>> => {
  if ((req.headers.get('content-type') ?? '').includes('application/json')) {
    const body = await req.json().catch(() => ({}));
    return Object.fromEntries(Object.entries(body ?? {}).map(([k, v]) => [k, String(v)]));
  }
  const form = await req.formData().catch(() => new FormData());
  return Object.fromEntries([...form.entries()].map(([k, v]) => [k, String(v)]));
};
```

## Router

One `handle(req: Request): Promise<Response>`, mounted wherever the stack serves requests: `Deno.serve(handle)`,
`Bun.serve({ fetch: handle })`, a Worker's `fetch`, `app.all('/mcp/*', (c) => handle(c.req.raw))` in Hono, or a
Next.js catch-all route handler. Express needs a Request/Response bridge (or `@hono/node-server`).

```ts
const MOUNT = '/mcp'; // the last segment of the path the server sees for <E>

export const handle = async (req: Request) => {
  if (req.method === 'OPTIONS') return noContent();
  const url = new URL(req.url);
  const cut = url.pathname.indexOf(MOUNT) + MOUNT.length;
  const path = url.pathname.slice(cut).replace(/\/$/, '');
  try { return await route(req, url, publicEndpoint(), path); }
  catch (e) {
    console.error('mcp request failed', e);
    return json(500, { error: 'server_error', error_description: 'the request could not be completed' });
  }
};

const route = (req: Request, url: URL, base: string, path: string) => {
  const isGet = req.method === 'GET', isPost = req.method === 'POST';
  // startsWith: RFC 9728 lets clients append the resource path to the well-known path.
  if (isGet && path.startsWith(PROTECTED_RESOURCE_PATH)) return json(200, protectedResourceMetadata(base));
  if (isGet && path.startsWith(AUTHORIZATION_SERVER_PATH)) return json(200, authorizationServerMetadata(base));
  if (path === '/register' && isPost) return handleRegister(req);
  if (path === '/authorize' && isGet) return handleAuthorize(url);
  if (path === '/consent' && isGet) return handleConsentDetails(req, url);
  if (path === '/consent' && isPost) return handleConsent(req);
  if (path === '/token' && isPost) return handleToken(req);
  if (path === '') {
    if (isPost) return handleRpc(req, base);
    if (isGet) return json(405, { error: 'method_not_allowed', error_description: 'this server does not offer an SSE stream' });
    if (req.method === 'DELETE') return noContent();
  }
  return json(404, { error: 'not_found', error_description: `no ${path}` });
};
```

When the issuer is `<E>`'s own origin, also answer `GET /.well-known/oauth-authorization-server` (and
`/.well-known/oauth-protected-resource/mcp`) at the host root, outside the mount.

`handleRpc(req, base)`:

1. No bearer token, or `authenticate` throws `UnauthorizedError` → `unauthorized(resourceMetadataUrl(base), msg)`.
2. Invalid JSON body → 400 with JSON-RPC error `-32700`.
3. Accept one message or a batch, dispatch each one, and drop the nulls (notifications). No replies left → `202` with
   an empty body.
4. Otherwise `200` with the reply (or an array for a batch), plus `MCP-Protocol-Version`: the version negotiated from
   `initialize` params, else the request header, else the default.

`dispatch(message, context)`:

- If `jsonrpc !== '2.0'` or there is no method → `-32600` (null if it was a notification). `notifications/*` → null.
- `initialize` → `{ protocolVersion, capabilities: { tools: { listChanged: false }, resources: { listChanged: false } },
  serverInfo: { name, title, version }, instructions }`.
- `ping` → `{}`. `tools/list` → `{ tools: TOOL_DEFINITIONS }`. `tools/call` → `callTool(name, arguments, context)`.
- `resources/list` → `{ resources }`. `resources/read` → `{ contents }`, `-32002` for an unknown URI, `-32603` when a
  fetched contract is unavailable (answer that one request, not 500 for the whole batch).
- Unknown method → `-32601`.

## Tools

`ToolContext` is whatever the delegation adapter returns: a Supabase client, a `withUser` transaction runner, or a
set of user-scoped services ([delegation.md](delegation.md)). It never contains a privileged client.

```ts
// tools/shared.ts
import { z } from 'zod'; // v4

export interface ToolDefinition { name: string; title: string; description: string;
  inputSchema: Record<string, unknown>; annotations?: Record<string, unknown> }
// schema lives on the tool, not the definition, so it never crosses the wire.
export interface Tool { definition: ToolDefinition; schema: z.ZodType;
  run: (args: Record<string, unknown>, ctx: ToolContext) => Promise<unknown> }

export const toInputSchema = (schema: z.ZodType) => {
  const j = z.toJSONSchema(schema, { io: 'input', unrepresentable: 'any' }) as Record<string, unknown>;
  delete j.$schema; // MCP tool schemas carry no dialect marker
  return j;
};

export class ToolError extends Error {} // message written for the agent to act on

export const readOnly = { readOnlyHint: true, openWorldHint: false };
export const writes = { readOnlyHint: false, destructiveHint: true, idempotentHint: true, openWorldHint: false };

export const MAX_ROWS = 5000; // your data layer's hard cap; asking for more truncates silently
export const projectIdField = z.string().describe('Project UUID, as returned by list_projects.');

// Turns "no rows" into an error that names both causes.
export const requireProject = async (ctx: ToolContext, projectId: string) => {
  const project = await ctx.projects.find(projectId); // scoped to the user by the adapter
  if (!project) throw new ToolError(`no project ${projectId} — either it does not exist or this account cannot access it`);
  return project;
};
```

A read tool:

```ts
const args = z.strictObject({
  projectId: projectIdField,
  limit: z.number().int().min(1).max(200).optional(),
});

export const listThings: Tool = {
  definition: {
    name: 'list_things',
    title: 'List things',
    description: 'What it returns, when to call it, and what to call first.',
    inputSchema: toInputSchema(args),
    annotations: readOnly,
  },
  schema: args,
  run: async (a, ctx) => {
    const project = await requireProject(ctx, a.projectId as string);
    return { things: await ctx.things.list({ projectId: project.id, limit: (a.limit as number) ?? 50 }) };
  },
};
```

A write proves it landed. Under RLS a blocked UPDATE affects zero rows **without raising**, so check the affected
row count; in a service layer, make the service raise on not-found/forbidden. Supabase version:
[supabase.md](supabase.md#tools-on-postgrest).

If several writers share one JSON column, read it, modify it and write the whole value back through one helper,
merging rather than replacing. A write that needs more than the user's own permissions goes through the code path
the web app already uses for it, called as the user.

```ts
// tools/index.ts
export const TOOLS: Tool[] = [ /* every tool */ ];
export const TOOL_DEFINITIONS = TOOLS.map((t) => t.definition);
// Shown on the consent screen; one line per capability, kept next to TOOLS.
export const AGENT_CAPABILITIES = ['Read the projects this account can access', /* … */];

export const callTool = async (name: string, args: Record<string, unknown>, context: ToolContext) => {
  const tool = TOOLS.find((t) => t.definition.name === name);
  if (!tool) return text(`Unknown tool "${name}".`, true);
  const parsed = tool.schema.safeParse(args ?? {});
  if (!parsed.success) return text(`invalid arguments for ${name}: ${z.prettifyError(parsed.error)}`, true);
  try { return text(JSON.stringify(await tool.run(parsed.data as Record<string, unknown>, context), null, 2)); }
  catch (e) {
    if (e instanceof ToolError) return text(e.message, true);
    console.error(`tool ${name} failed`, e);
    return text('The request could not be completed. This has been logged.', true);
  }
};
const text = (t: string, isError = false) => ({ content: [{ type: 'text', text: t }], ...(isError ? { isError: true } : {}) });
```

## Instructions and resources

The reference `instructions`, abridged. Each paragraph covers one area, names its tools, and says what to call
first:

```text
<Product> is web monitoring for one or more websites: analytics, error tracking and user feedback in one place.

Start with list_projects to get a project id. get_project_summary answers "how is the site doing"; list_errors and
list_feedback cover what is breaking and what users are saying.

If the site is not monitored yet, create_project returns a new project id together with the tracking script to add
— check list_projects first so an existing project is reused rather than duplicated.

configure_* tools: only the fields you pass change, and updates take effect on the site's next page load.

The canvas is the user's own dashboard. Read it with get_canvas, call describe_canvas for the widgets available,
then append_to_canvas or set_canvas. Changes are immediately visible to the user, so say what you changed.

When a result is a trend, a share or a breakdown, render it as a Mermaid diagram (xychart-beta for trends, pie for
shares). The "guide" resource has the full overview and diagram examples.
```

Resources: `<product>://guide` (markdown that repeats the instructions with one Mermaid example per chart type) and
any contract the agent must read before writing (e.g. `<product>://canvas/contract`). Mirror the contract as a
`describe_*` tool too.

## Published contract (optional)

Use it when tools must validate against vocabulary the web app owns (widget catalog, install snippet, layout shape)
and the MCP server is deployed separately from the web app:

1. The web build (e.g. a Vite plugin) runs `z.toJSONSchema` on the domain Zod schemas and emits
   `schema/agent-contract.json` = `{ version: 1, schemas: { … }, widgetCatalog, setupInstructions }` into the static
   output. It is generated and never committed.
2. The server fetches `agentContractUrl()` and checks the envelope with a `z.literal(1)` version. It rebuilds
   validators with `z.fromJSONSchema` and keeps only the relational checks JSON Schema can't express (dangling
   edges, unknown ids).
3. Cache the *promise* per URL so concurrent calls share one fetch. Success lives 5 min (matching the object's
   `cache-control`), failure 30 s, with a 5 s timeout. On failure, throw a `SchemaUnavailableError` that names the
   URL. Don't bundle a fallback.

Adding a widget is then a web-app deploy and nothing else.
