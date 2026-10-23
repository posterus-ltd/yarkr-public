# Feedback loop

## FEEDBACK.md format

```markdown
# Prototype feedback

## Round 2 — 2026-10-23

| ID | Screen | Feedback (user's words) | Type | Decision | PRD |
| --- | --- | --- | --- | --- | --- |
| F-9 | /board | "I expected to drag cards between columns" | Change | Drag between columns added | FR-4 edited |
| F-10 | /board | "Can I see who's online?" | New | Later | Out of scope + reason |
| F-11 | /settings | "Too many options" | Polish | Collapsed advanced settings | — |
| F-12 | /invite | "Should guests see costs?" | Question | Asked → No, guests hide costs | FR-13 added |
```

- IDs run across rounds (`F-1` … never restart).
- Keep the user's words; your interpretation goes in *Decision*.
- *PRD* column names the exact FR/NFR touched, or `—`.

## Triage hints

- "I didn't find X" → usually Polish (navigation, labelling). If X isn't in the PRD, it's New.
- "This should work differently" → Change if it contradicts an FR's wording; Polish if the FR allows both.
- "What if …" → Question; build the likely answer behind a toggle when cheap, and ask.
- A Change that reverses a decision the user made in the PRD interview → say so: "In round 2 of the PRD survey you
  chose single-user; this needs shared boards. Switch v1 to shared?" — don't flip silently.
- Several small Polish items on one screen often hide one Change ("the flow is wrong"). Look for the pattern.

## PRD edit rules

- Edit the requirement text in place; keep the ID. Split = keep old ID for one half, new ID for the other.
- Removed requirement: strike it (`~~FR-6 …~~ removed round 3: see F-14`), don't renumber.
- New requirement: next free ID, priority asked or defaulted (mark "(default)").
- Answered open questions: move the answer into the right section, delete the question row.
- Changelog: one row per round, listing FR ids touched.
- Bump the version per round: Draft v1 → v1.1 → v1.2.

## Round report template

```
Round 2 done — 4 feedback points.
Prototype: drag between columns; advanced settings collapsed; guest view hides costs.
PRD (v1.2): FR-4 edited, FR-13 added, live presence moved to Out of scope.
Still open: whether archived boards count against the plan limit (Q-3).
Try next: move a card to "Done" and check the guest view (switcher → role: guest).
```

## When to stop

The user says it's right, or two rounds in a row produce only Polish. Then offer wrap-up; don't keep polishing a
throwaway.
