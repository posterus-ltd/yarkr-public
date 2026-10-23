---
name: prd-prototype
description: Build a clickable, fully mocked frontend prototype from a PRD, put it in the user's hands, and iterate on their feedback — updating both the prototype and the PRD each round so they never disagree. Use when a PRD or product brief exists and the user wants to see, click through, demo or test the idea before building it for real, asks for a mockup, clickable prototype or "fake it first" version, or gives feedback on a prototype that should flow back into requirements. Second step of idea → PRD → prototype → spec (after idea-to-prd, before prototype-to-spec).
---

# PRD Prototype

A prototype that *feels* real — realistic data, working navigation, state that sticks — with no backend. Its job is
to surface what the PRD got wrong while changes are still cheap. Every feedback round updates the prototype **and**
the PRD.

Inputs: `docs/PRD.md` (from `idea-to-prd`). Output: `prototype/` (runnable), `prototype/FEEDBACK.md`, an updated PRD.

## 1. Plan the screens

1. Read the PRD's flows and requirements. Write a **screen map** in `prototype/README.md`:
   *Screen | Route | Flows | FR ids*. Every Must FR maps to at least one screen; note FRs that have no UI.
2. List the **entities** from PRD §8 with 3–6 fields each. These become the mock data — and later the spec's data model.
3. Pick the **scenarios** worth switching between: normal, empty/first run, error, and one per user type with
   different permissions.
4. Only ask the user if the screen map shows a real gap (a flow with no entry point, two readings of an FR).
   Otherwise build.

## 2. Pick the stack

| Situation | Use |
| --- | --- |
| The repo already has a frontend stack | that stack, in `prototype/` or a route the real app won't ship |
| Nothing exists (default) | Vite + React + TypeScript + Tailwind, react-router; no UI kit unless asked |
| User wants zero install / one file to share | a single `prototype/index.html` with inline JS (Alpine or plain) |

Don't add a component library, state manager or test setup to a prototype unless the PRD's constraints say so —
speed of change beats architecture here.

## 3. Build the mock layer first

All data goes through one module that looks like the API a real backend would have. Details and code:
[references/mock-layer.md](references/mock-layer.md).

- `src/mocks/fixtures.ts` — realistic, domain-specific seed data (real-sounding names, dates, amounts; never lorem
  ipsum). Enough rows to show scrolling, sorting and long text.
- `src/mocks/api.ts` — async functions per operation (`listProjects()`, `createTask(input)`), with 200–600 ms fake
  latency, in-memory store persisted to `localStorage`, and a reset.
- A small **scenario switcher** (fixed corner panel, collapsible): switch scenario, user role, toggle forced errors,
  reset data. This is how the user tests empty and error states without asking you.
- A visible "Prototype — data is fake" badge.

The function names and shapes in `api.ts` are a deliverable: `prototype-to-spec` reads them as the first draft of the
API surface. Name them in domain language.

## 4. Build the screens

- Happy path of every Must flow first, end to end, before any polish. Then Should, then empty/error states.
- Every interactive element either works against the mock store or shows a clear "not in prototype" toast. No dead
  buttons.
- Use real copy from the PRD's language. Placeholder copy hides misunderstandings.
- Responsive if the PRD says mobile; otherwise desktop-first but not broken on small screens.
- Run it, click through every flow yourself (browser automation tools if available, screenshots for the user), and
  fix console errors before handing over.

## 5. Hand it to the user

Start the dev server and give:
- the URL and how to restart it (`cd prototype && npm run dev`);
- 3–5 **tasks to try**, one per key flow, phrased as goals ("Invite a teammate and assign them a task"), not clicks;
- what's fake (no emails sent, no real login, data resets with the switcher);
- how to give feedback: anything in chat, screenshots welcome, or the in-app note button if you added one.

## 6. Feedback loop

Repeat until the user says it's right. Each round — full rules and formats in
[references/feedback-loop.md](references/feedback-loop.md):

1. **Log** every point in `prototype/FEEDBACK.md` as `F-<n>` with the round number, the user's words, and the screen.
2. **Triage** each point:

   | Type | Means | Action |
   | --- | --- | --- |
   | Polish | looks/feels wrong, requirement unchanged | fix prototype only |
   | Change | an FR is wrong or incomplete | edit the FR in PRD + fix prototype |
   | New | asks for something not in the PRD | ask: v1 or later? then add FR or Out-of-scope line |
   | Question | user is unsure how it should work | offer 2–3 options in the next question round |
   | Reject | conflicts with an earlier decision or is out of scope | explain in one line, confirm with user |

3. **Ask** only about New, Question and conflicting points — ≤ 4 questions, options with a recommendation (harness
   question tool, e.g. `AskUserQuestion`, when available).
4. **Apply**: prototype changes and PRD edits in the same round. Edit requirements in place; add a changelog row
   (`Draft v1.2 — round 2: FR-7 split into FR-7/FR-12, card limit dropped`); move answered open questions out.
5. **Verify**: click through the changed flows; update the screen map.
6. **Report** in ≤ 8 lines: what changed in the prototype, what changed in the PRD (by FR id), what's still open.

## 7. Wrap up

When the user is satisfied:
- Set the PRD status to `Validated by prototype (round N)`.
- In `prototype/README.md`, add a **Handoff** section: entities with fields, the `api.ts` operation list, scenarios
  and roles, and anything the prototype faked that will be hard for real (real-time, search, file upload, payments).
- Suggest the next step: `prototype-to-spec` for the architecture spec.

## Pitfalls

- PRD drift: fixing the prototype after feedback but not the PRD. Every Change/New updates the PRD in the same round.
- Treating prototype code as production code. Don't refactor it, test it or optimise it; it gets thrown away.
- Over-building: auth flows, settings pages and admin screens nobody asked about. Build what the PRD's flows need.
- Lorem ipsum and "Item 1, Item 2": users can't judge a product that doesn't look like their world.
- Mock calls scattered in components: then the API surface handoff is guesswork. Everything goes through `api.ts`.
- Asking the user to describe what they want instead of showing them two variants. When unsure, build both behind a
  switcher toggle and let them pick.
- Accepting every piece of feedback: some contradicts earlier decisions. Surface the conflict, don't silently flip.

## Checklist

- [ ] Screen map covers every Must FR; unmapped FRs noted.
- [ ] All data through `src/mocks/api.ts`; realistic fixtures; latency; localStorage persistence; reset.
- [ ] Scenario switcher covers normal / empty / error / each role; "Prototype" badge visible.
- [ ] No dead buttons, no console errors, every Must flow clicked through.
- [ ] User got URL, tasks to try, what's fake, how to give feedback.
- [ ] Each round: FEEDBACK.md updated, triaged, PRD edited + changelog row, report given.
- [ ] Wrap-up: PRD status set, Handoff section written, next step offered.
