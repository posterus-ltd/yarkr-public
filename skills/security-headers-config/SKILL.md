---
name: security-headers-config
description: Set and verify HTTP security headers (HSTS, X-Content-Type-Options, Referrer-Policy, Permissions-Policy, frame-ancestors, COOP/CORP) in frameworks, proxies and CDNs. Use when hardening a web app or API, fixing a missing-header finding, or reviewing server/proxy config.
---

# Security headers

Headers are cheap defence in depth. Set them in one place (the edge proxy/CDN or one app middleware), verify them on
real responses, and roll out the risky ones (HSTS preload, CSP) gradually.

## 1. Baseline for HTML responses

```
Strict-Transport-Security: max-age=63072000; includeSubDomains
X-Content-Type-Options: nosniff
Referrer-Policy: strict-origin-when-cross-origin
Content-Security-Policy: frame-ancestors 'self'; ...      (see content-security-policy)
X-Frame-Options: SAMEORIGIN                                 (legacy fallback for frame-ancestors)
Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=(), usb=()
Cross-Origin-Opener-Policy: same-origin
Cross-Origin-Resource-Policy: same-origin
```

For JSON APIs: `X-Content-Type-Options: nosniff`, correct `Content-Type`, `Cache-Control: no-store` on
authenticated responses, HSTS. A restrictive `Content-Security-Policy: default-src 'none'; frame-ancestors 'none'` is
harmless on API responses.

## 2. Header by header

| Header | Guidance |
| --- | --- |
| `Strict-Transport-Security` | Only over HTTPS. Start with `max-age=300`, then raise to 1-2 years. Add `includeSubDomains` only when every subdomain serves HTTPS. `preload` only after submitting to the preload list deliberately; removal is slow. |
| `X-Content-Type-Options` | Always `nosniff`; also serve correct `Content-Type` for every file. |
| `Referrer-Policy` | `strict-origin-when-cross-origin` (browser default today, set it explicitly) or `no-referrer` for sensitive apps. Prevents leaking tokens in URLs to third parties. |
| `frame-ancestors` (CSP) / `X-Frame-Options` | Clickjacking defence. `'none'`/`DENY` unless the app must be framed; then list exact origins in `frame-ancestors`. |
| `Permissions-Policy` | Disable powerful features you do not use. Syntax is structured: `feature=()` disables, `feature=(self)` allows same origin. |
| `Cross-Origin-Opener-Policy` | `same-origin` isolates the window from cross-origin openers. Use `same-origin-allow-popups` if OAuth/payment popups break. |
| `Cross-Origin-Resource-Policy` | `same-origin` / `same-site` on private resources; `cross-origin` on assets meant for embedding. |
| `Cross-Origin-Embedder-Policy` | Only when you need cross-origin isolation (SharedArrayBuffer); `require-corp` breaks third-party embeds. |
| `Cache-Control` | `no-store` for pages/responses with personal data or tokens. |

Do **not** add `X-XSS-Protection` other than `0` (the legacy auditor is removed from browsers and could introduce
issues). Remove version-leaking headers (`Server` details, `X-Powered-By`).

## 3. Where to set them

nginx (remember: `add_header` in a nested block replaces all inherited ones; repeat or use an include):

```nginx
add_header Strict-Transport-Security "max-age=63072000; includeSubDomains" always;
add_header X-Content-Type-Options "nosniff" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
add_header Permissions-Policy "camera=(), microphone=(), geolocation=()" always;
add_header Content-Security-Policy "frame-ancestors 'self'" always;
server_tokens off;
```

Express: `helmet()` sets sensible defaults; configure CSP and HSTS explicitly. Next.js: `headers()` in
`next.config.js` or middleware. Django: `SecurityMiddleware` with `SECURE_HSTS_SECONDS`,
`SECURE_CONTENT_TYPE_NOSNIFF`, `SECURE_REFERRER_POLICY`, `SECURE_CROSS_ORIGIN_OPENER_POLICY`, `X_FRAME_OPTIONS`.
Spring Security: `http.headers(...)`. Rails: `config.action_dispatch.default_headers` and `force_ssl`. CDNs
(CloudFront response headers policies, Cloudflare Transform Rules, Fastly VCL) work well for static sites.

Use `always` (nginx) or equivalent so headers are also set on error responses.

## 4. Verify

```bash
curl -sI https://example.com | grep -iE 'strict-transport|content-security|x-content-type|referrer-policy|permissions-policy|x-frame|cross-origin'
curl -sI https://example.com/does-not-exist   # error pages too
curl -sI http://example.com                    # should redirect to https (HSTS is ignored over http)
```

Check several route types: HTML, API, static assets, redirects, 4xx/5xx. Add an automated test or a synthetic check
that asserts required headers so regressions are caught.

## Review checklist

- [ ] HSTS present on HTTPS responses with a long max-age; HTTP redirects to HTTPS.
- [ ] `nosniff` on all responses.
- [ ] Clickjacking defence via `frame-ancestors` (+ `X-Frame-Options`).
- [ ] Referrer policy set; no secrets in URLs regardless.
- [ ] Permissions-Policy disables unused features.
- [ ] Headers present on error pages and on every host/subdomain.
- [ ] No duplicate conflicting headers from app and proxy (browsers may combine or pick the strictest/first).

## Pitfalls

- `includeSubDomains; preload` shipped before checking every subdomain: internal HTTP-only hosts become unreachable.
- Headers set in the app but stripped or overridden by the CDN, or set twice with different values.
- nginx `add_header` inheritance surprise in `location` blocks.
- Treating headers as a fix for XSS or injection; they only reduce impact.
