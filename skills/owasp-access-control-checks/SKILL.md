---
name: owasp-access-control-checks
description: Check every route and object access for missing authorization, IDOR/BOLA, mass assignment, tenant leaks and privilege escalation, with fixes per framework. Use when reviewing endpoints, resolvers or jobs that load data by ID, adding roles or tenants, or fixing an access control finding.
---

# Access control checks (OWASP A01)

Broken access control is the most common serious web vulnerability. Authentication tells you who the caller is;
these checks make sure every action and every object is something that caller may touch.

## 1. Build the route inventory

List every entry point with its required permission. Unlisted routes are the bugs.

```bash
# examples: adapt to the framework
rg -n -e '@(app|router|bp)\.(get|post|put|patch|delete|route)' -e 'path\(' --type py
rg -n -e 'router\.(get|post|put|patch|delete)' -e '@(Get|Post|Put|Patch|Delete)\(' --type ts
rg -n -e '@(Get|Post|Put|Patch|Delete|Request)Mapping' --type java
rg -n -e 'HandleFunc\(' -e '\.(GET|POST|PUT|PATCH|DELETE)\(' --type go
```

For each: method, path, auth required?, role/permission, object-level check?, tenant scope?

## 2. The four checks

### a. Function level (can this role call this endpoint?)
- Enforced server-side by middleware/decorator/policy, not by hiding UI.
- Default deny: a new route without an explicit policy should fail a test or lint.
- Admin routes are not protected by obscure paths.

### b. Object level - IDOR/BOLA (may this caller touch this object?)
Every lookup by a client-supplied ID must be scoped or checked:

```python
# vulnerable
doc = Document.objects.get(id=doc_id)
# fixed: scope the query
doc = get_object_or_404(Document, id=doc_id, workspace__members=request.user)
```

```ts
// vulnerable
const inv = await prisma.invoice.findUnique({ where: { id } });
// fixed
const inv = await prisma.invoice.findFirst({ where: { id, accountId: session.accountId } });
if (!inv) throw new NotFound();      // 404, not 403, to avoid confirming existence
```

Apply to reads, updates, deletes, nested resources (`/projects/:p/tasks/:t` must check task belongs to project
**and** project to caller), file downloads, and exports.

### c. Field level (may this caller read or write this field?)
- Mass assignment: bind only allowlisted fields (DTOs, `fields = [...]` on serializers, `strong_parameters`,
  `@JsonIgnore`/separate input models). Watch `role`, `is_admin`, `owner_id`, `tenant_id`, `price`, `status`.
- Output: response serializers do not leak `password_hash`, tokens, internal notes, other users' emails.
- GraphQL: field resolvers need their own checks; one authorized parent does not authorize every child.

### d. Tenant isolation
- Tenant ID comes from the authenticated session, never from the request body or a header the client sets.
- Enforce at the data layer: default scopes / repository base class, or Postgres row-level security with
  `current_setting('app.tenant_id')`.
- Caches, search indexes, object storage keys and queues are tenant-scoped too.

## 3. Privilege escalation paths

- Role changes: caller can only grant roles at or below their own; cannot change their own role.
- Invitations and sharing: the invite cannot specify a higher role than the inviter holds.
- Workflow state: approving/refunding requires the right role **and** the right state; check the actor is not the requester when four-eyes is required.
- Admin impersonation is audited and cannot target higher roles.

## 4. Non-HTTP entry points

Background jobs, queue consumers, websocket messages, scheduled tasks and CLI commands that receive a user or object
ID must re-check access, or receive only server-generated, already-authorized IDs.

## 5. Other access control bugs

- Path traversal on file access: resolve path, check it stays under the allowed root.
- CORS misconfig that lets other origins read authenticated responses: see `cors-policy-review`.
- Unauthenticated metadata/debug endpoints (`/actuator`, `/debug/pprof`, `/__debug__`, `/graphql` introspection in prod).
- Predictable or unsigned links to private files: use short-lived signed URLs.
- Method-based bypass: check applies to `GET` but not `HEAD`/`PUT`, or to `/api/x` but not `/api/x/`.

## 6. Test it

Write negative tests: for each object endpoint, user B gets 404/403 on user A's object.

```python
def test_cannot_read_other_accounts_invoice(client, user_a, user_b, invoice_of_a):
    client.force_login(user_b)
    assert client.get(f"/invoices/{invoice_of_a.id}").status_code == 404
```

A matrix test (roles x endpoints -> expected status) catches new routes added without policy.

## Pitfalls

- Using UUIDs as the access control. Unguessable IDs reduce discovery, they do not authorize.
- Checking ownership on load, then performing the update with a second query by bare ID.
- Trusting `tenant_id` from a JWT the client can mint (unsigned, or signed with a shared dev secret).
- Returning 403 vs 404 inconsistently, which lets attackers enumerate objects.
