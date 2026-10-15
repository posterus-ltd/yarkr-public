---
name: contract-risk-scoring
description: Score contract risk across clause categories (liability, indemnity, IP, data, termination, payment, compliance) with a transparent rubric and produce a one-page risk summary for business approvers. Use before contract approval, for deal desk review, or to triage a contract backlog. Review aid; counsel signs off.
---

# Contract risk scoring

Translate clause-level review findings into a score and a one-page summary that a non-lawyer approver (sales VP,
CFO, procurement lead) can act on. The scoring must be transparent and repeatable; anyone should be able to see why a
contract scored what it did. **Scores are an aid to approval decisions. Legal conclusions and final risk acceptance
rest with counsel and the authorised approver.**

## Rubric

Score each category 0–3 for **likelihood** of the risk arising and 1–4 for **impact** if it does. Category score
= likelihood × impact (0–12).

| Category | What drives a high score |
| --- | --- |
| Liability | Low or no cap on our side; no carve-outs protecting us; uncapped exposure for us |
| Indemnity | Broad, uncapped indemnities given by us; none received for IP/data |
| IP | Assignment of our IP; broad licence to our data; unclear deliverable ownership |
| Data protection | Personal/sensitive data processed without DPA, transfer mechanism, breach terms |
| Termination / term | Long lock-in; no termination for convenience; auto-renewal with short notice |
| Payment / pricing | Uncapped increases; upfront payment for long terms; no dispute right; penalties |
| Performance | No SLA or warranty; remedies sole and minimal |
| Compliance | Regulatory obligations (export, sanctions, anti-bribery, sector rules) unaddressed |
| Operational | Obligations we can't meet (reporting, audit, staffing, exclusivity, non-solicit) |

Impact scale, tie to money where possible:

- 1: below 10k or easily absorbed.
- 2: up to annual contract value.
- 3: multiple of contract value, or regulatory notice.
- 4: existential, regulatory penalty, or reputational harm.

Adjust thresholds to the company; state the thresholds used.

## Overall rating

- Any category ≥ 9 → **High** regardless of total.
- Total ≥ 30 or two categories ≥ 6 → **High**.
- Total 15–29 → **Medium**.
- Below 15 → **Low**.

Map rating to approval route as the company defines it (e.g. Low: business owner; Medium: legal + finance;
High: General Counsel + CFO). If no mapping exists, state that the approver must be set by the company.

## Procedure

1. Start from a clause review (contract-clause-review or playbook classification). Do not score from the summary
   of a summary; each score must cite a section.
2. Score each category with a one-line justification and the section reference.
3. Note mitigations that reduce the score: insurance cover, low data sensitivity, short term, low deal value.
   Apply them explicitly ("likelihood reduced from 2 to 1 because no personal data is shared").
4. Calculate totals and rating.
5. Identify the top three risks by score; these lead the summary.
6. Write the summary for a business reader: no Latin, no section-number soup, money and consequences.

## One-page summary format

```
CONTRACT RISK SUMMARY – review aid, counsel sign-off required
Contract: <title> | Counterparty: <name> | Our side: <customer/vendor>
Value: <total, annual> | Term: <start–end, renewal> | Rating: <Low/Medium/High> (score <n>/108)

Top risks
1. <Risk in plain words> – <what could happen, rough money impact> – <what we asked for / can ask for>
2. ...
3. ...

Scores
| Category | L | I | Score | Why (section) |

Open negotiation points: <n> (<n> walk-away)
Recommendation: <sign / sign with conditions / do not sign until X>, for <approver>.
Key dates: <renewal notice deadline>, <termination notice>.
```

Keep it to one page. Details go to an appendix.

## Calibration

- Score the same contract twice independently if possible; differences of more than one point in a category mean
  the rubric needs clarifying.
- Compare against previously approved contracts of the same type; a new contract scoring far above them deserves a
  reason.
- Revisit scores after each negotiation turn and show the delta.

## Pitfalls

- Averaging away a single catastrophic risk; that is why any category ≥ 9 forces High.
- Scoring legal "neatness" instead of business exposure.
- Recommending "sign" when a walk-away item is open.
- Precise-looking money estimates without basis; give ranges and say how they were derived.
