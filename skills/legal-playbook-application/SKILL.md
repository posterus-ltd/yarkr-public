---
name: legal-playbook-application
description: Apply a contract negotiation playbook (preferred, acceptable/fallback, walk-away positions and escalation owners) to counterparty paper, classify each clause and route exceptions. Use when reviewing third-party contracts against company standards or building a playbook. Review aid; counsel signs off.
---

# Applying a legal negotiation playbook

A playbook captures the company's agreed positions so that reviews are consistent and escalations are rare and
deliberate. This skill maps each clause of a counterparty document to the playbook tier it falls in and says what to
do next. **It supports, and does not replace, legal judgement. Counsel approves positions and any deviation.**

## Playbook structure

Each playbook entry should have:

```yaml
clause: limitation_of_liability
applies_to: [msa, saas, services]      # contract types
side: customer                         # customer | vendor | both
preferred: "Mutual cap at greater of 2x annual fees or 1M; uncapped for confidentiality, data breach, IP indemnity."
acceptable:
  - "Mutual cap at 12 months' fees with super-cap of 3x for data breach."
walk_away: "Any cap below 12 months' fees, or no carve-out for data breach."
approver_if_below_acceptable: General Counsel
rationale: "Data breach exposure can exceed annual fees."
sample_language: "<clause text>"
```

If the company has no playbook, build a draft one from its own template agreement plus the business's stated risk
appetite, and mark it "unapproved draft – counsel to confirm" before using it.

## Classification

For each playbook clause, find the corresponding text in the counterparty paper (by meaning, not heading; liability
caps often hide in "Miscellaneous" or the order form) and classify:

| Tier | Meaning | Action |
| --- | --- | --- |
| Preferred | Meets or beats preferred | Accept, no comment |
| Acceptable | Within an acceptable fallback | Accept or push toward preferred if cheap; note |
| Below acceptable | Between acceptable and walk-away | Redline to preferred/fallback; needs named approver to accept |
| Walk-away | At or beyond walk-away | Must change; escalate before any concession |
| Missing | Playbook clause absent | Insert our standard language |
| Not covered | Clause the playbook does not address | Flag for counsel judgement; suggest a playbook addition |

Compare substance, not wording. A cap at "fees paid in the prior 12 months" is lower than "12 months' fees" early in
a contract; describe the practical effect. Read combined effects too: a generous cap with a broad indirect-loss
exclusion may leave little recoverable.

## Applying context

Playbook tiers can shift with deal context. Apply only rules the playbook states, for example:

- Deal value thresholds (higher-value deals may require stronger positions, or allow more flexibility).
- Data sensitivity (personal data, health or payment data raises data-protection positions to non-negotiable).
- Counterparty type (public sector, regulated entities, large vendors who won't negotiate their paper).
- Strategic deals flagged by the business owner.

Do not invent context-based concessions. If the context suggests flexibility the playbook does not grant, recommend
an escalation instead.

## Escalation routing

Every clause below acceptable needs a named approver from the playbook. Produce an escalation list:

```
| Clause | Their position | Our acceptable | Gap | Business impact | Approver | Recommendation |
```

"Business impact" should be concrete: e.g. "Our recoverable damages for a data breach limited to ~40k against 2M
records of personal data."

## Negotiation sequencing

When there are many deviations, recommend an order:

1. Walk-away items first; no point negotiating the rest if these fail.
2. Bundle trades: concede low-value preferred items (e.g. governing law to neutral) in exchange for high-value ones
   (liability carve-outs).
3. Leave cosmetic items out of the first turn.

## Maintaining the playbook

After each negotiation, note clauses where the acceptable position was routinely breached or where "not covered"
came up. These are candidate playbook updates for counsel to approve. Never edit the playbook yourself based on
one deal.

## Output format

1. Header: counterparty, contract type, our side, playbook version, "Review aid – counsel sign-off required."
2. Classification table: `clause | section | their position (quote) | tier | action`.
3. Escalation list.
4. Suggested negotiation sequence.
5. Playbook gaps.

## Pitfalls

- Matching on headings only and missing the real clause.
- Applying customer-side positions to a vendor-side deal.
- Treating "acceptable" as "preferred" and not trying to improve when it costs nothing.
- Using an outdated playbook version; always state the version used.
