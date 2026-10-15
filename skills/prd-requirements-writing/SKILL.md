---
name: prd-requirements-writing
description: Write numbered, testable functional and non-functional requirements with MoSCoW priority and no solution leakage. Use when filling the requirements section of a PRD, converting user stories or meeting notes into requirements, or tightening vague requirements before engineering estimates.
---

# Writing PRD requirements

A requirement states an observable behaviour or quality the product must have, precisely enough that QA could write a
test for it and engineering could estimate it, without dictating the implementation.

## Format

```markdown
### Functional requirements
| ID | Priority | Requirement | Acceptance criteria | Source |
|---|---|---|---|---|
| FR-1 | Must | An account admin can export all invoices for a chosen date range as CSV. | Given 10,000 invoices in range, the file downloads within 60 s and contains one row per invoice with the columns in Appendix A. | Interviews #3, #7; 142 tickets Q2 |

### Non-functional requirements
| ID | Priority | Category | Requirement | Measure |
|---|---|---|---|---|
| NFR-1 | Must | Performance | Export start returns a job ID quickly. | p95 < 500 ms at 50 req/s |
```

Rules for IDs: never renumber. If FR-4 is deleted, mark it `FR-4 (removed 2026-10-02: reason)`; tickets and tests
reference these IDs.

## Writing each requirement

1. **Actor + capability + object + condition.** "A <role> can <verb> <object> <when/within constraint>."
2. **Use "must" only in the priority column.** In the text, use the present tense ("The system sends...", "A viewer
   can..."). Avoid "should" in the text: it reads as optional.
3. **One behaviour per requirement.** If you write "and", check whether it's two requirements.
4. **Make it testable.** Replace adjectives with thresholds:

   | Vague | Testable |
   |---|---|
   | fast | p95 latency < 300 ms for 1k-row tables |
   | easy to find | reachable from the main nav in ≤ 2 clicks |
   | secure | only users with `billing:read` can view; access is audit-logged |
   | supports large files | accepts uploads up to 2 GB; rejects larger with error E413 and a message naming the limit |
   | user-friendly | 4 of 5 test participants complete task X unaided in < 3 min |

5. **Write acceptance criteria in Given/When/Then** for anything with branching behaviour, and always cover at least one
   failure path (invalid input, no permission, empty state, timeout).
6. **Trace to a source**: research note, ticket cluster, legal requirement, metric. A requirement with no source is
   a candidate for "Won't".

## No solution leakage

Requirements say *what*, not *how*. Leakage constrains engineering and design without justification.

| Leaks a solution | Requirement |
|---|---|
| Add a dropdown with all projects | A user can choose which project the item belongs to when creating it |
| Store exports in S3 with a 7-day TTL | Export files remain downloadable for at least 7 days, then are deleted |
| Use WebSockets for live updates | Changes by other users appear within 2 s without a page reload |

Exception: when a constraint is real (contract, platform policy, existing API commitment), state it as a constraint
with its reason: "Must use the existing `/v2/exports` endpoint (partner contract, see link)."

## Priorities (MoSCoW)

- **Must**: release is pointless or unsafe without it. Aim for ≤ 60% of effort in Musts.
- **Should**: important, painful to omit, but a workaround exists.
- **Could**: nice to have; first to cut when the schedule slips.
- **Won't (this release)**: considered and explicitly deferred. List them; it prevents re-litigating.

Test each Must: "If this were missing on launch day, would we delay the launch?" If not, it is a Should.

## Non-functional categories to check

Walk this list and write an NFR for each that applies, or note "no change from baseline":

- Performance (latency, throughput, page weight)
- Scalability (data volume, tenants, concurrency)
- Availability and recovery (SLO, RPO/RTO for new data)
- Security and permissions (roles, audit logging)
- Privacy and data retention (PII fields, deletion, residency)
- Accessibility (WCAG 2.2 AA for new UI)
- Localisation (languages, date/number/currency formats, RTL)
- Compatibility (browsers, OS versions, API versioning, backwards compatibility)
- Observability (events to track for the success metrics, alerts)

## Review pass before handing over

- [ ] Every FR has an ID, priority, acceptance criteria and source.
- [ ] No adjectives without numbers ("fast", "simple", "robust", "intuitive", "seamless").
- [ ] No implementation nouns (table names, frameworks, UI widgets) unless stated as a justified constraint.
- [ ] Error, empty and permission-denied states are covered.
- [ ] Analytics events needed to measure the success metric are an NFR.
- [ ] Musts are a minority of total effort; Won'ts are listed.
- [ ] Ambiguous terms are defined once in a glossary ("active user", "workspace", "export").

## Pitfalls

- Requirements copied from a competitor's feature list without a user source.
- "The system shall handle errors gracefully": specify which errors and what the user sees.
- Acceptance criteria that restate the requirement instead of describing a test.
- Hidden scope in examples ("e.g. CSV, XLSX, PDF") that engineering reads as all three. Be explicit.
