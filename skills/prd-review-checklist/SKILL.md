---
name: prd-review-checklist
description: Review a PRD for missing user evidence, vague requirements, unmeasurable goals, unowned risks and unresolved questions, and return prioritised findings. Use when asked to critique, review, sign off or pressure-test a product spec or PRD before engineering kickoff.
---

# PRD review checklist

Review the document as the engineer who has to build it, the designer who has to shape it, and the analyst who has to
measure it. Your output is a list of specific, actionable findings ranked by how much they would hurt if not fixed.

## Process

1. Read the whole PRD once without commenting. Write a one-sentence summary of what it asks for; if you can't, that's
   the first finding.
2. Walk the checklist below section by section. For each failed check, record: location, problem, why it matters,
   suggested fix (concrete wording where possible).
3. Rate each finding:
   - **Blocker**: engineering cannot estimate or build correctly, or success cannot be judged.
   - **Major**: likely rework, scope fight or missed launch criteria.
   - **Minor**: clarity, consistency, formatting.
4. Return the findings in the output format. Lead with blockers. Do not rewrite the PRD unless asked.

## Checklist

**Problem and evidence**
- [ ] Problem is stated in user terms, not as a missing feature.
- [ ] At least one quantitative and one qualitative piece of evidence, each with a source and date.
- [ ] "Why now" is stated.
- [ ] Target users are a countable segment; excluded users are named.

**Goals and metrics**
- [ ] Exactly one primary metric with definition, baseline, target and window.
- [ ] Guardrail metrics exist.
- [ ] Decision rule is written down (what result means ship / iterate / roll back).
- [ ] Instrumentation needed is listed with an owner.

**Scope**
- [ ] In-scope items map to requirement IDs.
- [ ] Out-of-scope items have reasons; non-goals rule out plausible directions.
- [ ] Phases have entry conditions.
- [ ] Operational work (support, docs, migration, admin tools) is accounted for.

**Requirements**
- [ ] Numbered, prioritised (MoSCoW), with acceptance criteria.
- [ ] No untestable adjectives (fast, simple, intuitive, robust, seamless, scalable).
- [ ] No unjustified implementation detail.
- [ ] Error, empty, loading and permission states are covered.
- [ ] NFRs considered: performance, security, privacy, accessibility, localisation, compatibility.
- [ ] Terms are defined consistently (same word means same thing throughout).

**Risks, dependencies, questions**
- [ ] Each risk has likelihood, impact, mitigation and a named owner.
- [ ] Dependencies have owner and status; external teams have agreed, not just been mentioned.
- [ ] Open questions have owner and due date; none blocks a Must requirement without a date before kickoff.
- [ ] Privacy, legal or compliance review is listed if personal or financial data is touched.

**Rollout**
- [ ] Feature flag / staged rollout and a kill switch or rollback path.
- [ ] Support and sales enablement are planned.
- [ ] Migration or backfill for existing data/users is addressed.

**Consistency**
- [ ] Numbers match across sections (dates, targets, limits).
- [ ] TL;DR matches the body.
- [ ] Status, owner and last-updated fields are filled.

## Red-flag phrases to search for

`etc.`, `and so on`, `TBD` without owner, `should be easy`, `as needed`, `appropriate`, `user-friendly`, `support
for` (without what support means), `all` / `any` (usually unbounded), `real-time` (without a latency number),
`similar to <competitor>` (without the specific behaviour).

## Output format

```markdown
## PRD review: <title> (<date>)

**Summary:** <one sentence of what the PRD asks for>
**Verdict:** Ready / Ready after blockers fixed / Needs another draft
**Counts:** <n> blockers, <n> major, <n> minor

### Blockers
1. **[§6 FR-3]** "Exports should be fast" has no threshold. Engineering can't size infra or test it.
   *Fix:* "p95 time from request to download link < 60 s for ≤ 50k rows."

### Major
...

### Minor
...

### Questions for the author
- <things you couldn't judge from the doc>
```

## Pitfalls for the reviewer

- Debating the strategy when asked to review the spec. Flag strategic concerns once, separately, then review what's
  written.
- Vague findings ("requirements could be clearer"). Quote the text and propose wording.
- Burying a blocker among 30 minor comments. Cap minor findings at ~10 and group similar ones.
- Inventing evidence or numbers to "fix" a gap. Mark it as missing and say who could supply it.
