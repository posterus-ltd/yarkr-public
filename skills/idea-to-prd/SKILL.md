---
name: idea-to-prd
description: Turn a rough product idea into a PRD markdown file by brainstorming how to extend and sharpen it, then interviewing the user in short multiple-choice survey rounds until scope is clear. Use when the user shares an app or feature idea, a one-line pitch or a messy brain dump and wants it refined, scoped or written up as a PRD, product brief or requirements doc, or says "help me think this through" before building. First step of idea → PRD → prototype → spec (followed by prd-prototype, then prototype-to-spec).
---

# Idea to PRD

Take a rough idea, widen it on purpose, then narrow it with the user's answers until it's a PRD someone can prototype
from. The agent does the thinking work (options, trade-offs, defaults); the user only makes choices.

Output: `docs/PRD.md` (or the path the user names). The next skill, `prd-prototype`, builds a clickable mock from it.

## 1. Capture

1. Quote the user's idea verbatim into a scratch note; it goes into the PRD's *Origin* section unchanged.
2. Restate it back in 2–3 sentences: who it's for, what problem it solves, what the user does with it.
3. List your **assumptions** (5–10 one-liners) — every gap you filled silently. These seed the survey.

Don't ask anything yet. One question before exploring wastes the user's first impression on something you could
have proposed.

## 2. Explore

Brainstorm along these dimensions. Spend the effort here; it's what makes the survey options good.

| Dimension | Ask yourself |
| --- | --- |
| Users | Who are the 1–3 distinct user types? Who pays, who uses, who administers? |
| Problem / job | What are they doing today instead? What's painful or slow about it? |
| Core loop | The one action users repeat. What triggers it, what's the payoff? |
| Extensions | What would make it 2× more useful? Collaboration, automation, history, sharing, mobile, integrations, AI assist |
| Differentiator | Why this over the obvious alternative (spreadsheet, existing tool, doing nothing)? |
| Content & data | What objects exist (entities), who creates them, how many? |
| Edges | Empty state, first run, errors, permissions, deletion, offline, multi-language |
| Business | How it makes or saves money; what success looks like in numbers |
| Risks | What would make users not adopt it; what's legally or technically scary |

Sort ideas into three buckets: **Core** (the idea doesn't work without it), **Extensions** (valuable, optional),
**Stretch** (interesting, probably later). Show the user a compact *exploration map* — the restatement, the three
buckets as bullet lists, the top 3 risks — at most ~25 lines. Then start the survey.

## 3. Survey

Build a question backlog from the assumptions and the exploration, then interview in rounds.
Question bank by dimension: [references/question-bank.md](references/question-bank.md).

**Rank** each question by how much the answer changes scope or the shape of the product. Ask the top ones; for the
rest, pick a default and write it in the PRD as an assumption.

**Round rules**
- ≤ 4 questions per round, one theme per round. Use the harness's structured question tool (Claude Code:
  `AskUserQuestion`) when it exists; otherwise a numbered list with lettered options the user can answer as `1b 2a 3c`.
- Every question offers 2–4 concrete options, your recommended one first and marked "(Recommended)", each with a
  one-line consequence. The user can always answer in free text.
- Use multi-select for "which of these extensions are in v1".
- Never ask what the user already said, what you can default sensibly, or what the prototype will answer better
  (exact layout, wording, colours).
- After each round, reflect back in one or two lines what changed ("Dropped team accounts; v1 is single-user.") and
  update the assumption list.

**Typical rounds** (adapt; skip what's already clear):
1. Users and problem — primary user, current workaround, context of use (device, frequency).
2. Scope — multi-select over Extensions; pick the v1 cut; confirm what's explicitly out.
3. Behaviour — the 2–4 decisions inside the core loop (e.g. "what happens when two people edit the same item").
4. Success and constraints — success metric, deadline, platforms, must-use or must-avoid tech, compliance.

**Stop** when the remaining questions only affect details the prototype will reveal, or after 4–5 rounds. Say
what's still open; it goes into the PRD's Open questions, not into more rounds.

## 4. Write the PRD

Use [references/prd-template.md](references/prd-template.md). Rules:

- Requirements are numbered (`FR-1`, `NFR-1`) and testable, each with a priority: **Must / Should / Could**. IDs are
  never reused; the prototype and spec reference them.
- Describe behaviour, not implementation. "Users get notified when a task is assigned" — not "send a push via FCM".
  Tech wishes the user volunteered go under *Constraints*.
- User flows as numbered steps, one per key journey (3–6 flows). These become prototype screens.
- Every Extension and Stretch idea from section 2 ends up either in scope or in *Out of scope* with a one-line reason.
- Assumptions you defaulted are listed and marked as such, so the user can overrule them later.
- Keep it short: 1–3 pages. A PRD nobody finishes reading isn't a spec.

## 5. Review

Give the user a summary (≤ 10 lines: v1 scope in one sentence, Must count, biggest open question) and the file path.
Ask one final question: accept as Draft v1, or change something. Apply edits, set `Status: Draft v1`, add a changelog
row. Then suggest the next step: build a prototype with `prd-prototype`.

## Pitfalls

- Interviewing before exploring: questions become "what features do you want?", which pushes the work back to the user.
- Open-ended questions ("Tell me about your users"): slow, vague answers. Offer options; free text stays possible.
- 10-question rounds: the user skims and picks defaults. Four, focused.
- Solution leakage into requirements (named libraries, databases, endpoints). That's the spec phase's job.
- Silent scope growth: brainstormed extensions creeping into Must without the user picking them.
- Inventing metrics targets. If the user has no number, write the metric and "target: TBD after launch baseline".

## Checklist

- [ ] Original idea quoted verbatim in *Origin*.
- [ ] Exploration map shown before the first question.
- [ ] Every survey question had options with a recommendation; rounds ≤ 4 questions.
- [ ] All FR/NFR numbered, testable, prioritised; no implementation details.
- [ ] 3–6 user flows as numbered steps.
- [ ] Out of scope, assumptions and open questions sections filled (or explicitly "none").
- [ ] Status and changelog set; next step (`prd-prototype`) offered.
