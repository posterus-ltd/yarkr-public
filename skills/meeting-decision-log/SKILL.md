---
name: meeting-decision-log
description: Keep a running decision log of what was decided, context, alternatives considered, owner, date and revisit trigger. Use when asked to record, track, look up or audit decisions across meetings, or to answer "when/why did we decide X?".
---

# Meeting decision log

Teams forget why they decided things and relitigate them. A decision log is an append-only register that makes each
decision findable, attributable and revisitable on purpose rather than by accident.

## 1. Where it lives

Keep one log per team or programme, in the tool people already open: a Markdown file in the repo
(`docs/decisions.md`), a Notion/Confluence database, or a spreadsheet. If the user has an existing log, read it first and
follow its format and numbering exactly. For engineering architecture choices, suggest ADRs (one file per decision)
instead; this log is for operational/product/business decisions.

## 2. Entry fields

| Field | Content |
| --- | --- |
| **ID** | `D-<sequence>` (D-042). Never reuse or renumber. |
| **Date** | Date decided (YYYY-MM-DD), not date logged. |
| **Decision** | One sentence, stated as the choice: "Use Stripe Billing for invoicing from Q1." |
| **Context** | Why a decision was needed; constraints; 2–4 lines. |
| **Alternatives** | Options considered and why each was rejected (one line each). |
| **Owner** | The single person accountable for the decision (the decider, not the note-taker). |
| **Consulted** | Who gave input. |
| **Status** | `active`, `superseded by D-0xx`, `reversed`, `expired`. |
| **Revisit trigger** | A date or condition: "if churn > 3% for 2 months", "at Q2 planning", "when vendor contract renews 2027-03". |
| **Source** | Link to meeting notes, doc or thread. |

## 3. Adding entries

1. From notes or a recap, take only genuine decisions (a choice was made by someone entitled to make it). Preferences,
   proposals and "let's explore" are not decisions.
2. Check the log for an earlier decision on the same subject. If the new one changes it, add a new entry and set the old
   one's status to `superseded by D-new`; never edit the old decision text.
3. If the alternatives or rationale weren't recorded, write `not recorded` — don't reconstruct reasons that sound
   plausible.
4. Every entry gets a revisit trigger. If the user can't name one, propose a sensible default (next planning cycle) and
   mark it as proposed.
5. Append, in date order. Corrections to an existing entry go in a dated note under it ("2026-10-20: owner corrected
   from Tom to Ana").

### Markdown entry

```markdown
### D-042 — Use Stripe Billing for invoicing from Q1
- **Date:** 2026-10-16 · **Owner:** Ana Ruiz · **Status:** active
- **Context:** Manual invoicing takes 3 days/month; usage-based pricing launches Q2.
- **Alternatives:** Chargebee (higher cost at our volume); keep manual (doesn't scale to usage pricing).
- **Consulted:** Finance, Eng (Priya)
- **Revisit trigger:** if Stripe fees exceed 1.2% of revenue, or at 2027 vendor review
- **Source:** [Roadmap review 2026-10-16](link)
```

## 4. Querying the log

When asked "why did we decide X?" or "what did we decide about Y?":
- Search by keyword across Decision, Context and Alternatives; return the entry ID, date, owner and the chain of
  supersessions (D-012 → D-031 → D-042), newest first.
- If nothing matches, say so; don't infer a decision from unrelated entries.

## 5. Review routine

Monthly or at planning:
- List entries whose revisit trigger date has passed or condition may be met; ask owners to confirm, revise or expire.
- List entries missing owner or trigger.
- Count reversals: frequent reversals on one subject suggest the decision rights or information are unclear.

## Pitfalls

- Logging discussions as decisions, which makes the log noisy and unread.
- Owner = "Leadership team": accountability disappears. Name one person.
- Rewriting history: editing a superseded decision instead of adding a new one.
- No revisit trigger, so stale decisions bind the team indefinitely, or get reopened every meeting.
- Recording confidential HR or legal matters in a widely shared log; keep those in a restricted log and reference only
  the ID.
