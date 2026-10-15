---
name: nextjs-route-handlers
description: Build Next.js route handlers (route.ts) for APIs, webhooks, downloads and streaming, with correct params typing, caching, runtime and maxDuration. Use when adding an endpoint under app/, verifying webhook signatures, streaming SSE/LLM output, or fixing GET caching surprises.
---

# Next.js Route Handlers

`app/**/route.ts` exports functions named after HTTP methods (`GET`, `POST`, `PUT`, `PATCH`, `DELETE`, `HEAD`,
`OPTIONS`). They take Web `Request`/`NextRequest` and return `Response`/`NextResponse`.

## 1. When to use one (and when not)

Use a Route Handler for: public/third-party APIs, webhooks, OAuth callbacks, file downloads, feeds (RSS, sitemaps
beyond `sitemap.ts`), streaming endpoints, and endpoints called by mobile apps.

Don't use one for:
- Data your own Server Components need: call the data function directly.
- Mutations from your own forms: use a Server Action.

## 2. Template

```ts
// app/api/projects/[id]/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { getSession } from '@/lib/auth';

const Patch = z.object({ name: z.string().min(1).max(100) });

export async function PATCH(request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;                       // params is a Promise in Next 15+
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ error: 'invalid json' }, { status: 400 }); }
  const parsed = Patch.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });

  const project = await updateProjectIfOwner(id, session.userId, parsed.data);
  if (!project) return NextResponse.json({ error: 'not found' }, { status: 404 });
  return NextResponse.json(project);
}
```

- Recent versions generate a global `RouteContext<'/api/projects/[id]'>` type helper during `next dev`/`build`/
  `next typegen`; use it for `ctx` if available.
- Use 401 vs 403 vs 404 deliberately; return 404 for resources the user may not know exist.
- Return consistent error shapes. Never return stack traces or raw DB errors.
- A `route.ts` cannot live in the same segment as `page.tsx`.

## 3. Caching behaviour

- Next 15+: `GET` handlers are **dynamic by default**. Opt into static with `export const dynamic = 'force-static'`
  (classic model) or put the data behind `'use cache'` (Cache Components model).
- Non-GET methods are never cached.
- Reading `request.headers`, cookies or search params makes the handler dynamic anyway.
- Set HTTP caching explicitly when useful: `headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300' }`.

## 4. Webhooks

```ts
export async function POST(request: Request) {
  const raw = await request.text();                      // raw body: needed for signature verification
  const sig = request.headers.get('stripe-signature');
  let event;
  try { event = stripe.webhooks.constructEvent(raw, sig!, process.env.STRIPE_WEBHOOK_SECRET!); }
  catch { return new Response('bad signature', { status: 400 }); }

  if (await alreadyProcessed(event.id)) return new Response(null, { status: 200 });  // idempotency
  await enqueue(event);                                  // do slow work async; answer fast
  return new Response(null, { status: 200 });
}
```

- Read the body once, as text, before parsing; `request.json()` loses the exact bytes the signature covers.
- Make processing idempotent (providers retry), and respond within the provider's timeout.
- Exclude webhook paths from middleware auth redirects.
- Revalidate caches (`revalidateTag`) here after CMS/content webhooks.

## 5. Streaming

```ts
export async function GET() {
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      for await (const chunk of source()) controller.enqueue(encoder.encode(`data: ${JSON.stringify(chunk)}\n\n`));
      controller.close();
    },
  });
  return new Response(stream, { headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache' } });
}
```

- Listen to `request.signal` to stop work when the client disconnects.
- Hosted platforms cap execution time: set `export const maxDuration = 60` (seconds, within your plan's limit).

## 6. Runtime and segment options

- `export const runtime = 'nodejs'` (default) or `'edge'`. Use Node unless you have a measured latency reason; most
  SDKs, ORMs and crypto libraries need Node.
- `export const dynamic`, `revalidate`, `maxDuration` and `preferredRegion` are the useful segment options. In the Cache
  Components model `dynamic`/`revalidate` don't apply.

## 7. CORS and methods

- Same-origin calls need nothing. For cross-origin, answer `OPTIONS` and set `Access-Control-Allow-Origin` to an
  allowlisted origin, never `*` with credentials.
- Unexported methods return 405 automatically.

## Pitfalls

- Fetching your own route handler from a Server Component during build (the server isn't running): call the function.
- Parsing the webhook body as JSON before verifying the signature.
- Assuming `GET` is cached (Next 14 behaviour) or assuming it's dynamic when `force-static` is set.
- Long synchronous work in a webhook, causing provider timeouts and duplicate deliveries.
- Missing auth on handlers because middleware "covers /api" while the matcher excludes `/api`.

## Checklist

- [ ] Auth, validation and authorisation in every mutating handler; consistent JSON errors and status codes.
- [ ] `params` awaited; types match the folder name.
- [ ] Caching is explicit (dynamic/static or `Cache-Control`) and verified in `next build` output.
- [ ] Webhooks verify signatures on the raw body and are idempotent.
- [ ] Streaming handlers honour `request.signal` and `maxDuration`.
