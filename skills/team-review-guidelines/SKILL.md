---
name: team-review-guidelines
description: Write or revise a team's code review policy covering PR size, turnaround targets, approval and ownership rules, comment etiquette, disagreement resolution and emergency merges. Use when drafting a CONTRIBUTING or review policy doc, or fixing slow or contentious reviews.
---

# Writing a team code review policy

A review policy turns unspoken expectations into rules everyone can point to. Keep it short (one page people
actually read), specific (numbers, not "promptly"), and enforced by tooling where possible.

## Step 1: Diagnose before writing

Ask or measure what is actually wrong. Useful data:

```bash
# median time from PR open to first review and to merge, last 90 days (GitHub)
gh pr list --state merged --limit 200 --json createdAt,mergedAt,reviews,additions,deletions > prs.json
```

Look at: time to first review, number of review rounds, PR size distribution, who reviews (is it always the same
two people?), PRs merged without review, and recurring arguments in comment threads. The policy should fix the
problems you find, not every problem imaginable.

## Step 2: Cover these sections

Use this skeleton; fill each with team-specific numbers and names.

```markdown
# Code review policy

## Why we review
One or two sentences: catch defects, share knowledge, keep the codebase consistent. Not gatekeeping.

## Authors
- Keep PRs under ~400 changed lines of hand-written code; split refactors from behaviour changes.
- Write a description: what, why, how tested, risk, rollout/rollback. Use the PR template.
- Self-review the diff before requesting review. CI must be green first.
- Reply to every comment (done / declined with reason / follow-up issue).

## Reviewers
- First response within <N> working hours (e.g. 4); full review within 1 working day.
- If you can't, say so and reassign. Silence is the worst outcome.
- Label comments: blocking / suggestion / question / nit. Only blocking comments block.
- Review the code, not the author. Assume competence and good intent.

## Approvals
- <1> approval for normal changes; <2> including a code owner for high-risk paths (list them or link the risk tiers).
- CODEOWNERS approval required on protected branches.
- New pushes after approval: <dismiss stale approvals | keep unless the change is substantive>.
- Authors merge their own PRs after approval (they own the rollout).

## Disagreements
1. Discuss in the thread, once each way, with reasons.
2. Move to a call if two rounds don't converge; write the outcome back to the thread.
3. If still stuck: the code owner decides; for cross-team issues, the tech lead. Record it as a decision.
Style preferences not covered by the linter or style guide are never blocking.

## Emergencies
Hotfixes may merge with one approval from on-call, or none if no one is reachable, with a follow-up review within
1 working day. Label them `hotfix` so they can be audited.

## Automation
Formatters and linters run in CI and pre-commit; reviewers don't comment on what tools enforce.
```

## Decision rules for the numbers

- **Turnaround:** first response matters more than full review. 4 working hours for first response is a common,
  achievable target; for distributed teams across time zones, use "within one working day of the reviewer's
  timezone".
- **Approvals:** default to one. Two approvals on everything slows teams without measurably reducing defects; reserve
  it for the high-risk tier.
- **Stale approvals:** dismissing on every push is safest but annoys teams with long-lived PRs; GitHub's branch
  protection can dismiss stale approvals or require approval of the most recent push. Pick one and configure it.
- **Size limit:** enforce softly (a CI warning or bot comment over the threshold), not as a hard block. Generated
  files, lock files and snapshots should be excluded from the count.
- **Rotation:** if reviews concentrate on a few people, use team review assignment (GitHub team settings support
  round robin and load balance) instead of asking individuals.

## Enforce with tooling, not memory

- Branch protection / rulesets: required approvals, required status checks, code owner review, no force pushes.
- PR template (`.github/pull_request_template.md`) with the description sections.
- CODEOWNERS for routing.
- Labels for risk tier and hotfix; a dashboard or saved search for PRs waiting > 1 day.

## Rolling it out

1. Draft with two or three engineers, not alone.
2. Circulate for comments for a week; adopt with a date.
3. Revisit after a month with the same metrics from step 1. Drop rules nobody follows or that didn't help.

## Pitfalls

- A policy that only restates generic best practices: if it has no numbers, no names and no tooling, it changes
  nothing.
- Rules that need constant human policing (counting lines by hand). Automate or drop.
- No escape hatch for incidents, so people bypass protection ad hoc and untracked.
- Treating approval as the reviewer taking responsibility; the author still owns the change in production.
