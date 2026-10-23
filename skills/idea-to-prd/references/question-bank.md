# Survey question bank

Pick, don't copy. Rewrite each question in the idea's own terms, and replace the generic options with ones from the
exploration. The recommended option goes first.

## Users and problem

| Question | Options pattern |
| --- | --- |
| Who is the primary user of v1? | the 2–3 user types from exploration · "all equally" (warn: splits focus) |
| What do they do today instead? | spreadsheet / existing tool X / manual + messaging / nothing (new behaviour) |
| Where and how often do they use it? | desktop daily at work · phone several times a day · occasionally, on demand |
| Who pays? | the user · their company · free (ads/other) · undecided |
| Single user or shared? | single user · small team with shared data · organisation with roles |

## Scope

| Question | Options pattern |
| --- | --- |
| Which extensions belong in v1? (multi-select) | the Extensions bucket, each with a one-line value |
| What is the smallest version you'd still use yourself? | 2–3 cut lines, smallest first |
| Is this a standalone product or part of something existing? | standalone · module of product X · internal tool |
| What's explicitly out for v1? (multi-select) | Stretch ideas + common traps (mobile app, billing, admin panel, i18n) |

## Behaviour (the core loop)

Ask only the 2–4 decisions that change how the core loop works. Common ones:

- Creation: who creates the main object — user, import, integration, AI-generated draft?
- Lifecycle: does it have states (draft → active → done)? Can it be undone, archived, deleted for good?
- Collaboration: concurrent edits — last write wins, locking, comments only, real-time co-editing?
- Notifications: none · in-app only · email · push; on which events?
- Visibility: private by default · shared with team · public link?
- Automation: manual only · rules the user sets · AI suggestions the user confirms?
- Empty state / first run: blank · sample data · guided setup?

## Success and constraints

| Question | Options pattern |
| --- | --- |
| How will you know v1 worked? | activation (X users do Y) · retention (weekly use) · time saved · revenue · learning goal |
| Is there a deadline or event? | date · "when it's good" · demo for a specific audience |
| Platforms for v1? | responsive web · desktop web only · native mobile · browser extension |
| Any must-use or must-avoid technology or vendor? | free text, offer "none" first |
| Sensitive data or regulation? | none · personal data (GDPR) · health / finance / children · unsure |
| Languages and regions? | one language · multiple from day one · later |

## Wording rules

- One decision per question. "Who uses it and how often?" is two questions.
- Options are mutually exclusive unless it's a multi-select.
- Each option's description states its consequence: "Team accounts — adds invites, roles and shared data to v1".
- Avoid jargon the user didn't use. Ask "Can two people change the same list at once?", not "Do you need CRDTs?".
