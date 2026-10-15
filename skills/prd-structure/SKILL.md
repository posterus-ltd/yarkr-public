---
name: prd-structure
description: Lay out a product requirements document (PRD) in a fixed, skimmable template covering problem, users, goals, scope, requirements, risks and open questions. Use when drafting a new PRD, restructuring a messy spec, or turning notes, interviews or a one-pager into a spec engineers can build from.
---

# PRD structure

A PRD exists so that engineering, design and stakeholders can agree on *what problem we are solving, for whom, and
how we will know it worked* before anyone commits to a solution. Structure is what makes it skimmable: every PRD
uses the same sections in the same order, so a reader knows where to look.

## The template

Use these sections, in this order. Keep the headings even when a section is short; write "None identified" rather
than deleting it, so reviewers can see it was considered.

```markdown
# <Feature name>: PRD

| Owner | Status | Last updated | Reviewers | Target release |
|---|---|---|---|---|
| <PM> | Draft / In review / Approved / Shipped | YYYY-MM-DD | Eng lead, Design, Data | <quarter or date> |

## 1. TL;DR
Three sentences max: the problem, who has it, what we will do about it and the metric we will move.

## 2. Problem
- What is happening today, in the user's terms.
- Evidence: quotes, ticket counts, funnel data, churn reasons (with links and dates).
- Why now: what changed, what it costs to wait.

## 3. Users and use cases
- Primary persona / segment, and who is explicitly not targeted.
- 3-6 use cases written as "As a <role>, when <situation>, I want <outcome>, so that <benefit>."

## 4. Goals and success metrics
Primary metric, guardrails, baseline, target, measurement window (see prd-success-metrics).

## 5. Scope
In scope / out of scope / non-goals / phased cut lines (see prd-scope-non-goals).

## 6. Requirements
Numbered functional (FR-n) and non-functional (NFR-n) requirements with MoSCoW priority
(see prd-requirements-writing).

## 7. User experience
Links to flows, wireframes or prototypes. Describe key states: empty, loading, error, permission-denied.

## 8. Dependencies
Teams, services, vendors, legal/privacy reviews, with owner and status.

## 9. Risks and mitigations
| Risk | Likelihood | Impact | Mitigation | Owner |

## 10. Rollout and launch
Flagging, beta cohort, migration, comms, support enablement, kill switch.

## 11. Open questions
| # | Question | Owner | Due | Resolution |

## 12. Appendix / changelog
Research links, alternatives considered, decision log with dates.
```

## How to fill it

1. **Start from the problem, not the feature.** If the input is a solution ("add bulk export"), ask or infer the
   underlying job ("finance needs month-end data in their spreadsheet in under 5 minutes"). Put the solution idea in
   the appendix as one option until the problem is agreed.
2. **Write the TL;DR last**, after the other sections exist; it should be derivable from them.
3. **Cite evidence with numbers and sources.** "Users are frustrated" is not evidence; "142 tickets tagged
   `export` in Q2, 3rd most common tag (Zendesk view link)" is.
4. **Name a single owner** per open question, risk and dependency. "Team" is not an owner.
5. **Separate what from how.** Sections 1-6 describe the problem and required behaviour. Implementation choices
   belong in the engineering design doc, linked from section 8 or the appendix.
6. **Mark unknowns explicitly** with `[TBD: <what is missing>, owner]` rather than inventing details. A PRD with
   honest gaps is reviewable; one with plausible fabrications is dangerous.

## Length and format rules

- Target 2-6 pages. If it is longer, the scope is probably two PRDs, or the appendix is doing the body's job.
- Tables for anything with more than three attributes per row (risks, dependencies, questions).
- One idea per bullet; no paragraphs over five lines.
- Use absolute dates (`2026-11-30`), never "next sprint" or "end of month".
- Link, don't paste: research decks, dashboards and designs are linked with a one-line takeaway.

## Status lifecycle

| Status | Meaning | Who can move it |
|---|---|---|
| Draft | PM is writing; comments welcome but not binding | PM |
| In review | Content complete; reviewers asked for sign-off by a date | PM |
| Approved | Eng, design and PM leads signed off; changes need a changelog entry | PM after sign-offs |
| Shipped | Released; metrics section updated with actuals | PM |

After approval, every change gets a changelog line: date, what changed, why, who agreed.

## Adapting the template

- **Small change (< 2 weeks of work):** a one-pager with sections 1, 2, 4, 5, 6 and 11 is enough.
- **Platform / API work:** "users" are developers or internal teams; add an API contract link and a
  backwards-compatibility requirement.
- **Regulated or data-sensitive features:** add a "Compliance and privacy" section after Dependencies listing the data
  processed, legal basis and required reviews.
- **Experiments:** replace Rollout with an experiment design (hypothesis, variants, sample size, duration, decision rule).

## Pitfalls

- Solution in the problem statement ("Users need a dashboard"): rewrite as the outcome they lack.
- Goals that are activities ("launch X") instead of outcomes ("reduce time-to-first-report from 3 days to 1").
- Personas with no evidence behind them. Tie each to a segment you can count.
- Open questions with no owner or due date: they never close.
- Copying the template's prompts into the final doc. Delete the guidance text once a section is written.
