---
name: cookie-security-attributes
description: Set Secure, HttpOnly, SameSite, Domain, Path and the __Host-/__Secure- prefixes correctly for session, auth and CSRF cookies, including cross-site and partitioned cases. Use when setting or reviewing cookies, fixing cookie findings, or debugging dropped cookies.
---

# Cookie security attributes

## 1. Defaults by cookie type

| Cookie | Attributes |
| --- | --- |
| Session / auth (same-site app) | `__Host-` name, `Secure; HttpOnly; SameSite=Lax; Path=/`, no `Domain` |
| High-value admin session | as above with `SameSite=Strict` |
| CSRF token (double-submit) | `__Host-` name, `Secure; SameSite=Strict; Path=/`; not HttpOnly only if JS must read it |
| Refresh token | `__Host-` or `__Secure-`, `Secure; HttpOnly; SameSite=Strict`, narrow `Path` (e.g. `/auth/refresh`) |
| Cross-site embed / third-party context | `Secure; SameSite=None` (+ `Partitioned` if it only needs per-top-site state) |
| Preferences, non-sensitive | `Secure; SameSite=Lax`; can be readable by JS |

Example:

```
Set-Cookie: __Host-sid=8f3c...; Path=/; Secure; HttpOnly; SameSite=Lax; Max-Age=28800
```

## 2. Attribute rules

- **Secure:** always, on every environment that uses HTTPS (local dev on `localhost` is treated as secure by modern
  browsers).
- **HttpOnly:** on anything that authenticates. JS should never need the session token.
- **SameSite:**
  - `Lax` (browser default when unset in Chromium-based browsers, but set it explicitly): sent on top-level GET
    navigations, not on cross-site POSTs or subresource requests. Good default for sessions.
  - `Strict`: never sent cross-site, even on link clicks; users arriving from email links appear logged out on the
    first request.
  - `None`: requires `Secure`; use only for genuinely cross-site flows (embedded widgets, some SSO POST bindings).
    Third-party cookies are restricted or blocked in several browsers, so do not design new flows around them.
- **Domain:** omit it. Setting `Domain=example.com` shares the cookie with every subdomain, including ones that
  might be compromised or user-controlled.
- **Path:** not a security boundary between apps on the same origin; use it to reduce where a cookie is sent.
- **Max-Age / Expires:** session cookies (no expiry) for auth when possible; server-side timeouts still required
  (`session-management-hardening`).
- **Prefixes:**
  - `__Host-` forces `Secure`, `Path=/` and no `Domain`: the cookie cannot be set or overwritten by a subdomain.
    Best choice for session and CSRF cookies.
  - `__Secure-` forces `Secure` only.
- **Partitioned (CHIPS):** for third-party embeds that need state per embedding site; requires `Secure`.

## 3. Framework settings

| Framework | Settings |
| --- | --- |
| Django | `SESSION_COOKIE_SECURE`, `SESSION_COOKIE_HTTPONLY`, `SESSION_COOKIE_SAMESITE`, `SESSION_COOKIE_NAME="__Host-sessionid"`, `CSRF_COOKIE_SECURE` |
| Express (`express-session`) | `cookie: { secure: true, httpOnly: true, sameSite: "lax" }`, `name: "__Host-sid"`, `app.set("trust proxy", 1)` behind TLS terminators |
| Spring Boot | `server.servlet.session.cookie.secure/http-only/same-site` |
| ASP.NET Core | `CookieOptions { Secure = true, HttpOnly = true, SameSite = SameSiteMode.Lax }`, `CookieSecurePolicy.Always` |
| Rails | `config.session_store :cookie_store, key: "__Host-session", secure: true, same_site: :lax` |
| Go `net/http` | `http.Cookie{Secure: true, HttpOnly: true, SameSite: http.SameSiteLaxMode, Path: "/"}` |

Behind a TLS-terminating proxy, the app must trust `X-Forwarded-Proto` from that proxy only, or `Secure` cookies may
not be set at all.

## 4. Verify

```bash
curl -sI -X POST https://example.com/login -d 'user=test&pass=test' | grep -i set-cookie
```

In browser devtools (Application -> Cookies) check each flag and look for warnings about rejected cookies.

## 5. Review checklist

- [ ] Every auth/session cookie: `Secure`, `HttpOnly`, explicit `SameSite`.
- [ ] `__Host-` prefix used for session and CSRF cookies where the app is single-origin.
- [ ] No `Domain` attribute unless subdomain sharing is required and every subdomain is trusted.
- [ ] `SameSite=None` only where a cross-site flow is documented.
- [ ] Logout clears cookies with matching name, path and domain.
- [ ] No sensitive data in cookie values beyond an opaque ID (or encrypted + authenticated if state must be client-side).
- [ ] CSRF protection still present for state-changing requests; SameSite is defence in depth, not a replacement.

## Pitfalls

- `SameSite=None` without `Secure`: the browser rejects the cookie entirely.
- Changing a cookie's name to add `__Host-` without migrating: users get logged out once; plan it.
- `SameSite=Lax` does not protect state-changing GET endpoints. Do not change state on GET.
- Cookies on a parent domain set by a vulnerable sibling subdomain can shadow yours (cookie tossing); `__Host-` stops this.
