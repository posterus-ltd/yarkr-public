---
name: support-macro-writing
description: Write and maintain support macros (canned responses / saved replies) that are accurate, personalised with placeholders, easy to adapt per ticket, and owned and reviewed. Use when creating new macros, rewriting stale or robotic ones, auditing a macro library, or drafting a reply from an existing macro.
---

# Writing support macros

A good macro saves time without making the reply sound canned. It is a starting draft with the right facts and
links, built so the agent must personalise the parts that differ per ticket.

## Anatomy

```text
Name: [Billing] Refund approved - annual plan, within 30 days
Owner: billing-team | Last reviewed: 2026-09-30 | Used for: refund requests eligible under policy §2
Actions: set status Pending; add tag refund-approved; set field refund_amount

Hi {{ticket.requester.first_name}},

[PERSONALISE: one sentence acknowledging their reason for cancelling]

I've processed a refund of {{refund_amount}} to the card ending {{card_last4}}. It usually appears within
5-10 business days, depending on your bank.

Your workspace stays active until {{period_end_date}}; after that, data is kept for 30 days so you can export it
(Settings → Export).

[OPTIONAL: if they mentioned a missing feature, link the roadmap/feedback page]

{{current_user.first_name}}
```

## Rules

1. **One scenario per macro.** "Refund approved - annual, within 30 days" and "Refund declined - outside window" are
   separate macros. A macro with "if X then... otherwise..." will be sent with both branches.
2. **Naming convention:** `[Category] Outcome - condition`. Agents search by name; make it predictable.
3. **Placeholders for anything variable:** helpdesk variables for known fields; bracketed, uppercase `[PERSONALISE: ...]`
   markers for things the agent must write. Configure a send check or QA rule that flags `[PERSONALISE` left in.
4. **Lead with the answer**, then steps, then next step. Same structure as any good reply (see support-tone-empathy).
5. **Facts must be sourced:** link the help article or policy page rather than restating long policy; restate only the
   1-2 facts the customer needs.
6. **Steps as numbered lists** with exact UI labels in bold or quotes, matching the current product UI.
7. **Neutral, warm, short.** Under ~150 words for most macros. No "We apologise for any inconvenience."
8. **Include the ticket actions** (status, tags, fields, assignee) so reporting stays consistent.
9. **Owner and review date** on every macro; review at least quarterly and on every related product or policy change.

## Writing procedure

1. Pull 20-50 recent tickets for the scenario and the best replies agents actually sent (high CSAT, no follow-up).
2. Extract the common facts, steps and next steps; note what varied (that becomes placeholders).
3. Draft; check every UI label and link against the live product.
4. Have one agent who handles this scenario and the policy owner review it.
5. Publish with tags and actions; announce in the team channel with when to use it.
6. After 2-4 weeks, check usage, reopen rate and CSAT for tickets using the macro.

## Auditing a macro library

For each macro, record usage (last 90 days), last reviewed date, owner, and outcome metrics if available. Then:

- Unused 90+ days → archive.
- Overlapping macros → merge, keep the better-performing wording.
- Reopen rate or low CSAT above team average → rewrite (often missing a step or an answer to the obvious follow-up).
- Outdated UI labels, prices, links → fix immediately; these are the most damaging errors.

## Adapting a macro to a ticket

- Replace every `[PERSONALISE]` marker; delete optional blocks that don't apply.
- Answer anything else the customer asked; a macro answers one question, the ticket may have three.
- Check the facts match their account (plan, region, dates, amounts).
- Read it once as the customer before sending.

## Pitfalls

- Macros that answer the question before the one asked (e.g. reset-password macro to an SSO user).
- Placeholder variables that render empty (`Hi ,`); use your helpdesk's fallback/default syntax where available and
  test-render the macro on a ticket with missing fields.
- Hard-coded dates, prices or version numbers with no review cadence.
- Internal jargon or ticket-system language leaking to customers.
- Hundreds of near-duplicate personal macros; keep shared macros the source of truth.
