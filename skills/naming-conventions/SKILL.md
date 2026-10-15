---
name: naming-conventions
description: Choose and review names for variables, functions, types, files and APIs so they reveal intent, match the domain and stay consistent. Use when naming new code, renaming during a refactor, or reviewing a diff for unclear, misleading or inconsistent names.
---

# Naming conventions

A name is a promise about what something is or does. Bad names cost more than bad comments because they are read
at every call site. Judge a name at the **call site**, not the definition.

## Rules by kind

| Kind | Shape | Good | Bad |
| --- | --- | --- | --- |
| Boolean | predicate: `is/has/can/should` + adjective/noun | `isExpired`, `hasAccess` | `flag`, `status`, `check` |
| Function with side effect | imperative verb + object | `sendInvoice`, `deleteUser` | `invoice`, `userHandler` |
| Pure query | noun or `get/compute/find` | `totalPrice`, `findActiveUsers` | `doPrice`, `process` |
| Collection | plural noun | `orders`, `userIdsByEmail` | `orderList2`, `data` |
| Map/dict | `valueByKey` | `priceBySku` | `skuMap`, `lookup` |
| Type/class | singular noun from the domain | `Invoice`, `RetryPolicy` | `InvoiceManager`, `Helper`, `Utils` |
| Constant | the meaning, not the value | `MAX_UPLOAD_BYTES` | `TEN_MB`, `NUMBER_5` |
| Units | include unit when ambiguous | `timeoutMs`, `priceCents` | `timeout`, `price` |

## Decision rules

1. **Use the domain's words.** If the business says "policyholder", don't write `customer` in one module and
   `client` in another. Keep a glossary in the repo for core terms; reuse what the codebase already says
   (`grep` for the concept before inventing a word).
2. **Length tracks scope.** Loop index in a 3-line loop: `i` is fine. Module-level or exported: full words.
3. **Name the why, not the how.** `retryableErrors` beats `errorsInSet`; `activeUsers` beats `filteredUsers`.
4. **No lies.** A function named `getUser` must not create a user. `validateX` that also mutates X is a lie.
   A list named `users` must not hold ids.
5. **No noise words**: `data`, `info`, `object`, `manager`, `handler`, `util`, `temp`, `my`, `the`. If removing
   the word loses nothing, remove it. If it leaves nothing, the concept isn't understood yet.
6. **One word per concept, one concept per word.** Don't mix `fetch`/`get`/`retrieve`/`load` for the same
   operation. Don't use `get` for both a cheap field read and a network call; prefer `fetch`/`load` for I/O.
7. **Avoid negatives in booleans.** `isEnabled` not `isNotDisabled`; `if (!isNotValid)` is a bug magnet.
8. **Distinguish similar things by meaning, not suffixes.** `user`, `user2`, `userObj` → `author`, `reviewer`.
9. **Follow the language's casing convention**, never mix within a codebase:
   - Python: `snake_case` functions/vars, `PascalCase` classes, `UPPER_SNAKE` constants, `_leading` for private.
   - JS/TS: `camelCase` vars/functions, `PascalCase` types/classes/components, `UPPER_SNAKE` true constants.
   - Go: `MixedCaps`; exported = capitalised; short receiver names; acronyms consistent case (`userID`, `HTTPServer`).
   - Java/Kotlin/C#: `camelCase` members, `PascalCase` types (C# also `PascalCase` methods).
   - Files: follow repo convention (kebab-case in most JS repos, snake_case in Python).

## Examples

```ts
// before
function proc(d: any[], f: boolean) {
  const res = d.filter(x => x.s === 1 && (!f || x.t > Date.now()));
  return res.length;
}
// after
function countActiveSubscriptions(subscriptions: Subscription[], excludeExpired: boolean): number {
  return subscriptions.filter(s =>
    s.status === Status.Active && (!excludeExpired || s.expiresAt > Date.now())
  ).length;
}
```

```python
# before
def check(u, r):         # returns bool? raises? both?
    ...
# after
def user_has_role(user: User, role: Role) -> bool: ...
def require_role(user: User, role: Role) -> None:   # raises PermissionDenied
    ...
```

## Reviewing names in a diff

Report a name when it:
- misleads (name says one thing, code does another) — **blocking-worthy**, it causes bugs;
- conflicts with an existing term for the same concept in the codebase — suggestion, cite the existing name;
- hides units or is a bare noise word on an exported API — suggestion;
- is merely not your preference — skip it, or mark as nit at most.

Always propose the replacement name and say why in one clause: "`timeout` → `timeoutMs`: callers pass seconds
elsewhere (`retry.ts:12`)".

## Pitfalls

- Renaming public APIs, DB columns, config keys or event names without a migration/deprecation path.
- Encoding type in the name (`strName`, `arrItems`) — the type system already says it.
- Abbreviations only the author knows (`cxl`, `prcs`). Widely known ones (`id`, `url`, `http`) are fine.
- Renaming in a feature PR: big rename diffs bury the real change. Do renames in a separate commit or PR.
