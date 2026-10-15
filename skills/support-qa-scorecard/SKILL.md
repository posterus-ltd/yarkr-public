---
name: support-qa-scorecard
description: Review support conversations against a weighted QA scorecard (accuracy, resolution, process, communication, empathy) with auto-fail criteria, and write specific coaching feedback for the agent. Use when grading tickets or chats for quality assurance, calibrating reviewers, designing a QA rubric, or giving support agents feedback.
---

# Support QA scorecard

QA reviews a sample of conversations to answer: did the customer get a correct, complete resolution, handled the way
we want, and what should this agent do differently next time?

## Scorecard (example; adapt weights to your team)

| Category | Weight | Criteria | Scoring |
|---|---|---|---|
| **Accuracy** | 30 | Information and steps are correct for the customer's plan, settings and current product | 0 / 15 / 30 |
| **Resolution** | 25 | Solved the actual problem or set a correct next step; answered every question; no unnecessary back-and-forth | 0 / 12 / 25 |
| **Process** | 15 | Correct tags, priority, macros used appropriately, escalation done properly, internal notes, verification steps | 0 / 8 / 15 |
| **Communication** | 15 | Clear, scannable, correct grammar, right length, no jargon, matched customer's language | 0 / 8 / 15 |
| **Empathy & ownership** | 15 | Acknowledged impact, owned next steps, appropriate tone (see support-tone-empathy) | 0 / 8 / 15 |

Three levels per category (Not met / Partly met / Met) keep reviewers consistent; finer scales drift.

**Auto-fail** (score 0 for the conversation regardless of other categories):
- Shared another customer's data or sensitive data without verification.
- Took a security-relevant action (password reset, email change, ownership transfer) without identity verification.
- Gave dangerous or materially wrong information (e.g. instructions that delete data).
- Rude, dismissive or discriminatory language.
- Promised something unauthorised (refund, feature, date) that the company must now honour or retract.

## Review procedure

1. **Read the full conversation** including internal notes, tags and time stamps, and the customer's account context.
2. **Determine the correct answer** independently (docs, policy, product) before judging the agent's.
3. **Score each category** with a one-line justification quoting the conversation.
4. **Check auto-fails.**
5. **Write feedback**: one strength, one or two improvements (most impactful first), each with a concrete rewrite or
   action. Feedback on the conversation, not the person.
6. **Mark root causes outside the agent's control** (wrong macro, outdated doc, product bug, policy gap) separately so
   they go to the right owner instead of penalising the agent.

## Sampling

- Random sample per agent per week (e.g. 3-5 conversations) for fairness, plus targeted samples: low CSAT, reopened,
  escalated, long handle time, new macros.
- Report targeted and random samples separately; targeted samples are biased low by design.

## Calibration

- Monthly, all reviewers score the same 5-10 conversations independently, then compare.
- Discuss any category where scores differ by more than one level; record the agreed interpretation in a rubric notes
  doc.
- Track inter-reviewer agreement; if it's low, the rubric wording needs fixing, not the reviewers.

## Output per conversation

```markdown
**Ticket:** #48213 | **Agent:** Tom | **Reviewer:** <name> | **Date:** 2026-10-16 | **Sample:** random
**Score:** 82/100 | **Auto-fail:** none

| Category | Score | Evidence |
|---|---|---|
| Accuracy | 30/30 | Correct CSV workaround for multi-currency accounts |
| Resolution | 12/25 | Didn't answer the second question about re-running failed syncs |
| Process | 15/15 | Escalated with full repro and linked bug |
| Communication | 10/15 | Steps in a paragraph; hard to follow |
| Empathy | 15/15 | Acknowledged month-end impact specifically |

**Strength:** The escalation note had reproduction steps and request IDs; engineering confirmed within an hour.
**Improve:** 1) Answer every question: add "Once the fix is out I'll re-run your failed syncs" 2) Put the CSV
workaround steps in a numbered list.
**Non-agent issues:** Macro "[Integrations] Sync error" lacks the multi-currency workaround → owner: integrations macro owner.
```

## Pitfalls

- Scoring tone while missing that the answer was wrong; accuracy first.
- Feedback like "be more empathetic" with no example.
- Penalising agents for following an outdated macro or policy; fix the source.
- Reviewing only bad tickets and calling it a quality score.
- Using QA scores as the sole performance measure; they're for coaching.
