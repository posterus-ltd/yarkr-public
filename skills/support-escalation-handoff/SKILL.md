---
name: support-escalation-handoff
description: "Escalate a support ticket to engineering, tier 2, account management or another team with a complete handoff: summary, impact, reproduction steps, evidence, what was tried and the exact ask. Use when a ticket can't be solved at the current tier, when writing an escalation note or internal Jira/Linear issue from a ticket, or when deciding whether to escalate."
---

# Support escalation handoff

A good escalation lets the receiving team act without reading the ticket thread or going back to the customer. A bad
one costs a day of back-and-forth while the customer waits.

## When to escalate

Escalate when at least one is true:
- Reproducible bug or suspected bug that support can't fix through configuration.
- Data issue that needs backend access (missing, corrupted or wrongly attributed data).
- Security concern (suspected compromise, vulnerability report): escalate to security immediately via the
  designated channel; don't wait to gather more.
- Billing action beyond tier-1 permissions (manual refunds above limit, contract terms).
- Customer at risk (exec involvement, churn threat on a large account): loop in account owner.
- SLA at risk and the blocker sits with another team.

Don't escalate (yet) when: the issue is documented with a fix, you haven't checked the known-issues list and status
page, or you're missing basic info the customer can supply within the SLA window.

## Before escalating: checklist

- [ ] Searched known issues / existing bug tracker for duplicates (link it if found; add this customer as affected).
- [ ] Checked status page and incident channel.
- [ ] Reproduced it yourself, or recorded why you couldn't.
- [ ] Collected identifiers: account/org ID, user ID/email, workspace/project IDs, request IDs, timestamps with
      timezone, browser/app version, OS, region.
- [ ] Collected evidence: screenshots, screen recording, console/network errors, HAR (with secrets/tokens redacted),
      logs.
- [ ] Recorded what was tried and the result.
- [ ] Customer has been told it's escalated and when they'll hear next.

## Escalation note template

```markdown
**Summary:** <one line: what's broken, for whom, since when>
**Severity / priority:** S2 / P2 (reason: whole team blocked, workaround partial)
**Impact:** 1 account (Enterprise, ARR tier A), 40 users; month-end close at risk. Other affected tickets: #48190, #48201
**Customer:** org_8812 (acme-corp), requester jane@acme.com; ticket #48213
**Environment:** Web app, Chrome 129, macOS; EU region; Xero integration v2

**Steps to reproduce**
1. Log in as a user with multi-currency enabled
2. Invoices → select any invoice in EUR → "Sync to Xero"
3. Observe error toast "Sync failed (SF-403)"

**Expected:** invoice appears in Xero within 1 min
**Actual:** error toast; nothing in Xero. Started 2026-10-15 ~08:00 UTC (first ticket), worked on 2026-10-14.

**Evidence:** request ID req_7f3a..., screenshot, HAR (redacted) attached; log excerpt below
**Reproduced by support:** yes, on test org org_test_12 with multi-currency on; not with it off
**Tried:** reconnecting Xero (no change), different browser (no change)
**Workaround given:** CSV export + manual import

**Ask:** confirm root cause and ETA for fix; can failed syncs be re-run automatically after the fix?
**Next customer update due:** 2026-10-16 15:00 UTC (owner: Tom)
```

## Rules

- **Facts vs hypotheses:** label guesses ("Possibly related to yesterday's release 4.12"). Don't present them as findings.
- **Quantify impact:** accounts, users, revenue tier, deadlines. Impact decides how fast engineering moves.
- **One escalation per issue.** If several customers report it, link their tickets to one issue rather than opening many.
- **Redact secrets and unnecessary personal data** (tokens, passwords, card numbers, full addresses) from notes and
  attachments.
- **Make the ask explicit:** fix, investigate, data correction, approval, ETA, or a call with the customer.
- **Stay the owner of the customer relationship** unless explicitly handed over. Keep updating the customer on the
  agreed cadence even if engineering is silent; chase engineering before the update is due.
- **Close the loop:** when engineering responds, translate the outcome for the customer and record the resolution.

## Pitfalls

- "Customer says it's broken, please check" with no steps, IDs or timestamps.
- Pasting the whole thread instead of a summary.
- Escalating to an individual engineer by DM instead of the team's intake channel; it gets lost when they're away.
- Promising the customer a fix date before engineering commits to one.
- Escalating the same issue into several tools (Slack, Jira, email) without linking them.
