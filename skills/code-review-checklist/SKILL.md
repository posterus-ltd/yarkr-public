---
name: code-review-checklist
description: Review a diff or pull request in ordered passes (intent, design, correctness, edge cases, tests, security, readability, nits) with a checklist per pass. Use when asked to review code, a PR, a patch or a branch, or to self-review before opening one.
---

# Code review in passes

Reviewing everything at once means you find nits and miss bugs. Read the change several times, each time asking one
kind of question, in order of how expensive a miss is. Stop going deeper on a pass once you have a blocking finding
that invalidates the rest (for example, the change solves the wrong problem).

## 0. Set up

1. Get the full diff against the merge base, not the tip of main:
   `git diff $(git merge-base origin/main HEAD)...HEAD` or `gh pr diff <n>`.
2. Read the PR description, linked issue and commit messages. Write down, in one sentence, what the change is
   supposed to do. If you can't, that is your first finding.
3. List the touched files and sort them: core logic first, then interfaces/schemas/migrations, then tests, then
   config, then generated or vendored files (skim or skip those; say you skipped them).
4. Size check: over ~400 changed lines of hand-written code, review quality drops sharply. Suggest a split along
   seams (refactor first, behaviour second; schema first, code second) rather than skimming.

## Pass 1: Intent and scope

- Does the change do what the description says, and only that? Unrelated refactors, renames or formatting mixed
  into a behaviour change hide bugs; ask for them to be split out.
- Is this the right place for the change, or is it a patch over a symptom whose cause lives elsewhere?
- Is anything missing that the issue asked for (a second call site, a docs update, a migration, a feature flag)?

## Pass 2: Design and interfaces

- Public API, schema, wire format, CLI flags, config keys, event shapes: these are the expensive-to-change parts.
  Review every one of them as if it ships forever.
- Backwards compatibility: can old clients, old data, old config and in-flight messages still work? Is a migration
  reversible, and does it run safely on a large table (no long locks, batched backfill)?
- Does the new code follow the patterns already in the codebase, or introduce a second way to do the same thing?
- Dependencies: is a new library justified, maintained, licence-compatible, and pinned?

## Pass 3: Correctness

Trace the main path with concrete values, line by line. Then check:

- Conditions: inverted checks, `<` vs `<=`, `&&` vs `||`, missing `else`, De Morgan mistakes.
- Null/undefined/None, empty collections, zero, negative numbers, empty strings.
- Error handling: is every error either handled, propagated with context, or deliberately ignored with a reason?
  Are errors swallowed (`catch {}`, `except: pass`, ignored return codes)? Does cleanup run on the error path
  (`finally`, `defer`, `with`, `using`)?
- State: mutation of shared or input data, stale caches, ordering assumptions, idempotency of retried operations.
- Concurrency: shared mutable state without locks, check-then-act races, awaiting in loops vs missing awaits,
  unbounded parallelism, transactions that span network calls.
- Resources: unclosed files/connections, unbounded memory (loading a whole table, growing maps), N+1 queries.
- Time and numbers: time zones, DST, clock skew, integer overflow, float money, rounding, unit mismatches.
- Removed code: what relied on it? `git grep` for callers of anything deleted or renamed.

## Pass 4: Edge cases and failure modes

For each input and dependency ask: what if it is empty, huge, duplicated, malformed, slow, unavailable, or arrives
twice or out of order? What does the user see when it fails? Is the failure visible in logs/metrics?

## Pass 5: Tests

- Do tests exist for the changed behaviour, and would they fail if the change were reverted? (Mentally revert the
  key line; if no test breaks, coverage is missing.)
- Are the edge cases from pass 4 tested, especially error paths?
- Are tests deterministic (no sleeps, real clocks, network, random order dependence)?
- Do assertions check outcomes, not implementation details or mocks of the thing under test?

## Pass 6: Security and data

- Untrusted input reaching SQL, shell, file paths, HTML, templates, deserialisers, regexes or URLs (SSRF).
- AuthN/AuthZ on every new endpoint or action; object-level checks (can user A fetch user B's record by ID?).
- Secrets in code, logs, error messages or test fixtures. PII written to logs or analytics.
- New permissions, CORS changes, disabled CSRF, widened IAM roles.

## Pass 7: Readability and maintainability

- Names say what things are; functions do one thing; no dead code or commented-out blocks.
- Comments explain why, not what. Placeholder comments and debug prints removed or tracked in an issue.
- Duplication that will drift; abstractions with one caller that add indirection for nothing.

## Pass 8: Nits

Formatting, import order, typos, wording. Leave these to linters and formatters where possible. If you must comment,
batch them and label them `nit:` so they never block.

## Decision rules

- Severity: **blocking** = wrong behaviour, data loss, security hole, broken compatibility, missing tests for risky
  logic. **Suggestion** = better design or clarity, author may decline. **Nit** = cosmetic.
- Approve with comments when only suggestions/nits remain. Request changes only for blocking findings.
- If you are unsure whether something is a bug, ask a question rather than asserting; give the input that worries you.
- Verify before claiming: open the surrounding file, check the caller, run the test if you can. A wrong finding
  costs the author time and costs you credibility.
- Praise specific good decisions briefly; it tells the author what to keep doing.

## Output

Lead with a one-line verdict (approve / approve with suggestions / request changes) and the reason. Then findings,
blocking first, each with `file:line`, what is wrong, a concrete failing input or scenario, and a suggested fix. List
anything you did not review (generated files, areas outside your expertise).

## Pitfalls

- Reviewing only the green lines: bugs often live in unchanged code the diff now calls differently.
- Trusting the description instead of the code.
- Bikeshedding style while a migration silently drops a column.
- Re-reviewing from scratch after each push: review the incremental diff (`gh pr diff` against the last reviewed
  commit, or the "changes since last review" view), then re-check anything it touches.
