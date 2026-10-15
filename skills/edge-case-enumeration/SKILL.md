---
name: edge-case-enumeration
description: Systematically enumerate edge cases (empty, boundary, max, concurrent, failure, permission, time) for a feature or diff. Use when designing tests, reviewing a change for missed cases, writing acceptance criteria, or asked "what could go wrong with this input/flow?".
---

# Edge case enumeration

Edge cases are found by walking a fixed set of dimensions, not by inspiration. Do the walk for every input,
every state transition and every external call the feature touches, then prune to the cases that are both
plausible and costly.

## Process

1. **List the surface.** Write down: inputs (params, request fields, files, env/config), state read or written
   (DB rows, caches, files, globals), external calls (network, disk, clock, randomness), and actors (who calls it,
   with which permissions).
2. **Walk each dimension below** for each item on the surface. Write cases as one line each:
   `<condition> -> <expected behaviour>`. If you can't state the expected behaviour, that is a spec gap: flag it.
3. **Prune and rank.** Keep a case if it is reachable in production and its failure would corrupt data, leak
   data, crash, or silently produce a wrong answer. Rank: data loss/security > wrong result > crash > bad message.
4. **Map to tests or checks.** Each kept case gets a test, a guard in code, or an explicit "accepted risk" note.

## Dimensions checklist

**Size and emptiness**
- empty: `""`, `[]`, `{}`, zero rows, empty file, missing optional field vs explicit `null`
- one element; exactly at a limit; limit + 1; very large (memory, timeouts, pagination boundaries)
- whitespace-only strings, strings that are only a delimiter

**Numeric boundaries**
- 0, -1, 1, min/max of the type, overflow on `a + b` or `a * b`, `NaN`, `Infinity`, `-0`
- float rounding (money in floats is a bug: `0.1 + 0.2`), integer division, off-by-one on ranges (`<` vs `<=`)
- units: ms vs s, cents vs units, bytes vs characters

**Text and encoding**
- Unicode: combining characters, emoji (surrogate pairs; `"😀".length === 2` in JS), RTL, NUL bytes
- case folding and normalisation (`é` as one or two code points); locale-dependent upper/lower (Turkish `i`)
- injection-shaped input: quotes, `'; --`, `<script>`, `../`, newlines in header values or CSV cells

**Time**
- time zones and DST transitions (a day with 23 or 25 hours), leap day, end of month, year rollover
- clock skew between services, timestamps in the past/future, expiry exactly "now"
- ordering: events arriving out of order or duplicated

**State and lifecycle**
- first run (nothing exists yet), already exists (idempotency, unique constraint), deleted/soft-deleted target
- partially initialised object, stale cache, record changed between read and write
- calling the operation twice; calling it after cancel/close; re-entrancy

**Concurrency**
- two users act on the same record at once (lost update; check-then-act races)
- retries causing duplicate side effects (double charge, double email) — need idempotency keys
- a background job and a request touching the same row; lock ordering and deadlocks

**Failure of dependencies**
- network timeout, connection refused, 5xx, 429, slow response that exceeds the caller's deadline
- partial failure mid-sequence: step 2 of 3 fails — what is left behind? Is there a rollback or compensation?
- disk full, permission denied on file, malformed response from a third party, schema drift

**Permissions and identity**
- anonymous user, user without the role, user from another tenant (IDOR: changing an id in the URL)
- revoked/expired session mid-flow, admin acting on behalf of a user, the resource owner deleted

**Configuration and environment**
- missing or malformed env var/feature flag, flag flipped during a request, different defaults per environment

## Example

Feature: `transfer(fromAccount, toAccount, amountCents)`.

```
amount = 0                      -> reject with validation error (or explicit no-op; decide)
amount < 0                      -> reject; otherwise it reverses the transfer direction
amount > balance                -> reject, no partial debit
from == to                      -> reject or no-op, never double-credit
to account closed               -> reject before debit
two transfers drain same acct   -> one succeeds, one fails (row lock / conditional update)
retry after timeout             -> idempotency key prevents a second transfer
credit step fails after debit   -> transaction rolls back; no money disappears
caller doesn't own fromAccount  -> 403, and no existence leak via different error text
```

## Using it in diff review

- For each changed function, ask which dimensions the change **newly exposes**: a new parameter, a new loop
  bound, a new external call, a new shared state.
- Check the tests in the diff against your list; report missing high-ranked cases with the concrete input,
  e.g. "No test for `items=[]`: `items[0].price` on line 42 throws".
- Look for code tells: `[0]` / `.first()` without an emptiness check, `parseInt` without radix/NaN check,
  `catch` that swallows, `if exists then insert`, `new Date()` inside business logic, string length used as a
  byte limit.

## Pitfalls

- Listing 40 cases with equal weight. Rank and cut; reviewers act on the top five.
- Testing only the boundary value and not boundary +/- 1.
- Forgetting the "nothing happens" case: events that never arrive, jobs that never run, callbacks never called.
- Assuming the database enforces what the code assumes (uniqueness, foreign keys, non-null) without checking the schema.
