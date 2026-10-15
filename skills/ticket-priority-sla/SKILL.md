---
name: ticket-priority-sla
description: Set ticket priority and SLA targets from severity and customer plan, compute due times, and flag tickets at risk of breaching first-response or resolution SLAs. Use when designing a priority/SLA matrix, prioritising a queue, or reviewing a backlog for SLA risk.
---

# Ticket priority and SLAs

Priority decides order of work. It combines **severity** (impact, from triage) with **entitlement** (what the
customer's plan or contract promises). SLAs turn priority into deadlines.

## Priority matrix (example; replace with your contract terms)

| Severity \ Plan | Enterprise | Business | Starter / Free |
|---|---|---|---|
| S1 | P1 | P1 | P2 |
| S2 | P2 | P2 | P3 |
| S3 | P3 | P3 | P4 |
| S4 | P4 | P4 | P4 |

Overrides (apply after the matrix, record the reason):
- Security incident or suspected breach: P1 regardless of plan.
- Legal/privacy request with a statutory deadline: at least P2, with the legal due date as a hard deadline (e.g.
  GDPR access requests: one month from receipt, extendable in limited cases; confirm with your privacy team).
- Known incident already being handled: link to incident; priority follows the incident, not each ticket.
- Customer in renewal or at-risk flag: may raise by one level if your policy allows; never above P1 rules.

## SLA targets (example)

| Priority | First response | Next update cadence | Resolution / workaround target | Hours |
|---|---|---|---|---|
| P1 | 1 h | every 2 h | 8 h workaround | 24/7 |
| P2 | 4 h | daily | 3 business days | business hours |
| P3 | 1 business day | every 3 days | 10 business days | business hours |
| P4 | 2 business days | on change | best effort | business hours |

Define precisely:
- **First response**: first public, human (or approved) reply that addresses the issue; auto-acknowledgements don't count.
- **Clock pauses**: when status is "pending customer" (waiting on their info); resumes when they reply.
- **Business hours and calendar**: timezone of the customer's region or the support hub; list holidays.

## Computing due times

1. Start = ticket created (or priority raised; your tool's convention, but be consistent).
2. Add the target in the applicable calendar (24/7 or business hours, skipping holidays).
3. Subtract paused time.
4. At-risk threshold: flag when ≥ 75% of the window has elapsed with no qualifying response.

Example: P2 created Friday 16:00 local, business hours 09:00-17:00 Mon-Fri, target 4 h → 1 h on Friday, 3 h on
Monday → due Monday 12:00.

## Queue review procedure

1. Pull open tickets with priority, created time, last public reply, status, assignee.
2. Compute time remaining to the next SLA event for each.
3. Sort: breached first, then at-risk (≥ 75%), then by due time; P1 always on top.
4. For each at-risk ticket, say what unblocks it: needs assignee, waiting on engineering, waiting on customer
   (should be paused), needs a holding update.
5. A holding update is acceptable for "next update" SLAs only if it contains new information or a concrete next step
   and time.

## Output

```markdown
## SLA risk report: <queue> (<timestamp, tz>)
Breached: <n> | At risk: <n> | On track: <n>

| Ticket | Priority | SLA event | Due | Remaining | Status | Owner | Action |
|---|---|---|---|---|---|---|---|
| 48213 | P2 | First response | 2026-10-16 12:00 | -0:40 (breached) | New | unassigned | Assign tier2-integrations now |
```

## Pitfalls

- Letting customers set priority directly; take their urgency as input, not the answer.
- Priority inflation: if > 20% of tickets are P1/P2, the matrix or triage is miscalibrated.
- Pausing clocks on "pending" status when the next action is actually ours.
- Measuring only first response; long resolution times drive CSAT more.
- Forgetting timezone and holiday calendars when computing business-hours SLAs.
- Contractual SLAs differ per customer: check account-specific terms before quoting a deadline to the customer.
