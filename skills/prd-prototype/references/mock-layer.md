# Mock layer

Default stack: Vite + React + TypeScript + Tailwind. Adapt names to the domain.

```
prototype/
  README.md               # screen map, how to run, handoff
  FEEDBACK.md             # feedback log
  src/
    mocks/
      types.ts            # entity types (from PRD §8)
      fixtures.ts         # seed data per scenario
      store.ts            # in-memory store + localStorage + reset
      api.ts              # the only thing components import for data
    dev/
      ScenarioSwitcher.tsx
    pages/                # one file per screen in the screen map
    components/
```

## Scaffold

```bash
npm create vite@latest prototype -- --template react-ts
cd prototype && npm i react-router-dom && npm i -D tailwindcss @tailwindcss/vite
```

## store.ts

```ts
import { scenarios, type ScenarioId } from './fixtures';
import type { Db } from './types';

const KEY = 'proto:db';
const SETTINGS = 'proto:settings';

export type Settings = { scenario: ScenarioId; role: string; failRequests: boolean };

export const settings: Settings = JSON.parse(localStorage.getItem(SETTINGS) ?? 'null') ??
  { scenario: 'normal', role: 'member', failRequests: false };

export let db: Db = JSON.parse(localStorage.getItem(KEY) ?? 'null') ?? structuredClone(scenarios[settings.scenario]);

export function save() { localStorage.setItem(KEY, JSON.stringify(db)); }

export function setSettings(next: Partial<Settings>) {
  Object.assign(settings, next);
  localStorage.setItem(SETTINGS, JSON.stringify(settings));
  if (next.scenario) reset();
  else location.reload();
}

export function reset() {
  db = structuredClone(scenarios[settings.scenario]);
  save();
  location.reload();
}
```

## api.ts

```ts
import { db, save, settings } from './store';
import type { Task, NewTask } from './types';

const delay = () => new Promise((r) => setTimeout(r, 200 + Math.random() * 400));

async function call<T>(fn: () => T): Promise<T> {
  await delay();
  if (settings.failRequests) throw new Error('Something went wrong (simulated)');
  return structuredClone(fn());
}

export const api = {
  listTasks: (projectId: string) => call(() => db.tasks.filter((t) => t.projectId === projectId)),
  createTask: (input: NewTask) => call(() => {
    const task: Task = { ...input, id: crypto.randomUUID(), createdAt: new Date().toISOString(), status: 'open' };
    db.tasks.push(task); save(); return task;
  }),
  // one function per operation the screens need, named in domain language
};
```

Rules:
- Components never touch `db` directly — only `api`.
- Return copies (`structuredClone`) so UI bugs don't mutate the store.
- Permission checks for roles live in `api.ts` too (`if (settings.role !== 'admin') throw …`), so role scenarios
  behave like the real thing.
- Things the prototype can't do (send email, charge a card) resolve successfully and show a toast
  "Would send email to …" so the user sees the intent.

## fixtures.ts

```ts
export const scenarios = {
  normal: { projects: [/* 4–8 realistic rows */], tasks: [/* 30–60 rows, varied states, a few long titles */] },
  empty:  { projects: [], tasks: [] },
  heavy:  { /* generated: 500+ rows to test lists, search, pagination */ },
} satisfies Record<string, Db>;
export type ScenarioId = keyof typeof scenarios;
```

Realism checklist: names from the user's domain and locale, dates relative to today, amounts with real currency
formats, at least one very long text, one item in every state.

## ScenarioSwitcher

Fixed bottom-right, collapsed to a small pill by default. Controls: scenario select, role select, "fail requests"
toggle, "reset data" button, and (optional) variant toggles for A/B choices you're asking the user about. Hide it
with `?clean` in the URL for screenshots and demos.

## Optional: in-app feedback note

A "Note" button next to the switcher that captures text + current route into `localStorage`, and a "Copy notes"
action that copies them as markdown (`- [/projects/3] the due date is hard to find`) for pasting into chat. Add it
when the user tests on their own without you watching.
