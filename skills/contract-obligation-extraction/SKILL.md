---
name: contract-obligation-extraction
description: Extract obligations, deadlines, notice periods, renewal terms, payment milestones and key dates from executed contracts and amendments into tracker rows with computed dates and source citations. Use after signature, for renewal tracking, contract migration into a CLM, or compliance audits.
---

# Contract obligation extraction

After signature, value and risk sit in the obligations: renewal windows missed, SLA credits never claimed, reports
never delivered. This skill turns an executed contract into tracker rows that a contract manager can own. Output is
an extraction for the contract owner to verify; interpretation of ambiguous clauses goes to counsel.

## Read the right documents

1. Use the **executed** version (signed, dated). Drafts and redlines are not sources.
2. Collect all amendments, order forms, SOWs, change orders and side letters. Apply them in date order; later
   amendments override earlier text only to the extent stated.
3. Check the order of precedence clause before resolving conflicts.
4. Record the effective date (which may differ from the signature date) and the source of each date.

## What to extract

| Type | Examples |
| --- | --- |
| Term and renewal | Initial term, renewal term, auto-renew yes/no, non-renewal notice period |
| Termination rights | For convenience (notice), for cause (cure period), change of control |
| Payment | Fees, invoicing schedule, payment terms, price increase mechanism and notice |
| Delivery / milestones | Deliverables, acceptance periods, milestone dates |
| Service levels | Availability target, credit claim deadline, reporting |
| Reporting / notices | Periodic reports, audit rights, certificates, insurance evidence |
| Compliance | Data breach notice period, sub-processor notice, security reviews |
| Post-termination | Data return/deletion window, transition assistance, surviving clauses |
| Restrictions | Exclusivity, non-solicit, minimum commitments, MFN |

For each obligation decide the **obligor** (us, them, mutual) and whether it is **recurring** or **one-off**.

## Date computation

- State the rule and the computed date: "Non-renewal notice 90 days before end of Initial Term (31 Dec 2027) →
  deadline 2 Oct 2027."
- Count calendar days unless the contract says business days; note which jurisdiction's business days.
- "Within 30 days of" includes the start rule: from receipt, from invoice date, from notice. Record it.
- Monthly/annual anniversaries: use the effective date's day of month; for the 29th–31st, apply end of month.
- Auto-renewal: compute the next renewal end date and the next notice deadline; the tracker must roll forward.
- Set an internal reminder earlier than the deadline (e.g. notice deadline − 30 days for renewal decisions,
  − 5 business days for operational notices).

Example: effective 15 Mar 2026, initial term 24 months, auto-renews for 12-month periods unless notice given 60 days
before expiry. Initial term ends 14 Mar 2028. Notice deadline 14 Jan 2028. Reminder 15 Dec 2027.

## Tracker row schema

```
contract_id, counterparty, obligation_id, type, obligor, description, source_section, source_quote,
trigger, due_date, recurrence, notice_method, owner, reminder_date, status, confidence, notes
```

- `source_quote`: the exact words, short. Every row must be traceable.
- `notice_method`: from the notices clause (email allowed? registered post? addressee). Many missed renewals were
  "notified" by the wrong method.
- `confidence`: high (explicit date), medium (computed from clear rule), low (ambiguous; route to counsel).
- `owner`: a role if the person is unknown (e.g. "Procurement – vendor manager").

Export as CSV for a spreadsheet or the CLM's import format if specified.

## Quality checks

- Every term, renewal and termination right is captured; a contract with no renewal row is suspect.
- No row without a section reference.
- Amendments applied: compare fees and term in the latest amendment vs the base agreement.
- Mutual obligations produce rows for both sides if we need to monitor theirs (e.g. their SLA reports).
- Dates are computed, not left as "90 days before renewal".
- Ambiguities listed separately with the competing readings.

## Output format

1. Contract header: parties, effective date, documents used (with dates), governing law.
2. Tracker rows (table or CSV).
3. Upcoming in the next 90 days.
4. Ambiguities for counsel.

## Pitfalls

- Using the signature date as the effective date.
- Missing a renewal term changed by an order form.
- Treating "evergreen" agreements as having no deadline; they usually have termination notice rules.
- Ignoring notices clause formalities.
- Extracting from an unsigned copy found in email.
