---
name: prisma-screening
description: Run title/abstract and full-text screening against pre-specified eligibility criteria, recording a decision and reason for every record, and produce PRISMA 2020 flow-diagram counts. Use when screening search results for a systematic, scoping or rapid review, piloting criteria, or reconciling screening decisions.
---

# PRISMA screening

Screening applies the protocol's eligibility criteria to every record, transparently. Each decision must be
reproducible from the criteria, and the counts must reconcile from identification to inclusion (PRISMA 2020).

## 1. Operationalise the criteria

Turn the protocol's criteria into a numbered checklist with tie-breakers, ordered so the most frequent exclusions come
first (it speeds screening):

```text
E1 Population: adults (≥18) with type 2 diabetes. Mixed T1/T2 samples only if T2 results reported separately.
E2 Intervention: smartphone or tablet app used by the patient for self-management. SMS-only → exclude.
E3 Comparator: any (usual care, other intervention, none).
E4 Outcome: HbA1c reported.
E5 Design: RCT or cluster RCT. Protocols, conference abstracts without results → exclude.
E6 Language/date: per protocol.
```

Pilot on 50–100 records with all screeners; refine wording where they disagree; record changes in the protocol log.

## 2. Title/abstract screening

- Decisions: `include` (go to full text), `exclude` with the criterion code, or `unsure` (treat as include — at this
  stage, err toward sensitivity).
- Exclude only when the record clearly fails a criterion. Missing information is not a reason to exclude.
- Standard practice: two independent screeners per record, blinded to each other, then reconcile conflicts by
  discussion or a third reviewer. When an agent screens, it is one screener; flag that a human must screen in parallel
  or verify, and report the method honestly.
- Report agreement (percentage and Cohen's kappa) from the pilot or the full set.

## 3. Full-text screening

- Retrieve full texts; log those not retrievable (after contacting authors/libraries) as "reports not retrieved".
- Apply criteria in order; record the **first** failing criterion as the exclusion reason (a single primary reason per
  report keeps counts consistent).
- Link multiple reports of the same study (protocol, main results, secondary analyses) so studies are counted once.
- Keep a table of excluded full texts with reasons — journals and PRISMA expect it.

## 4. Record keeping

One row per record:

| Record ID | Source DB | Title | Stage | Screener | Decision | Reason code | Note/quote |
| --- | --- | --- | --- | --- | --- | --- | --- |

For an agent's decisions, the note must quote or paraphrase the text that triggered the decision ("abstract: 'children
aged 8–14'" → E1). Tools such as Covidence, Rayyan or ASReview store this; export at the end.

## 5. PRISMA 2020 flow counts

```text
Identification
  Records identified from: databases (n = per DB), registers (n = )
  Records removed before screening: duplicates (n = ), marked ineligible by automation (n = ), other reasons (n = )
Screening
  Records screened (n = )                → Records excluded (n = )
  Reports sought for retrieval (n = )   → Reports not retrieved (n = )
  Reports assessed for eligibility (n = ) → Reports excluded, with reasons: E1 (n = ), E2 (n = ), …
Included
  Studies included in review (n = ); reports of included studies (n = )
```

Use the "other methods" column for citation chasing, websites, etc. if those sources were searched.

Reconcile before reporting:
- identified − removed before screening = screened
- screened − excluded = sought for retrieval
- sought − not retrieved = assessed
- assessed − excluded = included reports (studies may be fewer when several reports describe one study)

If the arithmetic doesn't close, find the discrepancy; never adjust a number to make it fit.

## Output

1. The screening log (table or CSV).
2. PRISMA counts block with reconciliation shown.
3. Excluded full-text table with reasons.
4. Notes: criteria amendments, agreement statistics, records needing human adjudication (all `unsure` and conflicts).

## Pitfalls

- Excluding at title/abstract for "outcome not mentioned" — outcomes are often only in the full text.
- Counting reports as studies, or vice versa.
- Changing criteria mid-screening without re-screening earlier records.
- Multiple exclusion reasons per report, making the reason counts exceed the total.
