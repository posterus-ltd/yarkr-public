---
name: owasp-injection-prevention
description: Find and fix SQL, NoSQL, OS command, LDAP, template and header injection using parameterised queries, safe APIs, argv execution and allowlisted inputs. Use when code builds queries or commands from strings, when reviewing data-access or shell-out code, or when fixing an injection finding.
---

# Injection prevention (OWASP Top 10: Injection)

Injection happens when data is concatenated into a string that another interpreter parses. The fix is always to
keep data and code separate with an API that does it for you, then allowlist what cannot be parameterised.

## 1. SQL

Parameterise values. Every mainstream driver supports it:

```python
cur.execute("SELECT * FROM users WHERE email = %s", (email,))          # psycopg
session.execute(text("SELECT * FROM t WHERE id = :id"), {"id": id})    # SQLAlchemy
```
```js
await pool.query("SELECT * FROM users WHERE email = $1", [email]);      // node-postgres
await prisma.$queryRaw`SELECT * FROM users WHERE email = ${email}`;     // tagged template = parameterised
```
```go
db.QueryContext(ctx, "SELECT * FROM users WHERE email = $1", email)
```
```java
PreparedStatement ps = conn.prepareStatement("SELECT * FROM users WHERE email = ?"); ps.setString(1, email);
```

Danger signs: f-strings/`+`/`format`/`Sprintf` building SQL; `$queryRawUnsafe`, `.raw()`, `.extra()`, `whereRaw`,
`literal()`, `sequelize.query` with interpolation; `IN (...)` built by joining strings.

**Identifiers cannot be parameters** (table, column, sort direction). Map from an allowlist:

```python
SORT = {"created": "created_at", "name": "name"}
col = SORT.get(request.args.get("sort"), "created_at")
direction = "DESC" if request.args.get("dir") == "desc" else "ASC"
```

`LIKE` patterns: parameterise and escape `%`/`_` if the user should not use wildcards.

## 2. NoSQL

- MongoDB operator injection: a JSON body `{"password": {"$ne": null}}` turns equality into a predicate. Validate
  types (`typeof x === "string"`), use schema validation (zod/joi/pydantic), or `mongo-sanitize`/`sanitizeFilter`
  (Mongoose `sanitizeFilter: true`).
- Never pass user input to `$where`, `$function`, `mapReduce` or `$expr` with JavaScript.

## 3. OS commands

Best: do not shell out; use a library. Otherwise execute an argv array without a shell:

```python
subprocess.run(["convert", src, "-resize", "200x200", dst], check=True)   # no shell=True
```
```js
execFile("git", ["log", "--format=%H", "--", path]);                      // not exec(`git log ${path}`)
```
```go
exec.CommandContext(ctx, "git", "log", "--", path)
```

- Argument injection still applies: a value starting with `-` becomes an option. Put `--` before positional args
  and/or reject leading `-`.
- Allowlist values where possible (formats, sizes, known commands).
- Blocklists of metacharacters are not a fix.

## 4. LDAP, XPath, headers, logs

- LDAP: escape filter values per RFC 4515 with the library's function (`ldap3.utils.conv.escape_filter_chars`,
  Spring `LdapEncoder.filterEncode`); DN values with DN escaping.
- XPath: parameterised XPath (`XPathVariableResolver`) or avoid building expressions from input.
- HTTP headers / redirects: reject CR/LF; validate redirect targets against an allowlist of paths/hosts.
- Logs: structured logging; encode newlines in user-supplied fields.

## 5. Templates (SSTI) and expression languages

- Never compile templates from user strings (`render_template_string(user)`, `new Function`, `eval`, Velocity/
  Freemarker/Thymeleaf/SpEL/OGNL evaluated on input). Pass user data as template variables only.
- If users must author templates, use a logic-less or sandboxed engine (Liquid, Handlebars without helpers, Jinja2
  `SandboxedEnvironment`) and still treat it as high risk.

## 6. Validate input as a second layer

- Validate type, length, format and range at the boundary with a schema; reject, do not "clean".
- Allowlist over blocklist. Canonicalise (decode, normalise Unicode) before validating.
- Validation reduces attack surface but is not a substitute for parameterisation.

## 7. Detect

```bash
semgrep scan --config p/sql-injection --config p/command-injection .
rg -n -e 'execute\(\s*f"' -e '\.format\(.*(SELECT|INSERT|UPDATE|DELETE)' -e 'shell\s*=\s*True' -e 'exec\(`' -e 'QueryRawUnsafe|queryRawUnsafe'
```

Confirm each hit with `taint-flow-tracing` before reporting.

## Fix checklist

- [ ] Every value bound as a parameter; no string-built queries with input.
- [ ] Identifiers from allowlists only.
- [ ] Subprocesses as argv, no shell, `--` before user-supplied positional args.
- [ ] Request bodies schema-validated so objects cannot appear where strings are expected.
- [ ] No template/eval of user strings.
- [ ] DB account used by the app has least privilege (no DDL, no superuser) to limit blast radius.
- [ ] A regression test sends a quote/operator payload and asserts it is treated as data.

## Pitfalls

- ORMs are safe until someone uses the raw escape hatch.
- Escaping by hand (`replace("'", "''")`) misses encodings and multi-byte edge cases.
- Stored values are input too: second-order injection when stored data is later concatenated into a query.
