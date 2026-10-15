---
name: ticket-to-bug-report
description: Turn one or many customer support tickets into an actionable bug report with a precise title, reproduction steps, expected vs actual behaviour, environment, evidence and a list of affected accounts. Use when filing a bug in Jira, Linear or GitHub Issues from support tickets, or when consolidating duplicate tickets about the same defect.
---

# Ticket to bug report

Customers describe symptoms in their own words; engineers need a reproducible defect. Your job is translation:
strip the narrative, keep the facts, make it reproducible, and quantify who is affected.

## Procedure

1. **Extract the symptom** from the ticket in one sentence, in product terms: what action, what result, what was
   expected.
2. **Check for an existing bug** in the tracker (search error codes, feature names, symptom words). If found, add
   this ticket to its affected-accounts list instead of filing a new one.
3. **Reproduce it** on a test account with the same plan, settings, region and client. Narrow the conditions: which
   settings, data shapes or roles trigger it, and which don't. A minimal reproduction is worth more than any other
   field.
4. **Collect environment and evidence**: app/version, browser/OS/device, region, integration versions, request IDs,
   error codes, timestamps (UTC), screenshots/recordings, console and network errors (redact tokens and personal data).
5. **Determine first-seen time** (earliest ticket, or customer statement) and check what changed around then
   (releases, config changes). Note correlations as hypotheses.
6. **Quantify impact**: number of tickets, accounts, users, plan tiers, any revenue or deadline exposure.
7. **Write the report** in the template below and link every source ticket.

## Template

```markdown
Title: [Area] <Action> <fails/produces wrong result> when <condition>
e.g. [Xero sync] Syncing EUR invoices fails with SF-403 when multi-currency is enabled

**Summary**
One or two sentences: the defect and its impact.

**Steps to reproduce**
1. On an account with <settings>, as a <role> user
2. Go to <screen> and <action with exact data>
3. <action>

**Expected result:** <what should happen, with reference to docs/spec if available>
**Actual result:** <what happens; exact error text/code>
**Reproducibility:** Always / Intermittent (3 of 10 attempts) / Could not reproduce (see notes)

**Conditions**
- Happens with: multi-currency on; EUR and GBP invoices
- Does not happen with: single currency; USD invoices
- First seen: 2026-10-15 08:00 UTC (release 4.12 deployed 07:40 UTC; possible correlation)

**Environment:** Web, Chrome 129 / Safari 18; EU region; Xero integration v2
**Evidence:** request IDs, screenshots, redacted HAR, log lines

**Impact**
- Tickets: #48213, #48190, #48201 (3)
- Accounts: org_8812 (Enterprise), org_1290 (Business), org_7731 (Business)
- Workaround: CSV export + manual import (slow; ~30 min per close)

**Support notes:** customer update cadence, any promised follow-up
```

## Title rules

- Include area, action, failure and condition. Engineers triage from titles.
- No customer names, no "URGENT", no "doesn't work".
- Use the exact error code or message if there is one.

| Weak | Strong |
|---|---|
| Sync broken for Acme!!! | [Xero sync] EUR invoices fail with SF-403 when multi-currency enabled |
| Export not working | [Export] CSV export times out for date ranges > 90 days (504 after 60 s) |

## Severity guidance (bug, not ticket)

- Data loss/corruption, security, or core workflow broken for many: critical/high.
- Core workflow broken for a subset with no workaround: high.
- Workaround exists or edge case: medium.
- Cosmetic: low.
Let engineering own final priority; support supplies impact data that justifies it.

## Keeping it current

- When new tickets arrive for the same bug, append to the affected list and update the count; don't open duplicates.
- When status changes (fixed, released), tell support owners of linked tickets so they can notify customers.

## Pitfalls

- Copying the customer's guess about the cause into the summary as fact.
- Steps that depend on the customer's private data with no generic equivalent; describe the data shape instead.
- Missing "does not happen with" conditions; they're the fastest path to root cause.
- Feature requests filed as bugs. If the product works as designed/documented, it's a request; route it to product.
- Leaving personal data (emails, names, addresses) in screenshots or logs in a broadly visible tracker.
