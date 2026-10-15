---
name: meeting-recap-email
description: Write short post-meeting recap emails or chat posts with decisions, action items, owners, dates and the next meeting. Use when asked to send a follow-up, recap, summary email or minutes to attendees, stakeholders or a client after a meeting.
---

# Meeting recap email

A recap exists so that people who were there agree on what happened and people who weren't can act on it. It should be
readable in under a minute.

## 1. Inputs

- Decisions and actions (if you only have raw notes, extract them first with the rules in `meeting-notes-to-actions`:
  one owner per action, absolute dates, nothing invented).
- Audience: internal team, executives, external client/partner, or mixed. This drives tone and what to omit.
- Next meeting date/time, if any; links to the deck, recording, notes doc.

## 2. Structure (in this order)

1. **Subject**: `Recap: <meeting> — <date> (<n> decisions, <n> actions)` or, for a client,
   `Follow-up: <topic> — next steps`. Searchable, specific.
2. **One-line purpose/result**: "Thanks all — we agreed the Q1 launch scope and have three follow-ups."
3. **Decisions**: numbered, one line each.
4. **Actions**: owner — action — due date. Bold the owner's name so people scan for themselves.
5. **Open questions**: only those needing someone's input, with whom.
6. **Next meeting**: date, time with timezone, and what it will cover.
7. **Links**: notes, recording, deck. Then a correction prompt: "Reply by Wednesday if I've missed anything."

Skip any empty section rather than writing "None".

## 3. Tone by audience

| Audience | Adjust |
| --- | --- |
| Internal team | Plain, terse, bullet points; first names. |
| Executives | Lead with decisions and anything needing *their* action or awareness; drop process detail; max ~8 lines. |
| Client / external | Courteous opening, restate what *they* agreed to and what *you* owe them with dates; no internal disagreements, pricing internals or other clients' names. |
| Absent stakeholders | Add one sentence of context per decision so it stands alone. |

## 4. Template

```text
Subject: Recap: Platform roadmap review — 16 Oct (2 decisions, 3 actions)

Hi all,

Thanks for the time today. We settled the Q1 scope and have three follow-ups.

Decisions
1. Q1 ships SSO and audit logs; usage-based billing moves to Q2.
2. Beta customers get 30 days' notice before the pricing change.

Actions
- **Priya** — share the revised Q1 plan with sales — Tue 21 Oct
- **Tom** — confirm audit-log retention requirement with Legal — Fri 24 Oct
- **Ana** — draft the beta customer notice — Fri 24 Oct

Open question
- Do we need SOC 2 evidence for audit logs before GA? — Tom to ask Security

Next meeting: Thu 30 Oct, 15:00 CET — review the customer notice and billing design.
Notes and recording: <link>

Reply by Wed if I've missed or misstated anything.
<sender>
```

## 5. Rules

- Under ~200 words for a routine meeting. If longer, move detail into the linked notes.
- Dates as weekday + date ("Fri 24 Oct"); include timezone whenever attendees span zones.
- Never assign actions in the recap that weren't agreed in the meeting; if you need to, phrase it as a request ("Could
  Sam own X? Please confirm").
- Don't quote people verbatim on contentious points; state the outcome.
- For chat (Slack/Teams), use the same order, drop greeting/sign-off, and @-mention owners.
- Send within 24 hours; mention this to the user if they're drafting days later ("consider acknowledging the delay").

## Pitfalls

- A narrative ("We started by discussing…") instead of outcomes.
- Burying the one thing an executive must do in paragraph four.
- Recaps to clients that leak internal notes or reveal negotiating positions.
- Missing the next-meeting line, so momentum dies.
