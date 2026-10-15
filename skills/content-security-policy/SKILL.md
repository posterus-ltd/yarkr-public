---
name: content-security-policy
description: Design, deploy in report-only mode, and tighten a Content Security Policy using nonces or hashes with strict-dynamic, plus violation reporting. Use when adding CSP to a web app, removing unsafe-inline or unsafe-eval, debugging CSP violations, or reviewing an existing policy for bypasses.
---

# Content Security Policy

A good CSP stops most injected scripts from running even when an XSS bug exists. Allowlists of hosts are weak
(CDNs host attacker-usable scripts); a **strict CSP** based on nonces or hashes is the modern approach.

## 1. Target policy (strict CSP)

```
Content-Security-Policy:
  script-src 'nonce-{RANDOM}' 'strict-dynamic' https: 'unsafe-inline';
  object-src 'none';
  base-uri 'none';
  frame-ancestors 'self';
  form-action 'self';
  report-to csp-endpoint
```

- `'nonce-…'` + `'strict-dynamic'`: only scripts carrying the per-response nonce run; scripts they load are trusted
  transitively.
- `https:` and `'unsafe-inline'` are **ignored** by browsers that support nonces/strict-dynamic; they are fallbacks
  for very old browsers only.
- `object-src 'none'` and `base-uri 'none'` close classic bypasses.
- Add `require-trusted-types-for 'script'` later to lock down DOM XSS sinks where supported.

## 2. Nonces vs hashes

| Use | When |
| --- | --- |
| Nonce | server-rendered pages; generate a fresh, unguessable value (>= 128 bits, base64) **per response** and add it to every `<script nonce="...">` |
| Hash (`'sha256-…'`) | static pages / SPAs served from a CDN where you cannot inject per-response values; hash each inline script |

Never reuse a nonce across responses or cache an HTML page containing a nonce for multiple users.

Framework support: Next.js (nonce via middleware, read in layout), Django (`django-csp` with nonce), Rails
(`content_security_policy_nonce_generator`), Express (`helmet` CSP + per-request nonce in `res.locals`), Spring
Security CSP header writer plus a nonce filter.

## 3. Refactor what the policy will block

- Inline event handlers (`onclick="..."`) and `javascript:` URLs: move to `addEventListener` in nonced scripts.
- `eval`, `new Function`, `setTimeout("string")`: remove; some older libraries need replacement. Avoid
  `'unsafe-eval'`; if a dependency truly needs WebAssembly compilation, use `'wasm-unsafe-eval'` instead.
- Inline `<style>` / `style=""`: styles are lower risk; `style-src 'self' 'unsafe-inline'` is a common compromise.
  Nonce styles if you need it tight.
- Third-party tags (analytics, chat widgets): load them from a nonced loader script; strict-dynamic lets them load
  their dependencies.

## 4. Roll out safely

1. Ship `Content-Security-Policy-Report-Only` with the target policy and a reporting endpoint.
2. Collect violations for 1-2 weeks across browsers and key flows. Group by `blocked-uri` / `effective-directive`.
3. Fix code (preferred) or adjust the policy; ignore extension noise (`chrome-extension:`, `moz-extension:`).
4. Switch to enforcing `Content-Security-Policy`; keep a Report-Only header alongside to trial the next tightening.

Reporting:

```
Reporting-Endpoints: csp-endpoint="https://example.com/csp-reports"
Content-Security-Policy: ...; report-to csp-endpoint; report-uri https://example.com/csp-reports
```

`report-uri` is deprecated but still the most widely supported; send both. The endpoint must accept
`application/csp-report` and `application/reports+json`, rate-limit, and not log full URLs with tokens.

## 5. Review an existing policy for weaknesses

Flag:
- `'unsafe-inline'` in `script-src` **without** a nonce/hash (inline scripts run, CSP gives little XSS protection).
- `'unsafe-eval'`.
- Wildcards or broad hosts in `script-src`: `*`, `https:`, `*.googleapis.com`, `cdn.jsdelivr.net`, `*.cloudfront.net`
  (attacker-uploadable content or JSONP/gadget libraries).
- Missing `object-src 'none'` or `base-uri`.
- No `script-src` and a permissive `default-src`: unlisted fetch directives fall back to `default-src`, so it must be strict too.
- Missing `frame-ancestors` (clickjacking) and `form-action`.
- Policy set via `<meta>` only: `frame-ancestors`, `report-uri` and sandbox do not work in meta.
- Static nonce, or nonce derived from something predictable.

Google's CSP Evaluator (csp-evaluator.withgoogle.com) is a quick second opinion.

## 6. Verify

```bash
curl -sI https://example.com | grep -i content-security-policy
```

In the browser console, violations appear as errors naming the directive. Add an end-to-end test that loads key
pages and fails on CSP console errors.

## Pitfalls

- Allowlist-based CSPs that look strict but include a CDN hosting Angular/JSONP endpoints, which allows bypass.
- Nonce present on the header but missing on some script tags after a template change: pages break silently in
  production. Test with enforcement in staging.
- HTML caching layers serving the same nonce to many users.
- Treating CSP as the XSS fix; output encoding remains the primary control.
