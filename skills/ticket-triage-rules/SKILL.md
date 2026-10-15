---
name: ticket-triage-rules
description: Classify incoming support tickets by type, product area, severity and routing queue using explicit rules, and handle duplicates, spam and multi-issue tickets. Use when triaging a support inbox, designing triage rules or tags for a helpdesk, or auditing why tickets end up in the wrong queue.
---

# Ticket triage rules

Triage turns an unstructured message into four fields (type, product area, severity, queue) plus a one-line reason,
fast and consistently. Consistency matters more than cleverness: two triagers should produce the same labels.

## Fields

**Type** (pick one; the customer's main ask decides):

| Type | Signal |
|---|---|
| `bug` | Something that used to work or is documented to work doesn't: errors, wrong data, crashes |
| `how-to` | Customer wants to do something the product supports; needs guidance |
| `feature-request` | Product doesn't do it and isn't documented to |
| `billing` | Charges, invoices, refunds, plan changes, payment failures |
| `account-access` | Login, 2FA, SSO, password, locked account, ownership transfer |
| `data-request` | Export, deletion, privacy/GDPR/CCPA requests |
| `security-report` | Suspected vulnerability, compromised account, phishing using our brand |
| `feedback` | Opinion without a request |
| `spam` / `not-support` | Sales pitches, auto-replies, misdirected mail |

**Product area**: use the team's fixed list (e.g. `editor`, `integrations`, `api`, `mobile`, `billing`, `auth`).
Choose by where the symptom appears, not where you guess the cause is.

**Severity** (impact, independent of who the customer is):

| Severity | Definition |
|---|---|
| S1 | Production down or data loss/corruption or security incident for the customer; no workaround |
| S2 | Core workflow blocked for multiple users, or one user fully blocked; no reasonable workaround |
| S3 | Feature degraded or a workaround exists |
| S4 | Question, cosmetic issue, request |

Priority (which combines severity with plan/SLA) is set by ticket-priority-sla, not here.

**Queue**: a lookup from (type, area, severity), e.g.

| Condition | Queue |
|---|---|
| `security-report` (any) | Security (immediately; don't reply with details publicly) |
| `data-request` | Privacy (legal deadlines apply) |
| `billing` | Billing |
| S1 any area | Tier 2 + incident check |
| `bug` S2-S3 | Tier 2 for the area |
| `how-to`, S4 | Tier 1 |
| `feature-request` | Tier 1 (log to product feedback tool) |

## Procedure

1. **Read the whole ticket** including attachments, subject and the latest message in a thread. Customers often put
   the real problem in the last line.
2. **Check for known incidents** on the status page / incident channel. If it matches, tag `incident:<id>` and route
   to the incident macro queue.
3. **Check for duplicates** from the same requester or org in the last 7 days; merge rather than double-handling.
4. **Pick type**, then area, then severity, using the tables. When unsure between two severities, pick the higher
   one and say why; downgrading later is cheaper than missing an outage.
5. **Multi-issue tickets:** triage on the most severe issue, list the others in the note, and split into separate
   tickets if they go to different queues.
6. **Write a reason** in one line citing evidence: "S2: 'none of our 40 agents can log in since 9:00' (SSO, Okta)."
7. **Flag missing info** needed by the next person (account ID, browser, timestamps, screenshots) so the first reply
   can ask for it.

## Keyword hints (signals, not rules)

- S1 hints: "down", "outage", "all users", "data missing", "deleted", "charged twice for everyone", "breach", "hacked".
- Billing hints: "invoice", "refund", "charge", "card declined", "VAT", "receipt".
- Access hints: "can't log in", "2FA", "locked out", "SSO", "reset link".

Keyword matches must be confirmed by reading; "Is my data deleted if I cancel?" is a how-to, not S1.

## Output per ticket

```yaml
ticket: 48213
type: bug
area: integrations
severity: S2
queue: tier2-integrations
reason: "Salesforce sync failing for whole team since 2026-10-15 08:00 UTC; error SF-403 in screenshot"
incident: none
duplicates: [48190]
missing_info: [salesforce org id]
```

## Pitfalls

- Using customer anger or plan size to set severity. Severity is impact; plan affects priority.
- Routing by guessed root cause ("probably the API") instead of symptom area.
- Tagging security reports into normal queues where details get pasted into public replies.
- Letting `other` become the largest category; review it weekly and add rules.
- Ignoring language: route non-default-language tickets to a queue that can answer them, or flag translation.
