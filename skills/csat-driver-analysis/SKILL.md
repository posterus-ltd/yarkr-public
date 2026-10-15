---
name: csat-driver-analysis
description: Analyse low-CSAT (and low-NPS/CES) support conversations to find root causes across product, policy, process and agent behaviour, quantify each driver, and recommend owners and fixes. Use when CSAT drops, when asked why customers rate support badly, or when preparing a support insights report.
---

# CSAT driver analysis

Low satisfaction scores in support are usually not about the agent. The goal is to sort bad ratings into causes,
measure how much each cause contributes, and route each to the team that can fix it.

## Data to gather

- Rated conversations for the period (e.g. last 30-90 days): rating, comment, ticket ID, channel, type/area tags,
  priority, plan, agent, team, first response time, full resolution time, number of replies, reopens, escalated
  (y/n), macro used, language.
- The conversation text for all low ratings (e.g. 1-2 on a 5-point scale, or "bad" on a binary scale) and a
  comparison sample of high ratings.
- Context: releases, incidents, policy or pricing changes in the period.

## Step 1: Quantify first

Compute CSAT (% positive) overall and by segment: area, type, channel, plan, priority, agent/team, escalated vs not,
first response time bucket, resolution time bucket, replies-to-resolve bucket, reopened vs not. Look for segments with
both low CSAT and meaningful volume. Report sample sizes; ignore segments with very few ratings or flag them as
low-confidence.

## Step 2: Code each low-rated conversation

Read each conversation (and comment) and assign one **primary** driver and optional secondary drivers from a fixed
codebook:

| Driver group | Codes |
|---|---|
| Product | bug, missing feature, usability/confusing UI, performance, outage/incident |
| Policy | refund declined, pricing/plan limit, account restriction, terms disagreement |
| Process | slow first response, slow resolution, too many handoffs, asked to repeat info, channel friction, closed without resolution |
| Agent | wrong/incomplete answer, didn't answer the question, tone, no ownership/next step |
| Knowledge | outdated or missing help article/macro |
| Customer context | rating not about support (e.g. general product frustration), mis-click/unclear |

Rules:
- The primary driver is the one that, if fixed, would most likely have changed the rating.
- Distinguish "the answer was no" (policy) from "the no was handled badly" (agent); they have different owners.
- Use the customer's comment as evidence but verify against the conversation.
- Code a small set twice (or with a second reviewer) to check consistency; refine the codebook if codes are ambiguous.

## Step 3: Analyse

- Share of low ratings per driver group and code.
- Driver × area matrix: which product areas generate which drivers.
- Trends vs prior period; spikes aligned with releases or incidents.
- For agent-driven codes, check whether it's concentrated in a few agents (coaching) or spread (training, macro, or
  tooling issue).
- Estimate impact: "Fixing X would address ~N low ratings/month (~Y points of CSAT)", computed as
  (low ratings with that primary driver) ÷ (total ratings).

## Step 4: Recommend

For each top driver (usually the top 3-5 cover most low ratings): the root cause in one sentence, evidence (counts +
2-3 representative quotes), a recommended fix, the owner team, and how to measure the improvement.

## Output format

```markdown
## CSAT driver analysis: <period>
CSAT: 84% (n=2,310 rated; prior period 88%) | Low ratings analysed: 370

### Top drivers
| # | Driver | Group | % of low ratings | Trend | Owner | Recommended fix |
|---|---|---|---|---|---|---|
| 1 | Xero sync failures | Product (bug) | 22% | ↑ from 6% | Integrations eng | Fix SF-403; proactive notice to affected accounts |
| 2 | Refund declined outside window | Policy | 14% | flat | Billing/RevOps | Renewal reminder 14 days before; policy-explanation macro rewrite |

### Segments
<table of CSAT by area / channel / resolution time with n>

### Representative quotes
### Agent coaching themes (aggregate, no individual blame in the shared report)
### Data caveats
```

## Pitfalls

- Treating CSAT as an agent score; most low ratings trace to product and policy.
- Small samples presented as trends; always show n.
- Survey bias: response rates differ by segment, and angry customers respond more. Note it.
- Coding with free text instead of a fixed codebook, making periods incomparable.
- Recommendations without an owner team.
- Naming individual agents in a broadly shared report; handle individual coaching privately.
