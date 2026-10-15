---
name: secure-review-checklist
description: Risk-ordered secure code review checklist (authn, authz, input, output, crypto, secrets, logging) for any language. Use when reviewing a pull request or diff for security, auditing a module before release, or deciding what to look at first in unfamiliar code.
---

# Secure code review checklist

Review in risk order. Most real-world breaches come from the first three sections, so spend your time there and
do not stop at the first finding. The goal is exploitable bugs with evidence, not style.

## 0. Scope the change first (2 minutes)

1. List the files in the diff and classify each: entry point (route, handler, CLI, queue consumer), business logic,
   data access, config/infra, test, dependency manifest.
2. Identify **trust boundaries the diff touches**: HTTP/RPC input, files uploaded or read by path, messages from
   queues, webhooks, environment, other services, the database (stored data is untrusted if users wrote it).
3. Note **who can reach it**: anonymous, any logged-in user, admin, internal-only. "Internal" endpoints exposed via a
   gateway or SSRF are reachable; verify, don't assume.
4. Read the surrounding code, not only the hunk. Missing checks are invisible in a diff.

```bash
git diff --stat origin/main...HEAD
git diff origin/main...HEAD -- '*.py' '*.ts' '*.go' '*.java' | less
# new routes / handlers
git diff origin/main...HEAD | grep -E '^\+.*(@app\.(get|post|route)|router\.|@(Get|Post|Request)Mapping|HandleFunc|app\.(get|post))'
```

## 1. Authentication

- [ ] Every new entry point is behind the auth middleware, or is deliberately public and says so.
- [ ] Middleware ordering: auth runs before the handler and before any body parsing that has side effects.
- [ ] Tokens are verified (signature, `exp`, `aud`, `iss`, algorithm pinned), not just decoded.
- [ ] Password, reset, MFA and magic-link flows: see the `auth-logic-review` skill.
- [ ] No auth decision based on client-controllable headers (`X-Forwarded-For`, `X-User-Id`, `Referer`) unless set by a trusted proxy that strips client values.

## 2. Authorization (most frequent critical bug)

- [ ] Every object fetched by ID is scoped to the caller: `WHERE id = ? AND tenant_id = ?`, or an explicit policy check after load.
- [ ] Role checks happen server-side on every request, not only in the UI or on the list endpoint.
- [ ] Bulk / batch / export / GraphQL resolvers apply the same checks as the single-object path.
- [ ] Mass assignment: request bodies cannot set `role`, `owner_id`, `is_admin`, `tenant_id`, `price`.
- [ ] State transitions (approve, refund, publish) check the actor may perform that transition in the current state.

## 3. Input handling and injection sinks

Trace each new input to where it is used. Flag any of these reached with unvalidated data:

| Sink | Safe form |
| --- | --- |
| SQL / NoSQL query strings | parameterised queries, ORM filters; allowlist for identifiers (sort column, table) |
| Shell / process exec | argv arrays, no shell; never `shell=True` with input |
| File paths | resolve then check prefix against an allowed root; reject `..` and absolute paths |
| Outbound URLs (SSRF) | allowlist hosts; block link-local/metadata IPs after DNS resolution; no redirects to new hosts |
| Template rendering | auto-escaping on; never build templates from user strings |
| Deserialization | JSON with schema; never pickle/Java native/unsafe YAML on untrusted data |
| Regex | bounded patterns; no user-supplied regex without timeout (ReDoS) |
| XML parsers | external entities and DTDs disabled |

Use the `taint-flow-tracing` skill when the flow crosses more than one function.

## 4. Output encoding

- [ ] HTML output uses the framework's auto-escaping; look for `dangerouslySetInnerHTML`, `v-html`, `|safe`, `mark_safe`, `html/template` bypasses, `innerHTML =`.
- [ ] URLs placed in `href`/`src` are scheme-checked (`javascript:` blocked).
- [ ] JSON embedded in HTML is escaped for `</script>`.
- [ ] HTTP response headers built from input strip CR/LF.
- [ ] Error responses do not echo stack traces, SQL or internal hostnames.

## 5. Cryptography

- [ ] No homemade crypto, ECB, static IVs/nonces, MD5/SHA-1 for security, `Math.random()` for tokens.
- [ ] Passwords hashed with argon2id, scrypt or bcrypt; never plain SHA-256.
- [ ] TLS verification never disabled (`verify=False`, `InsecureSkipVerify`, `rejectUnauthorized: false`).
- [ ] Secret comparison is constant-time.
See `crypto-misuse-detection` for the full list.

## 6. Secrets

- [ ] No keys, tokens, passwords or private keys in code, tests, fixtures, config or Dockerfiles.
- [ ] Secrets are read at runtime from env or a secrets manager and never logged.
- [ ] A secret that appears in the diff is treated as leaked: rotate it, even if the PR is not merged.

## 7. Logging, errors and monitoring

- [ ] Security events (login fail/success, permission denied, password change, key creation) are logged with actor and target.
- [ ] Logs exclude passwords, tokens, session IDs, full card numbers, and raw request bodies of auth endpoints.
- [ ] Log lines built from input are structured (no log injection via newlines).
- [ ] Exceptions fail closed: an error in an auth/authz check denies access.

## 8. Dependencies and config

- [ ] New dependencies: maintained, widely used, pinned in a lockfile; check for known advisories (`npm audit`, `pip-audit`, `govulncheck`, `osv-scanner`).
- [ ] Debug modes, permissive CORS, admin consoles and default credentials are off in production config.
- [ ] Infra changes: no public buckets, `0.0.0.0/0` ingress on admin ports, or wildcard IAM actions.

## Decision rules

- **Report** only what you can tie to a reachable path. Write "needs verification" for anything that depends on
  code you could not see.
- **Severity** = impact x reachability. Unauthenticated + data access across tenants = critical. Requires admin = usually low.
- **One finding per root cause**, listing every affected location.
- Prefer the framework's built-in protection as the fix over custom validation.

## Common misses

- Checks present on `GET /items/:id` but missing on `PUT`/`DELETE` of the same resource.
- New field added to a serializer that exposes a sensitive column (`password_hash`, `api_key`).
- Feature flags that disable a check "temporarily".
- Background jobs that act on IDs from a message without re-checking ownership.
- Test-only bypasses (`if env == "test": skip_auth`) reachable in production.

Write findings with the `security-finding-writeup` skill.
