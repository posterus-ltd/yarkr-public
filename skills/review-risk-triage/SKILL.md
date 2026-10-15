---
name: review-risk-triage
description: Decide how deeply to review a change from its risk (blast radius, reversibility, test coverage, sensitivity) and pick the right reviewers. Use when triaging incoming PRs, scoring PR risk, deciding if a change needs a second reviewer or expert, or setting review depth.
---

# Risk-based review triage

Not every change deserves the same scrutiny. A typo fix and a payment-path migration should not get the same
review. Score the risk first, then spend review effort where a miss is expensive.

## Step 1: Gather facts (don't guess)

```bash
gh pr view <n> --json title,body,files,additions,deletions,labels,author
gh pr diff <n> --name-only
git log --format='%an' --since=6.months -- <path> | sort | uniq -c | sort -rn   # who knows this code
```

Record: files and directories touched, lines changed (excluding generated/lock files), whether tests changed,
whether schema/migrations/config/infra/dependencies changed, and the author's familiarity with the area.

## Step 2: Score five factors (0-3 each)

| Factor | 0 | 1 | 2 | 3 |
| --- | --- | --- | --- | --- |
| **Blast radius** | docs, comments, internal tooling | one feature, few users | shared library, many callers, public API | auth, payments, data pipeline, all users |
| **Reversibility** | revert is instant, no state | revert + redeploy | needs data fix or client update | irreversible: destructive migration, sent emails, external API calls, published package |
| **Test coverage of changed paths** | changed lines covered with meaningful asserts | mostly covered | thin or only happy path | none, or tests changed to pass |
| **Sensitivity** | none | logs/config | PII, permissions, crypto, money, concurrency | secrets, authZ model, security boundary |
| **Complexity/novelty** | mechanical (rename, bump) | familiar pattern | new pattern or tricky logic | new subsystem, concurrency, distributed state |

Add modifiers: +1 if > 400 changed hand-written lines; +1 if the author is new to this code; +1 if it bypasses a
feature flag or ships to all users at once; -1 if behind a default-off flag with a tested kill switch.

## Step 3: Map score to review depth

| Total | Tier | Review |
| --- | --- | --- |
| 0-3 | **Low** | One reviewer, quick pass (intent, obvious bugs). Auto-merge on green CI is acceptable for bot dependency patches with passing tests. |
| 4-7 | **Medium** | One reviewer familiar with the area, full checklist pass (correctness, edge cases, tests). |
| 8-11 | **High** | Two reviewers, one a code owner of the riskiest path. Run the change locally or in a preview env. Require a rollback plan in the PR. |
| 12+ | **Critical** | High tier plus a domain expert (security, DBA, SRE as relevant), staged rollout, and a design note if none exists. Consider splitting. |

Any single factor at 3 sets a floor of **High**, regardless of the total. Security sensitivity at 3 always adds a
security reviewer.

## Step 4: Pick reviewers

1. Required: CODEOWNERS for the touched paths (the platform will request them).
2. Expertise: someone with recent commits in the riskiest file (from the git log above), not just the owner team.
3. Specialists by trigger:
   - migrations, query changes on large tables → database owner
   - authN/authZ, crypto, input parsing, new endpoints → security
   - infra, deploy, scaling, timeouts, retries → SRE/platform
   - public API or SDK changes → API owner, consider docs
4. Spread load: prefer a reviewer with fewer open review requests; avoid the same single expert on every PR.
5. For Low tier, one reviewer is enough; don't add reviewers "for visibility". Use a mention instead.

## Step 5: Tell the reviewers where to look

A risk triage is only useful if it focuses attention. Name the hot spots:

```
Risk: High (blast 3, reversibility 2, coverage 2, sensitivity 2, novelty 1 = 10)
Why: changes the refund calculation used by all checkout flows; migration adds a NOT NULL column.
Focus: billing/refund.ts:40-120 (rounding), migrations/0042 (backfill on 30M rows, lock duration).
Reviewers: @billing-team (owner), @alice (last 12 commits in refund.ts), @dba-oncall (migration).
Before merge: rollback plan for the migration; test for partial refunds.
```

## Signals that raise risk quickly

- Tests deleted, skipped, or assertions loosened in the same PR as logic changes.
- `catch`/`except` blocks added that swallow errors; retries added without idempotency.
- Changes to timeouts, limits, pool sizes, cache TTLs, feature flag defaults.
- Lock files changed with no stated dependency change.
- Large generated diffs that hide small hand-written edits.
- Commit messages like "fix", "wip", "address comments" on a big change: ask for a description.

## Pitfalls

- Using line count as the only proxy: a one-line change to an auth check can be Critical.
- Letting the author self-score without checking; score from the diff.
- Treating "has tests" as coverage: check the tests exercise the changed lines and the failure paths.
- Escalating everything to High: reviewers learn to ignore the label. Keep most PRs Low or Medium.
