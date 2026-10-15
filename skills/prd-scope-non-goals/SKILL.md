---
name: prd-scope-non-goals
description: Draw explicit in-scope, out-of-scope and non-goal lists plus phased cut lines so a PRD resists scope creep. Use when writing a PRD's scope section, when a project keeps growing, when estimates come back too large, or when stakeholders disagree about what version one includes.
---

# PRD scope, non-goals and cut lines

Scope is the contract between product and engineering. The most valuable part is what you write down as *not*
happening, because that is where later arguments come from.

## Output shape

```markdown
## Scope

### In scope (v1)
- Admins export invoices for a date range as CSV (FR-1..FR-4)
- Export available on web; email link when ready (FR-5)

### Out of scope (v1, may come later)
- XLSX and PDF formats: CSV covers 90% of requests (ticket sample, n=120). Revisit after launch.
- Scheduled/recurring exports: needs the jobs platform (Q1 2027).

### Non-goals (we are deliberately not trying to do this)
- Replace the accounting integrations; export is for ad-hoc analysis, not sync.
- Serve non-admin roles.

### Cut lines
| Phase | Contents | Ships if | Target |
|---|---|---|---|
| P0 (MVP) | FR-1..FR-3, NFR-1..NFR-3 | always | 2026-12-01 |
| P1 | FR-4, FR-5 (email link) | P0 lands by 2026-11-20 | 2026-12-15 |
| P2 | Column picker (FR-6) | primary metric ≥ 50% of target after 4 weeks | Q1 2027 |

### Assumptions
- Max 200k invoices per account (largest today: 140k).
```

## Definitions (keep them distinct)

- **In scope:** will be built and released in this project. Each item maps to requirement IDs.
- **Out of scope:** reasonable to want, deliberately deferred. Give the reason and when/what would bring it back.
- **Non-goal:** an outcome this work is *not* trying to achieve, even later. Non-goals stop the project from being
  judged against the wrong objective and keep design from optimising for it.
- **Cut line:** an ordered boundary saying what gets dropped first if time or capacity runs short.
- **Assumption:** a fact taken as true that, if false, changes scope. Each needs a way to verify it.

## Steps

1. **List every candidate item** from requests, research and stakeholder asks. Don't filter yet.
2. **Tie each to the primary metric or problem.** Items with no link to the problem go to Out of scope or get cut.
3. **Find the smallest slice that tests the core hypothesis**: the minimum that a target user would actually use to
   do the job end-to-end. That is P0. Thin end-to-end beats a polished half-flow.
4. **Order the rest** into phases by value ÷ effort and by dependency. Write explicit conditions for each phase
   ("ships if", based on date or metric), not just a list.
5. **Write non-goals** by asking: what will people assume this project does that it doesn't? What adjacent problem
   could designers be tempted to solve? Which user segment are we not serving?
6. **Write the reason** next to every out-of-scope item. Unexplained exclusions get re-added in review.
7. **Record assumptions** with an owner who will verify them before build.
8. **Get sign-off** from the eng lead and design lead on the cut lines specifically, not just the doc as a whole.

## Handling scope change after approval

- New request arrives: classify it as (a) needed to meet an existing Must, (b) new scope.
- (a) goes in with a changelog note. (b) goes to Out of scope or a later phase by default; pulling it into the current
  phase requires naming what moves out (trade, don't add) and a changelog entry with who agreed.
- If more than ~20% of the original effort has been traded, re-review the whole PRD.

## Good non-goal examples

- "Not a reporting tool: no charts or aggregations; users take the CSV elsewhere."
- "Not optimising for mobile; < 3% of admin sessions are mobile."
- "Not changing pricing or packaging; export is available on all paid plans as today."
- "Not solving data quality in source invoices."

## Pitfalls

- Non-goals that are just negations of goals ("not making it slow"). They should rule out a plausible direction.
- Phases with no entry condition, so P1 and P2 silently become part of P0.
- "Out of scope" used to hide hard but necessary work (migrations, permissions, accessibility). If it's needed for P0
  to be usable or safe, it's in scope.
- Scope listed as features without mapping to requirement IDs, so engineering can't tell what's covered.
- Forgetting operational scope: support macros, docs, admin tooling, data backfill.
