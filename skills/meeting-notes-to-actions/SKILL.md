---
name: meeting-notes-to-actions
description: Turn raw meeting notes or transcripts into decisions, action items with owners and due dates, and open questions. Use when given notes, a transcript (Zoom, Teams, Meet, Otter) or a recording summary and asked for actions, takeaways, minutes or next steps.
---

# Meeting notes to actions

Extract what the meeting **committed to**, not a summary of what was said. Every output line must be traceable to the
notes; never invent owners, dates or decisions.

## 1. Prepare the source

- Identify speakers. In transcripts, map labels ("Speaker 2", initials) to names using introductions, the invite or
  context; if unsure, keep the label and flag it.
- Note the meeting date: you need it to resolve "Friday", "next week", "end of month" into real dates.
- Skim for structure: agenda items, topic shifts, "so to summarise", "let's agree", "can you…".

## 2. Extract four things

**Decisions** — a choice the group (or its decision owner) made. Signals: "we'll go with", "agreed", "let's do",
"final answer", "approved", "we're not going to". Record *what* was decided, *who* decided, and a one-line *why* if
stated. A preference voiced by one person without agreement is not a decision.

**Action items** — a specific person committed to a specific deliverable. Signals: "I'll", "can you … — sure",
"<name> to …", "let me take that". Each needs:
- **Owner**: one named person. "The team" or "we" is not an owner; if no one took it, list it under open questions as
  "needs owner".
- **Action**: starts with a verb, concrete enough to know when it's done ("Send revised pricing deck to Acme", not
  "Pricing").
- **Due**: an absolute date. Convert relative dates using the meeting date. If none was given, write `no date set` —
  do not make one up.
- **Source**: a short quote or timestamp so the owner can check context.

**Open questions** — raised but not resolved, or resolved conditionally ("depends on legal"). Note who is expected to
answer, if anyone.

**Risks / blockers** — explicitly raised obstacles, dependencies on other teams, deadlines at risk.

## 3. Disambiguate carefully

- "We should look into X" with no one volunteering → open question ("needs owner"), not an action.
- "Maybe Sam could…" without Sam agreeing → flag as `proposed — owner not confirmed`.
- Conflicting statements later in the meeting override earlier ones; keep the final position and mention the change
  only if it matters.
- Sarcasm, hypotheticals and examples ("say we dropped the feature…") are not decisions.
- Transcription errors: names and numbers are most often wrong. If a figure looks implausible, flag it `[check]`.
- Merge duplicates (the same action restated at the end) into one line.

## 4. Output format

```markdown
## <Meeting> — <YYYY-MM-DD>

### Decisions
1. <Decision>. — decided by <name>; rationale: <one line, if stated>

### Action items
| # | Owner | Action | Due | Source |
| - | ----- | ------ | --- | ------ |
| 1 | Priya | Send revised SOW to Acme legal | 2026-10-23 | "I'll get the SOW over by Friday" (12:40) |
| 2 | Tom | Confirm Q1 headcount with finance | no date set | "Tom, can you check with finance?" — "Yep" |

### Open questions
- <Question> — needs owner / expected from <name>

### Risks & blockers
- <Risk> — raised by <name>

### Flags
- Speaker 3 unidentified; owner of action 4 inferred from context — please confirm.
```

Keep it tight: decisions and actions first, no narrative recap unless asked. If the user wants tracker input (Jira,
Asana, Linear, a CSV), emit one row per action with the same fields.

## 5. Quality checklist

- [ ] Every action has exactly one owner and a verb-first description.
- [ ] Every date is absolute (YYYY-MM-DD) or explicitly `no date set`.
- [ ] Nothing appears that isn't supported by the notes; uncertain items are flagged, not smoothed over.
- [ ] Decisions are distinct from actions (a decision may spawn actions — list both).
- [ ] Sensitive remarks (HR, personal, off-the-record) are left out unless the user asks.

## Pitfalls

- Listing discussion topics as "actions".
- Assigning the action to whoever spoke most about it.
- Silently resolving "next Tuesday" when the meeting date is unknown — ask, or leave the relative phrase and flag it.
- Over-long minutes: if it's longer than the notes' key content, cut.
