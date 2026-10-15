---
name: meeting-agenda-builder
description: Build meeting agendas with a stated outcome, timeboxed items, owners and pre-reads, or recommend cancelling in favour of async. Use when asked to plan, prepare or draft an agenda for a meeting, workshop, 1:1, review or offsite.
---

# Meeting agenda builder

An agenda is a contract: why we meet, what we leave with, who drives each part, what to read first. Build it from the
outcome backwards, and say so when the meeting shouldn't happen at all.

## 1. Gather inputs (ask only for what's missing)

- Purpose in one sentence, and the **outcome**: what exists at the end that didn't before (a decision, a ranked list, a
  signed-off plan, aligned understanding of X).
- Attendees and their roles; who owns the decision (one person, not "the group").
- Duration and format (in person / video / hybrid), and the timezone if attendees span several.
- Material that exists already (docs, dashboards, previous notes, open actions from last time).

## 2. Decide whether to meet at all

Recommend **async instead** (a doc with comments, a recorded walkthrough, a poll) when any holds:

- It's one-way information sharing with no discussion expected.
- The decision owner can decide alone and only needs input: collect it in writing with a deadline.
- Fewer than two items genuinely need live back-and-forth.
- The key decision maker or the necessary information won't be there.

Say it plainly: "This works better async because …; here is the async version." Then offer the async artefact (doc
outline + deadline + who must respond). Still produce an agenda if the user insists.

## 3. Classify each item

Every item is exactly one type, and its type is written on the agenda:

| Type | Ends with | Typical time |
| --- | --- | --- |
| **Decide** | a recorded decision and owner | 15–30 min |
| **Discuss** | options narrowed, or input captured for the owner | 10–25 min |
| **Inform** | questions answered (content is a pre-read) | 5 min max |
| **Generate** | a list of ideas/options (brainstorm) | 15–30 min |

Phrase items as questions or verbs: "Decide: do we ship v2 on 4 Nov or slip to 18 Nov?" not "v2 release".

## 4. Timebox and order

- Allocate the full duration, with **10% buffer** and a final 5 minutes for "decisions and actions recap". A 30-minute
  meeting holds 2–3 real items; a 60-minute meeting 3–5.
- Put the highest-stakes Decide item first or second, while energy and attendance are highest. Never last.
- Inform items go to the pre-read; keep at most one short Inform slot for questions.
- Group items needing a subset of people so others can leave (or join late) — note it on the agenda.
- If items exceed the time, cut or defer rather than compress; list deferred items under "Parked".

## 5. Owners and pre-reads

- Every item has one owner who presents/drives it; the facilitator and note-taker are named separately.
- Pre-reads: link, estimated reading time, and what readers should come prepared with ("your preferred option and why").
  Send at least 24 h ahead (48 h for > 10 pages). Mark the meeting as reading-first (silent reading in the first 10
  minutes) if pre-reads are routinely skipped.
- Pull open actions from the previous meeting into a 5-minute "action review" slot only if there are any overdue.

## 6. Output format

```markdown
# <Meeting name> — <date>, <start–end, timezone>
**Outcome:** <what we leave with>
**Decision owner:** <name> · **Facilitator:** <name> · **Notes:** <name>
**Attendees:** <names> (optional: <names>)

**Pre-reads (by <date/time>):**
- <doc link> — <n> min — come ready to <…>

| Time | Item | Type | Owner | Desired result |
| --- | --- | --- | --- | --- |
| 0:00–0:05 | Context + goal check | Inform | <facilitator> | Shared goal |
| 0:05–0:25 | Decide: <question>? | Decide | <name> | Option chosen, owner named |
| … | … | … | … | … |
| 0:50–0:55 | Recap decisions + actions | — | <notes> | Read back, confirmed |

**Parked / not covered:** <items deferred and where they go instead>
```

For a recurring meeting (weekly team sync, 1:1), produce a reusable template with standing items plus a slot for that
week's topics, and suggest a rotating facilitator.

## Workshops and offsites

For half-day or longer: one outcome per block, breaks every 75–90 minutes, an energiser or walk after lunch, a
diverge → converge structure per problem (generate, cluster, prioritise, decide), and a closing slot that writes owners
and dates onto every output. Name the method for each block (dot voting, 1-2-4-All, silent brainstorm).

## Pitfalls

- An agenda that is a list of nouns ("Budget", "Hiring") — no one knows what done looks like.
- "Decide" items with no named decision owner: the meeting ends in "let's take this offline".
- Status updates read aloud in the meeting; move them to the pre-read.
- Timeboxes that add up to more than the slot.
- Inviting people "for visibility": list them as optional or send them the recap instead.
