# Feasibility question bank

Each question names the decision (ADR) it settles. Ask only the ones whose answer changes the topology, stack or a
hard-to-reverse choice; default the rest. Recommended option first — adjust the recommendation to the constraints
round.

## Round 1: constraints (always first)

| Question | Options pattern | Settles |
| --- | --- | --- |
| Which languages/frameworks does the team know best? | TypeScript · Python · Go/Java/.NET · "no team yet, agent-built" | backend + frontend ADRs |
| Existing cloud accounts or platforms to reuse? | none · Vercel/Netlify · Supabase/Firebase · AWS/GCP/Azure · on-prem | hosting ADR |
| Who runs it in production? | nobody, fully managed · one dev part-time · ops team | managed vs self-hosted |
| Budget for managed services per month at launch? | ~0 (free tiers) · < $100 · < $1k · not a concern | build vs buy ADRs |
| Data residency or regulation? | none · EU only (GDPR) · sector rules (health, finance) | hosting region, data ADR |

## Data

| Question | Options pattern | Settles |
| --- | --- | --- |
| Is the data mostly relational (entities that reference each other)? | yes → Postgres · documents → document DB · mostly files | data store ADR |
| Expected volume after a year? | < 10k rows · < 10M · more | data store, search |
| Need full-text or fuzzy search? | simple filter only · DB full-text · search service | search ADR |
| Files/uploads? | none · small images · large files/video | object storage |
| Must data be exportable or deletable per user? | no · yes (GDPR) | data model, ops |

## Identity and access

| Question | Options pattern | Settles |
| --- | --- | --- |
| How do users sign in? | email magic link · email+password · Google/Microsoft SSO · enterprise SAML | auth ADR |
| Build auth or use a provider? | provider (Supabase Auth, Clerk, Auth0, Cognito) · framework built-in · custom | auth ADR |
| Multiple organisations sharing one deployment? | single tenant · multi-tenant shared DB · DB per tenant | tenancy ADR |
| Where are permissions enforced? | DB row-level security · API layer · both | auth ADR, 08 |

## Real-time, async, background work

| Question | Options pattern | Settles |
| --- | --- | --- |
| Do other users' changes need to appear without reload? | no, refresh is fine · within seconds (polling) · instantly (websocket/realtime) | real-time ADR |
| Concurrent edits to the same item? | last write wins · optimistic locking with conflict message · co-editing (CRDT) | real-time ADR, feasibility |
| Work that runs later or on a schedule (emails, imports, reports)? | none · cron jobs · queue + worker | async ADR |
| Must it work offline? | no · read-only offline · full offline with sync | frontend + sync ADR, feasibility |

## Integrations

| Question | Options pattern | Settles |
| --- | --- | --- |
| Payments? | none in v1 · Stripe Checkout (hosted) · embedded payments · marketplace payouts | payments ADR |
| Email/SMS/push? | transactional email service · + push · none | notifications |
| Which external systems must it talk to, and do they have APIs? | list from PRD, each: API available? rate limits? | context, integration ADRs |
| AI/LLM features? | none · hosted model API · self-hosted model | AI ADR, cost risk |

## Frontend and delivery

| Question | Options pattern | Settles |
| --- | --- | --- |
| Keep the prototype's frontend stack? | yes, rebuild cleanly in it · switch (say why) | frontend ADR |
| SEO / public pages matter? | no, app behind login → SPA · yes → SSR/SSG framework | frontend ADR |
| Native mobile needed in v1? | no, responsive web · PWA · React Native/Expo · native | frontend ADR |
| How do changes get deployed? | push to main deploys · PR previews + manual promote | 07, CI/CD |
| Environments? | prod only · staging + prod · per-PR previews | 07 |

## Feasibility risk prompts

Raise these as build / buy / simplify choices when the PRD contains them:

- Real-time co-editing → simplify to locking or last-write-wins, or buy (Liveblocks, Yjs + provider).
- Offline-first with sync → simplify to online-only + optimistic UI, or accept a sync-engine dependency.
- Search over large or unstructured data → DB full-text first; search service only above clear volume.
- AI output quality as a core promise → add an evaluation step and a fallback path; flag cost per request.
- Third-party data the product depends on → confirm API access, terms and rate limits before committing.
- Payments, payouts, tax → buy; never build.
- Video, maps, calendars, e-signatures → buy unless they're the product.
