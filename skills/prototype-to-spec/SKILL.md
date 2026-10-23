---
name: prototype-to-spec
description: Turn a validated PRD and mocked prototype into a lightweight arc42 architecture spec — a folder of short markdown chapters centred on ADRs, a Mermaid topology overview and the chosen tech stack — after interviewing the user on the open technical-feasibility and implementation questions. Use when a PRD and/or clickable prototype exist and the user asks how to build it for real, wants a technical spec, architecture, tech stack recommendation or ADRs before implementation, or asks "is this feasible / what would it take". Third step of idea → PRD → prototype → spec (after idea-to-prd and prd-prototype).
---

# Prototype to Spec

The PRD says *what*; the prototype shows *how it feels*. This skill decides *how it's built*: find the technical
questions the two leave open, settle them with the user, and write them down as a small arc42 spec. Coarse on
purpose — components, decisions and stack, not classes, endpoints or tables.

Inputs: `docs/PRD.md`, `prototype/` (especially `src/mocks/api.ts`, `types.ts`, `README.md` handoff, `FEEDBACK.md`).
Output: `docs/spec/` (or the folder the user names).

## 1. Harvest

Read the inputs and extract, in a scratch note:

| Pull out | From |
| --- | --- |
| Entities, relations, rough volumes | `types.ts`, fixtures, PRD §8 |
| Operations (the API surface draft) | `api.ts` function list |
| Roles and permission rules | role checks in `api.ts`, PRD users |
| Things faked that need real infra | prototype handoff: email, payments, uploads, search, real-time, AI, scheduling |
| External systems | PRD flows and constraints (identity, payment, CRM, maps…) |
| Quality needs | NFRs: latency, availability, scale, privacy, offline, accessibility |
| Hard constraints | PRD §9: deadline, mandated tech, budget, region, regulation |

Don't ask the user for anything you can read here.

## 2. List the open questions

Turn every gap into a question and tag it with the decision it drives. Bank with typical options:
[references/feasibility-questions.md](references/feasibility-questions.md).

Keep a question only if the answer **changes the topology, the stack, or a decision that's expensive to reverse**
(data store, hosting model, auth model, sync vs async, build vs buy, multi-tenancy). Everything else gets a stated
default and becomes a `Proposed` ADR or a line in 08.

Also flag **feasibility risks** — requirements that are much harder than they look (real-time co-editing, offline
sync, search over large data, AI quality, third-party API limits). For each, give the user a choice: build it,
use a service, or simplify the requirement (with the PRD edit that implies).

## 3. Interview

- Round 1 is always **constraints**: team skills and preferred languages, existing infra/accounts, hosting preference,
  budget for managed services, who operates it. These prune everything after.
- Then one round per theme (data, identity, integrations, async/real-time, deployment, risks). ≤ 4 questions per
  round, 2–4 options each, recommended option first with a one-line trade-off. Use the harness's question tool
  (Claude Code: `AskUserQuestion`) when available.
- Phrase for the user's level. Product owner: "Should it keep working without internet?" Engineer: "Offline-first
  with sync, or online-only?"
- After each round, say which ADRs the answers settle.
- Stop when every topology-relevant question is answered or explicitly defaulted. 3–5 rounds is typical.

If an answer changes product scope (e.g. dropping real-time presence), update the PRD requirement and changelog too.

## 4. Write the spec

Layout, chapter templates and the ADR template: [references/spec-templates.md](references/spec-templates.md).

```
docs/spec/
  README.md                       # summary, chapter index, topology (copy of 05), tech stack summary
  01-introduction-and-goals.md    # link to PRD, top 3 quality goals, stakeholders
  02-constraints.md
  03-context-and-scope.md         # system + users + external systems (Mermaid)
  04-solution-strategy.md         # key ideas + tech stack table, each row → ADR
  05-building-block-view.md       # topology (Mermaid) + component table + FR coverage
  06-runtime-view.md              # 1–3 key flows (sequence diagrams)
  07-deployment-view.md           # environments, hosting (Mermaid)
  08-crosscutting-concepts.md     # auth, data model (entities only), errors, observability
  09-architecture-decisions.md    # ADR index
  10-quality-requirements.md      # NFRs as testable scenarios
  11-risks-and-open-questions.md
  12-glossary.md                  # or a link to the PRD's terms
  decisions/
    0001-record-architecture-decisions.md
    NNNN-<kebab-title>.md
```

The three parts that matter most — spend the effort here:

1. **ADRs** — one per real decision from the interview: hosting, frontend framework, backend/runtime, data store,
   auth, async/real-time mechanism, each build-vs-buy, multi-tenancy. User-confirmed → `Accepted`; agent default the
   user didn't weigh in on → `Proposed`. Each names the alternatives considered and why they lost.
2. **Topology** in 05 — one `flowchart`, 5–12 nodes, user → frontend → backend → stores/queues → external services.
   Same diagram copied into README.
3. **Tech stack** in 04 — a table *Layer | Choice | Why (one line) | ADR*. Layers: frontend, backend/runtime, data,
   auth, hosting, async/jobs, storage, observability, CI/CD, key third-party services. Pick mainstream, boring,
   well-documented options matching the team's skills unless a requirement forces otherwise.

**Stay coarse.** Not in the spec: endpoint lists, DB column lists, class or module diagrams, folder trees, config,
sprint plans, estimates. Entities with their key relations, yes; fields, no (the prototype's `types.ts` already
shows them). If a chapter has nothing real to say: `_Nothing relevant yet._`

Map every Must FR to the component that owns it (table in 05). An FR no component owns is a gap: fix the topology
or flag it in 11.

## 5. Review and hand off

- Walk the user through README: topology, stack table, ADR list with statuses. Ask them to confirm or flip any
  `Proposed` ADR (one question round, multi-select "accept these defaults").
- Put the unresolved items in 11 with an owner and the point by which they must be decided.
- Tell the user how to keep it alive: once implementation starts, rename/move `docs/spec/` to
  `docs/architecture/` and maintain it with `arc42-documentation` (same layout); the PRD stays in `docs/`.

## Pitfalls

- Choosing a stack before asking about constraints: the team writes Python and you proposed Next.js + Go.
- Designing for scale the PRD doesn't have. 500 users don't need Kafka or microservices; say so in an ADR.
- ADRs without alternatives: then it's an announcement, not a decision. Two real alternatives minimum.
- Spec granularity creep: endpoint tables and schema DDL go stale before the first commit. Link `api.ts` / `types.ts`
  as the starting point instead.
- Ignoring prototype fakes: email, search, uploads and real-time look free in the prototype and aren't. Each one is a
  component or a service in the topology.
- Generic chapters ("The system shall be secure"): delete anything true of every system.
- Feasibility trade-offs decided silently. If a requirement is simplified, the user agrees and the PRD changes.

## Checklist

- [ ] Harvest done; no question asked that the PRD/prototype already answer.
- [ ] Constraints round asked first; every round ≤ 4 questions with recommendations.
- [ ] Feasibility risks surfaced with build / buy / simplify choices; PRD updated for any simplification.
- [ ] `docs/spec/` has README, 12 chapters, `decisions/` with 0001 + one ADR per real decision.
- [ ] 04 tech stack table complete, each row linked to an ADR.
- [ ] 05 topology 5–12 nodes, identical copy in README; every Must FR owned by a component.
- [ ] ADR statuses honest: Accepted only when the user confirmed.
- [ ] No endpoint lists, column lists, folder trees or estimates; empty chapters say so.
- [ ] 11 lists open questions with owner and decide-by; handoff to `arc42-documentation` mentioned.
