---
name: contract-clause-review
description: Review commercial contract clauses (limitation of liability, indemnity, IP, confidentiality, termination, payment, data protection, governing law) against a standard position and list issues by clause. Use for first-pass review of NDAs, MSAs, SaaS, vendor and services agreements. Drafting aid only; counsel signs off.
---

# Contract clause review

A structured first-pass review of commercial contracts. It finds clauses, compares them to the company's standard
position, and reports deviations with a severity and a suggested position. **This is a review aid, not legal advice.
A qualified lawyer must review the output and approve any position before it is sent to a counterparty or signed.**
Say so at the top of every output.

## Before reading

1. Identify which side we are on (customer/buyer or vendor/supplier; discloser or recipient). Most positions flip
   with the side; getting it wrong inverts the whole review.
2. Identify contract type, governing law, deal value and term. Note them in the header.
3. Load the standard position or playbook if one exists (see legal-playbook-application). Without one, use the
   default positions below and say that you did.
4. Collect the whole agreement: order forms, schedules, DPAs, and documents incorporated by reference (online terms,
   policies via URL). Clauses in an unread incorporated document are unreviewed; list them as a gap.

## Reading order

Definitions first: "Confidential Information", "Losses", "Affiliates", "Services", "Deliverables" drive everything
else. Then the order of precedence clause, then the clauses below. Track every cross-reference; a cap that excludes
"Section 9 obligations" may exclude far more than it looks.

## Clause checklist and default positions (customer side)

| Clause | Look for | Default customer position |
| --- | --- | --- |
| Limitation of liability | Cap amount and basis; mutuality; exclusions of indirect/consequential loss; carve-outs | Mutual cap ≥ 12 months' fees; super-cap or uncapped for data breach, confidentiality, IP indemnity; carve-outs for fraud, wilful misconduct, death/personal injury |
| Indemnities | Who indemnifies what; procedure; caps | Vendor indemnifies third-party IP infringement and data breach; customer indemnity limited to its content/misuse |
| IP ownership | Background vs foreground IP; deliverables; licence scope; feedback clause | Customer owns paid-for deliverables or gets a perpetual licence; vendor keeps background IP |
| Confidentiality | Definition breadth; exceptions; duration; return/destroy | Mutual; standard four exceptions; 3–5 years, trade secrets indefinitely |
| Data protection | DPA; processor/controller roles; sub-processors; transfers; breach notice | DPA attached; breach notice ≤ 72h or "without undue delay"; SCCs or equivalent for transfers |
| Term and termination | Auto-renewal; notice; termination for convenience; for cause cure period | Termination for convenience on notice; 30-day cure; renewal notice window ≥ 60 days with price cap |
| Payment | Terms; late interest; disputes; price increases | Net 30–45; good-faith dispute right withholds disputed amount; increases capped (e.g. CPI or a fixed %) |
| Warranties | Performance; conformity with docs; disclaimer scope | Services conform to documentation; remedy is re-performance or refund |
| SLA | Availability; credits; sole remedy wording | Credits not sole remedy for chronic failure; termination right |
| Assignment / change of control | Consent requirements | Mutual consent, except to affiliates or successor |
| Governing law / disputes | Law; venue; arbitration | Our home jurisdiction or neutral; no unilateral venue |
| Insurance | Types and limits | Vendor carries CGL, professional/E&O, cyber at stated limits |
| Audit | Scope, notice, frequency | Customer audit right for security/compliance, reasonable notice |

For vendor-side review, invert: lower cap (fees paid in prior 12 months), narrow indemnities, keep IP, limit audit,
no termination for convenience in a committed term.

## Red flags to always raise

- Unlimited liability for us without reciprocity.
- Indemnity for "any and all claims arising from" our use (unbounded).
- Unilateral right to change terms by updating a URL.
- Auto-renewal with a short notice window and uncapped price increases.
- Assignment of our pre-existing IP or broad licence to our data for training or product improvement.
- Exclusivity, non-compete, non-solicit or most-favoured-nation clauses.
- Liquidated damages or penalties.
- Governing law where we have no presence, or mandatory arbitration in a far venue.
- Missing clauses: no confidentiality, no DPA where personal data is processed, no termination right.

## Severity

- **High**: material financial or legal exposure, or outside walk-away position. Must be resolved before signature.
- **Medium**: deviates from standard; negotiate, may accept with approval.
- **Low**: drafting or clarity issue; fix if convenient.

## Output format

```
DRAFT FOR COUNSEL REVIEW – not legal advice.
Contract: <title>, <counterparty>, <our side>, <governing law>, <value/term>
Positions used: <playbook name/version | default positions>

| # | Clause (section) | Current text (short quote) | Issue | Severity | Suggested position |
```

Then: missing clauses, unreviewed incorporated documents, questions for the business owner (e.g. "Will personal
data be shared?"), and a three-line overall view.

## Pitfalls

- Reviewing the MSA but not the order form that overrides it.
- Quoting from memory instead of the text; always quote the actual words with the section number.
- Treating "consequential loss" exclusions as standard everywhere; in some jurisdictions they exclude less or more
  than expected. Flag for counsel rather than conclude.
- Giving definitive legal conclusions on enforceability; leave those to counsel.
