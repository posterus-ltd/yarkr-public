---
name: nextjs-caching-revalidation
description: 'Reason about Next.js caching: fetch/data cache, full route cache, router cache, ''use cache'' with cacheLife/cacheTag, and tag or path revalidation. Use when data is stale after a mutation, a route is unexpectedly static or dynamic, or when picking a caching strategy.'
---

# Next.js caching and revalidation

First find out which model the project uses. It decides everything else.

```bash
grep -E '"next":' package.json
grep -nE 'cacheComponents|dynamicIO|useCache|staleTimes' next.config.*
```

- **Cache Components model** (Next 16 with `cacheComponents: true`): nothing is cached unless you say so with
  `'use cache'`. Go to section 2.
- **Classic model** (Next 15, or 16 without the flag): segment config (`revalidate`, `dynamic`), `fetch` options and
  `unstable_cache`. Go to section 3.

## 1. The layers (both models)

| Layer | Where | What | Cleared by |
| --- | --- | --- | --- |
| Request memoisation | server, one render | identical `fetch` GETs / `React.cache` fns | end of request |
| Data cache | server, persistent | `fetch` results, `'use cache'` results | `revalidateTag`, `updateTag`, `revalidatePath`, time |
| Full route cache | server, persistent | HTML + RSC payload of static routes | revalidation, redeploy |
| Router cache | browser memory | RSC payloads of visited/prefetched routes | `router.refresh()`, Server Action revalidation, staleTimes |

When a user says "it's stale", identify the layer: stale after reload = server cache; stale only on back/forward
navigation = router cache.

## 2. Cache Components model (`'use cache'`)

```ts
// next.config.ts
const nextConfig = { cacheComponents: true };
```

```tsx
import { cacheLife, cacheTag } from 'next/cache';

export async function getProducts(category: string) {
  'use cache';
  cacheLife('hours');              // preset: seconds | minutes | hours | days | weeks | max, or a custom profile
  cacheTag('products', `products:${category}`);
  return db.product.findMany({ where: { category } });
}
```

- `'use cache'` can sit at the top of a file, a component, or a function. Arguments and closed-over values form the
  cache key, so they must be serialisable.
- You can't call `cookies()`, `headers()` or read `searchParams` inside a cached scope. Read them outside and pass the
  needed values in as arguments.
- Anything dynamic and uncached must render inside `<Suspense>`; otherwise the build fails with an error about
  uncached data outside Suspense. This gives a static shell plus streamed dynamic holes (partial prerendering).
- Use `await connection()` from `next/server` to mark a component as request-time explicitly.
- Variants: `'use cache: private'` for per-user data that may read cookies (cached in the browser only),
  `'use cache: remote'` for a shared remote cache handler. Check the docs for your exact version before using them.
- Segment configs `dynamic`, `revalidate` and `fetchCache` don't apply in this model; remove them.

## 3. Classic model

- `fetch` is **not cached by default** in Next 15+. Opt in per call:
  `fetch(url, { next: { revalidate: 3600, tags: ['products'] } })` or `{ cache: 'force-cache' }`.
- Route-level: `export const revalidate = 60` (ISR), `export const dynamic = 'force-static' | 'force-dynamic'`.
- Non-fetch data (ORM, SDK): wrap with `unstable_cache(fn, keyParts, { revalidate, tags })`. It's legacy; prefer
  `'use cache'` when upgrading.
- A route becomes dynamic as soon as it reads `cookies()`, `headers()`, `searchParams`, `connection()` or an uncached
  fetch. `next build` shows each route as static or dynamic; check it after changes.
- `generateStaticParams` + `revalidate` gives ISR for dynamic segments; `dynamicParams = false` returns 404 for unknown
  params.

## 4. Revalidation: choosing the call

| Situation | Call |
| --- | --- |
| User just wrote data and must see it immediately (Server Action) | Next 16: `updateTag('tag')`; Next 15: `revalidateTag('tag')` |
| Background refresh is fine, serve stale meanwhile | `revalidateTag('tag', 'max')` (Next 16 form) |
| Webhook from a CMS or payment provider | `revalidateTag` in a Route Handler after verifying the signature |
| One known page, no tags in place | `revalidatePath('/blog/my-post')` |
| Every page of a dynamic route | `revalidatePath('/blog/[slug]', 'page')` |
| Whole app (rare, e.g. global nav change) | `revalidatePath('/', 'layout')` |
| Client-side refresh of current route | `router.refresh()` |

Tag design: one broad tag per entity type (`products`) plus one per record (`product:42`). Mutations of a single record
revalidate the record tag and any list tags it appears in.

## 5. Router cache

- Next 15+ doesn't reuse page segments from the client cache for dynamic pages by default (`staleTimes.dynamic = 0`);
  layouts and `loading` states are still reused, and back/forward restores from cache.
- Revalidating inside a Server Action also invalidates the router cache for the user who called it. Other users only
  see the change on their next server request.
- `staleTimes` in `next.config` raises reuse windows; only change it with a clear reason.

## 6. Debugging

1. Run `next build && next start` - caching behaves differently in `next dev`.
2. Check the build route table: is the route static or dynamic as expected?
3. Set `logging: { fetches: { fullUrl: true } }` in `next.config` to log fetch cache hits/misses.
4. Confirm the mutation calls revalidation with the **same tag string** the read used.
5. For self-hosted multi-instance deployments, configure a shared cache handler; the default is local to each
   instance, so revalidation on one pod doesn't reach the others.

## Pitfalls

- Caching per-user data in a shared cache (mixing users' data). Keep auth-dependent reads uncached or use the private
  variant.
- Calling `cookies()` inside a cached function.
- Revalidating `'/'` with type `'layout'` on every mutation: purges everything.
- Expecting `fetch` to be cached by default after upgrading from Next 14.
- Using `Date.now()` in a cached scope and expecting it to change per request.
