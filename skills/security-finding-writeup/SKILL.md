---
name: security-finding-writeup
description: Write a security finding the owner can act on - title, severity with rationale, affected locations, impact, evidence, reproduction steps for the owner, and a concrete fix. Use when reporting a vulnerability from code review, a scan triage or an authorized test, in a PR comment, ticket or report.
---

# Security finding write-up

A finding is useful when the owning engineer can understand it, reproduce it in their own environment and fix it in
one sitting. Write for that engineer, not for a security audience. Report only to the system owner or through the
organisation's agreed channel.

## Template

```markdown
### [SEVERITY] <Vulnerability class> in <component>: <one-line consequence>

**Location:** `path/to/file.py:88` (also `path/other.py:40`)
**Reachable by:** <anonymous | any authenticated user | tenant admin | internal service>
**Severity:** <Critical | High | Medium | Low | Informational> - <one-sentence rationale>

**What is wrong**
<2-4 sentences: the flaw in plain language and the root cause.>

**Impact**
<What an attacker can actually do, concretely: read other tenants' invoices, run commands as the app user.>

**Evidence**
<Code excerpt with the vulnerable line, and the source -> sink path as file:line hops.>

**How to reproduce (owner's test environment)**
1. <Minimal steps or a unit/integration test that demonstrates the issue.>
2. <Expected secure behaviour vs observed behaviour.>

**Fix**
<The specific change, as a diff or code snippet. Name the safe API.>

**Verify the fix**
<The test to add, or the check that should now fail/succeed.>

**References:** <CWE-xxx>, <OWASP cheat sheet link>
```

## Title

`[High] SQL injection in report sorting: any user can read all tenants' data` beats `SQLi found`. Pattern:
class + component + consequence.

## Severity

Use the team's scale if one exists (CVSS 4.0, or an internal matrix). Otherwise:

| Severity | Typical meaning |
| --- | --- |
| Critical | Unauthenticated or low-privilege access to all data, code execution, auth bypass, cross-tenant access at scale |
| High | Authenticated user reaches other users' data or admin functions; stored XSS on a widely viewed page; secret leaked with broad scope |
| Medium | Exploitable with significant preconditions (user interaction, specific role, rare config); limited data exposure |
| Low | Defence-in-depth gaps, minor info leaks, missing hardening headers with no concrete exploit |
| Informational | Best-practice notes, no security impact on its own |

Always state the rationale: who can trigger it, what they get, what preconditions apply. Lower severity when a
compensating control demonstrably blocks it, and name the control.

## Evidence rules

- Quote the minimum code needed, with file and line.
- Show the path (source -> transforms -> sink), not just the sink.
- Separate **confirmed** (traced or reproduced) from **suspected** (depends on code or config you could not see).
  Label suspected findings "needs verification" and say what would confirm them.
- Redact secrets and personal data in the write-up itself: show `AKIA****WXYZ`, never the full value.

## Reproduction steps

- Aim them at the owner's local or staging environment, or express them as a failing test. That is the most
  convincing and safest form.
- Keep payloads minimal and benign (e.g. a query that returns a second tenant's row ID, a harmless marker string),
  never destructive.

## Fix guidance

- Give the concrete change in the codebase's language and framework, not "sanitize input".
- Prefer the framework's built-in control (parameterised query, policy check, auto-escaping) over custom filters.
- Mention related locations with the same root cause so they are fixed together.
- If the fix is non-trivial, give a short-term mitigation (feature flag off, WAF rule, revoke key) and the proper fix.
- If a secret was exposed, the fix always includes rotation, not just deleting it from code.

## In a PR review comment

Keep it short and anchored on the line:

```
**[High] Missing ownership check (IDOR)** - `GET /invoices/:id` loads by ID only, so any user can read any
invoice. Scope the query: `Invoice.objects.get(id=id, account=request.user.account)`. Add a test that user B
gets 404 for user A's invoice.
```

## Pitfalls

- Inflating severity: it costs credibility for the next finding. Deflating it to avoid friction is worse.
- Bundling unrelated issues into one finding, or splitting one root cause into ten.
- Reporting scanner output without triage.
- Writing exploit-grade detail beyond what the owner needs to reproduce and fix.
- Posting unfixed critical findings in public channels or public issue trackers; use private advisories.
