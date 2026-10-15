---
name: nextjs-middleware-routing
description: Write Next.js middleware (proxy.ts in Next 16) for redirects, rewrites, locale routing, headers and optimistic auth gating with tight matchers. Use when adding request-time routing logic, protecting route groups, or debugging middleware that loops or runs on assets.
---

# Next.js middleware / proxy

Runs before routing for every matched request. It can redirect, rewrite, set headers/cookies, or return a response.
Keep it fast: it sits on the critical path of every matched request.

## 0. Which file

- **Next 16**: the file is `proxy.ts` (root or `src/`) exporting `function proxy(request)`. It runs on the **Node.js
  runtime**. `middleware.ts` still works but is deprecated; it is the one to use only if you need the Edge runtime.
  Migrate with `npx @next/codemod@latest middleware-to-proxy .`
- **Next 15**: `middleware.ts` exporting `function middleware(request)`; Edge runtime by default (Node.js runtime is
  available from 15.5 via `export const config = { runtime: 'nodejs' }`).
- One file per project. Split logic into imported functions, not multiple middleware files.

Edge runtime limits: no `fs`, no native Node modules, limited Node APIs, small code size. Most ORMs and many auth SDKs
don't run there, which is a common reason to prefer the Node runtime.

## 1. Skeleton

```ts
// proxy.ts (Next 16)   -  for Next 15 name the file middleware.ts and the function middleware
import { NextResponse, type NextRequest } from 'next/server';

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith('/dashboard') && !request.cookies.has('session')) {
    const url = new URL('/login', request.url);
    url.searchParams.set('next', pathname);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  // skip API routes, static files, image optimisation and metadata files
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)'],
};
```

## 2. Matchers

- Always set `config.matcher`. Without it the function runs on every request, including `_next/static` assets.
- Matchers must be static constants (analysed at build time); no variables.
- Object form adds conditions: `{ source: '/admin/:path*', has: [{ type: 'cookie', key: 'session' }] }`, and
  `missing` for the inverse. Prefetch requests can be skipped with
  `missing: [{ type: 'header', key: 'next-router-prefetch' }, { type: 'header', key: 'purpose', value: 'prefetch' }]`.
- `/:path*` matches zero or more segments; test patterns against real URLs, including trailing slashes and locales.

## 3. Common recipes

**Redirect vs rewrite**: `NextResponse.redirect(url, 307|308)` changes the URL in the browser.
`NextResponse.rewrite(url)` serves another path while the URL stays the same (A/B tests, multi-tenant subdomains).

**Locale routing**:
```ts
const locales = ['en', 'de'];
const hasLocale = locales.some((l) => pathname === `/${l}` || pathname.startsWith(`/${l}/`));
if (!hasLocale) {
  const locale = pickLocale(request.headers.get('accept-language'), locales) ?? 'en';
  return NextResponse.redirect(new URL(`/${locale}${pathname}`, request.url));
}
```
Use a negotiation library (`@formatjs/intl-localematcher` + `negotiator`) rather than parsing the header by hand.
Prefer a cookie for a user's explicit choice over the header.

**Request headers for downstream**: pass data to Server Components via request headers, not response headers:
```ts
const headers = new Headers(request.headers);
headers.set('x-tenant', tenant);
return NextResponse.next({ request: { headers } });
```

**Security headers / CSP nonce**: generate a nonce per request, set `Content-Security-Policy` on the response and
forward the nonce in a request header so the layout can read it via `headers()`.

## 4. Auth gating: optimistic only

Middleware should do **optimistic** checks: is there a session cookie, is it a well-formed, unexpired JWT. Don't do
database lookups on every request, and never treat middleware as the only authorisation layer:
- Re-check auth in the data access layer, Server Actions and Route Handlers.
- A matcher mistake or a framework bug (see CVE-2025-29927, which let a crafted `x-middleware-subrequest` header skip
  middleware on unpatched versions) must not expose data. Keep Next.js patched.

## 5. Pitfalls

- Redirect loops: the login page itself matches and lacks a session. Exclude it in the matcher or the condition.
- Running on static assets because the matcher is missing or too broad: slow pages and wasted compute.
- Reading the request body: avoid it; middleware isn't for body processing.
- Large dependencies imported into middleware bloat cold starts.
- Setting cookies on `NextResponse.next()` without returning that same response object.
- Relying on `request.geo`/`request.ip`: removed from `NextRequest` in Next 15; use your host's headers or helpers.

## Checklist

- [ ] Correct file name and export for the Next version.
- [ ] `matcher` excludes `_next/static`, `_next/image`, metadata files and anything not needing the logic.
- [ ] No database calls or heavy imports; auth checks are optimistic and re-done at the data layer.
- [ ] Redirects use the intended status (307 temporary, 308 permanent) and can't loop.
- [ ] Tested with `next build && next start`, including prefetch and locale-prefixed paths.
