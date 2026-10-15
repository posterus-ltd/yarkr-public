---
name: cors-policy-review
description: "Review and fix CORS config: wildcard or reflected origins with credentials, null origin, regex/suffix matching bugs, broad preflight rules and missing Vary, in apps, gateways and CDNs. Use when changing CORS settings, exposing an API to a browser frontend, or triaging a CORS finding."
---

# CORS policy review

CORS relaxes the same-origin policy: it decides which other origins may **read** responses in a browser. It is
never a server-side access control and never protects against non-browser clients. Misconfigured, it lets any
website read your users' authenticated data.

## 1. Know what you need

- Same-origin frontend (served from the API's origin or proxied through it)? You need **no CORS** at all.
- Public, unauthenticated, read-only data? `Access-Control-Allow-Origin: *` without credentials is fine.
- Browser frontend on another origin with cookies or auth headers? Explicit origin allowlist + credentials, nothing broader.

## 2. Red flags (in order of severity)

| Config | Problem |
| --- | --- |
| Reflecting the request `Origin` header back with `Access-Control-Allow-Credentials: true` | any site can read authenticated responses: **critical** |
| Allowing `Origin: null` with credentials | sandboxed iframes and `file:` pages send `null`; attacker-controllable |
| Suffix/prefix/regex matching: `endsWith("example.com")`, `/example\.com/`, `startsWith("https://example.com")` | matches `evil-example.com`, `example.com.attacker.net` |
| Allowing all subdomains with credentials | one XSS or takeover on any subdomain reads everything |
| `http://` origins allowed for an HTTPS app | network attacker can inject into the HTTP origin |
| `*` combined with credentials | browsers reject it, so developers "fix" it by reflecting origin: see first row |
| Missing `Vary: Origin` when the allowed origin varies | caches serve one origin's CORS headers to another |
| `Access-Control-Allow-Headers: *` / `Allow-Methods: *` with credentials, or very long `Max-Age` | broader than needed; harder to tighten later |
| Dev origins (`http://localhost:3000`) allowed in production | any local process or malicious page on localhost can read data |

## 3. Correct implementation

Exact-match against a set, per environment:

```ts
const ALLOWED = new Set(["https://app.example.com", "https://admin.example.com"]);
app.use(cors({
  // true = echo this exact origin; false = no CORS headers. Requests without Origin get none.
  origin: (origin, cb) => cb(null, origin !== undefined && ALLOWED.has(origin)),
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"],
  maxAge: 600,
}));
```

Django (`django-cors-headers`): `CORS_ALLOWED_ORIGINS = ["https://app.example.com"]`, `CORS_ALLOW_CREDENTIALS = True`;
avoid `CORS_ALLOW_ALL_ORIGINS` and loose `CORS_ALLOWED_ORIGIN_REGEXES`. Spring: `allowedOrigins` exact values; avoid
`allowedOriginPatterns("*")` with `allowCredentials(true)`. ASP.NET Core: `WithOrigins(...)`, not
`SetIsOriginAllowed(_ => true)`. FastAPI/Starlette `CORSMiddleware(allow_origins=[...])`; avoid permissive
`allow_origin_regex`.

If you must match subdomains, parse the origin as a URL and compare scheme and the host against an exact list or a
strict `host == "example.com" or host.endswith(".example.com")` check, with `https` required, and only when every
subdomain is trusted.

Always send `Vary: Origin` when the response depends on the origin (most libraries do).

## 4. Where to look

- App middleware config and any hand-written `Access-Control-*` headers (`rg -n -i 'access-control-allow'`).
- API gateway / CDN / ingress annotations (e.g. nginx ingress `enable-cors`, API Gateway CORS settings, CloudFront
  response headers policies). Gateway and app may both add headers, producing duplicates the browser rejects or
  a permissive layer overriding a strict one.
- Serverless function handlers returning headers manually.

## 5. Verify

```bash
# should NOT echo the origin or allow credentials
curl -s -o /dev/null -D - -H 'Origin: https://evil.example' https://api.example.com/me | grep -i '^access-control'
# null origin
curl -s -o /dev/null -D - -H 'Origin: null' https://api.example.com/me | grep -i '^access-control'
# preflight
curl -s -o /dev/null -D - -X OPTIONS -H 'Origin: https://app.example.com' \
  -H 'Access-Control-Request-Method: PUT' -H 'Access-Control-Request-Headers: content-type' https://api.example.com/items/1
```

Run these against your own environments only.

## 6. Related controls

- CORS does not stop CSRF: a cross-site form POST is sent regardless; the browser only hides the response. Keep
  SameSite cookies and CSRF tokens.
- Do not use CORS as authorization. Every endpoint still checks the caller.
- Private Network Access (browser checks for public sites calling private IPs) affects internal APIs; handle its
  preflights explicitly rather than allowing everything.

## Review output

For each issue: the config location, the observed header behaviour (from the curl check or code), why it matters
for this API (does it use cookies/auth?), and the exact replacement config.
