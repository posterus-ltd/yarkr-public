# ADRs

## Template

File: `docs/architecture/decisions/NNNN-<kebab-title>.md`. Next number = highest existing + 1, four digits.

```markdown
# NNNN. <Decision as a short imperative: "Use Postgres for all persistent data">

- Status: Accepted
- Date: 2026-10-20

## Context

<What forces the decision: the problem, constraints, requirements. 3–6 lines. Facts, not the answer.>

## Options

- **<Option A>**: <main pro> / <main con>
- **<Option B>**: <main pro> / <main con>

## Decision

<What we chose and the one or two reasons that decided it.>

## Consequences

- <What gets easier.>
- <What gets harder or what we now must do.>
```

Keep it under a page. If the Options section needs a matrix, the decision is big enough for a design doc; link it.

## ADR 0001

```markdown
# 0001. Record architecture decisions

- Status: Accepted
- Date: <today>

## Context

Decisions get questioned months later when nobody remembers why they were made.

## Decision

Record each significant architecture decision as a short ADR in `docs/architecture/decisions/`, in the PR that
implements it.

## Consequences

- Reviewers can ask "where's the ADR?" for structural changes.
- Old ADRs are never rewritten; a new ADR supersedes them.
```

## Lifecycle

| Event | Do |
| --- | --- |
| Decision proposed in a PR for discussion | `Status: Proposed`; becomes `Accepted` when the PR merges |
| Decision rejected | Keep the file with `Status: Rejected` if the discussion is worth keeping; otherwise drop it before merge |
| Decision replaced | New ADR with `Supersedes [NNNN](NNNN-...md)` under the status line; old ADR's status becomes `Superseded by [MMMM](MMMM-...md)` |
| Decision no longer relevant (feature removed) | `Status: Deprecated` + one line why |

Every status change updates the row in `09-architecture-decisions.md`. If the decision was a key idea, update the
bullet in `04-solution-strategy.md` to link the new ADR.

## Backfilling

When adopting ADRs in an existing codebase, write ADRs only for decisions a newcomer would question. Mark them
`Accepted`, date them today, and say in Context that it records an earlier decision. Five good backfilled ADRs beat
twenty thin ones.
