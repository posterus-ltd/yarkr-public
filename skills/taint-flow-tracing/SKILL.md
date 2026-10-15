---
name: taint-flow-tracing
description: Trace untrusted input from sources to dangerous sinks through a codebase to confirm or rule out an exploitable flow. Use when a review flags a possible injection, SSRF, path traversal or XSS, or when you must prove whether user data can reach a query, shell, file or template.
---

# Taint flow tracing

A suspected injection is only a finding once you show a path: **source -> (transforms) -> sink**, with no effective
sanitizer in between, reachable by an attacker. This skill is how you build or refute that path manually, with
grep and reading, and optionally with a static analyzer to confirm.

## 1. Pick the direction

- **Sink-first (preferred for review):** start from each dangerous call in scope and walk callers backwards. Fewer
  sinks than sources, so it converges faster.
- **Source-first:** start from a new endpoint's parameters and follow them forward. Use when reviewing a new entry
  point.

## 2. Enumerate sinks

Grep for the sinks relevant to the language. Starting points:

```bash
# SQL built from strings
rg -n --type-add 'src:*.{py,js,ts,go,java,rb,php,cs}' -t src \
  -e 'execute\(\s*f?["'\'']' -e '\.raw\(' -e 'query\(\s*`' -e 'Sprintf\(\s*"(SELECT|INSERT|UPDATE|DELETE)' -e 'createQuery\(.*\+'
# OS commands
rg -n -e 'subprocess\.(run|call|Popen|check_output).*shell\s*=\s*True' -e 'os\.system\(' -e 'child_process' -e 'exec\.Command\(' -e 'Runtime\.getRuntime\(\)\.exec'
# Files, URLs, templates, deserialization
rg -n -e 'open\(' -e 'sendFile\(' -e 'path\.join\(' -e 'requests\.(get|post)\(' -e 'fetch\(' -e 'http\.Get\(' \
      -e 'render_template_string' -e 'Template\(' -e 'pickle\.loads' -e 'yaml\.load\(' -e 'ObjectInputStream'
```

## 3. Enumerate sources

Anything an attacker controls, directly or via storage:

- Request: path params, query, body, headers, cookies, uploaded file names and content.
- Indirect: database rows other users wrote, message queue payloads, webhook bodies, files in shared buckets,
  third-party API responses, environment of a CI job triggered by a fork.
- Framework helpers: `request.args`, `req.query`, `req.body`, `r.URL.Query()`, `@RequestParam`, `params[:x]`.

## 4. Walk the path

For each sink:

1. Identify which argument is dangerous (the query string, not the bound parameters).
2. Find where that value is assigned. Follow assignments, function parameters, return values, object fields.
3. At each function boundary, find all callers (`rg -n 'functionName\('`, or the IDE's call hierarchy).
4. Stop when you reach a source (tainted) or a constant / server-controlled value (not tainted).
5. Record the chain as `file:line` hops. Keep it; it becomes the evidence.

Watch for taint carriers that break naive grep:
- values stored in a struct/dict and read elsewhere,
- ORM model fields populated from request bodies,
- values written to DB or cache and read back in another request (second-order),
- string formatting helpers and query builders that concatenate internally,
- decorators/middleware that copy headers into a context object.

## 5. Judge sanitizers honestly

A sanitizer only counts if it matches the sink:

| Sink | Effective | Not effective |
| --- | --- | --- |
| SQL value | bound parameter | escaping quotes by hand, `str.replace("'", "")` |
| SQL identifier | allowlist of known names | quoting with backticks alone |
| Shell | argv array with no shell; allowlisted values | `shlex.quote` on one arg then string concat elsewhere, blocklists of `;|&` |
| Path | `realpath` then prefix check against root | stripping `../` once |
| HTML | context-aware auto-escape | escaping for HTML then inserting into JS or URL |
| URL fetch | host allowlist checked after resolution | regex on the URL string; blocking `localhost` text only |

Type coercion counts: `int(x)` before use in SQL makes that value safe. Validation that only runs on one code path
(e.g. the web form, not the API) does not.

## 6. Confirm reachability

- Is the entry point routed and reachable in production config?
- Which role is needed? Note it; it drives severity.
- Do earlier checks (schema validation, type checks) constrain the value enough to make it unexploitable?

## 7. Optional: confirm with a static analyzer

Use these as a second opinion, never as the only evidence:

```bash
semgrep scan --config p/owasp-top-ten --config p/secrets path/to/changed/files
codeql database create db --language=python && codeql database analyze db codeql/python-queries --format=sarif-latest -o out.sarif
```

Triage every hit through steps 4-6; analyzers miss custom sanitizers and flag dead code.

## Output for each traced flow

```
Sink:     app/reports.py:88  cursor.execute(f"... ORDER BY {sort}")
Source:   GET /reports?sort=  (app/routes.py:31, any logged-in user)
Path:     routes.py:31 -> services/report.py:52 build_report(sort) -> reports.py:88
Sanitizer: none (sort is passed through unchanged)
Verdict:  exploitable | not exploitable (reason) | needs verification (what is unknown)
Fix:      allowlist sort in {"created_at","name"}; map to column constants
```

## Pitfalls

- Declaring "safe" because the value passes through an ORM: raw fragments (`.extra()`, `.raw()`, `text()`, `whereRaw`) are still sinks.
- Stopping at the first sanitizer without checking it fits the sink context.
- Ignoring second-order flows through the database.
- Reporting a flow without the hop list; reviewers cannot verify it.
- Do not run payloads against systems you are not authorized to test; reason from code or use a local test instance.
