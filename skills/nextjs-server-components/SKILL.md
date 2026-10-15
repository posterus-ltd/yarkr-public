---
name: nextjs-server-components
description: 'Place the Next.js server/client component boundary: when to add ''use client'', serialisable props, server children inside client wrappers, keeping secrets out of bundles. Use when a component needs state or browser APIs, on serialisation errors, or when client bundles grow.'
---

# Server and Client Components in Next.js

In the App Router every component is a **Server Component** unless it, or a module that imports it, is under a
`'use client'` directive. The directive marks a **boundary**: that module and everything it imports become part of the
client bundle.

## 1. Decide which side a component lives on

Needs any of these -> Client Component:
- `useState`, `useReducer`, `useEffect`, `useLayoutEffect`, `useRef` for DOM, context consumers
- event handlers (`onClick`, `onChange`), browser APIs (`window`, `localStorage`, `IntersectionObserver`)
- `useRouter`, `usePathname`, `useSearchParams` from `next/navigation`
- third-party components that use the above and don't ship `'use client'` themselves

Otherwise keep it a Server Component, especially if it:
- fetches data or reads the database, filesystem, env secrets
- renders large dependencies (markdown parsers, syntax highlighters, date libraries) that should not ship to the client

Rule: **push `'use client'` to the leaves.** Make the interactive button a client component, not the whole page.

## 2. Composition patterns

Client components **can't import** Server Components, but they can **render** them when passed as props:

```tsx
// app/dashboard/page.tsx (server)
import Sidebar from './_components/sidebar';        // 'use client', holds open/closed state
import UserStats from './_components/user-stats';   // server, fetches data
export default function Page() {
  return <Sidebar><UserStats /></Sidebar>;           // server child rendered on the server, slotted in
}
```

Context providers: create a `'use client'` `Providers` component and render it in the root layout around `{children}`.
Render it as deep as possible so static parts above it stay server-only.

Third-party component without the directive: re-export it from your own client file.

```tsx
'use client';
export { Carousel } from 'some-carousel';
```

## 3. Props crossing the boundary must be serialisable

Allowed from server to client: primitives, plain objects and arrays, `Date`, `Map`, `Set`, `BigInt`, typed arrays,
`Promise` (consume with React's `use()`), JSX, and **Server Actions** (functions marked `'use server'`).

Not allowed: ordinary functions/callbacks, class instances (ORM models, `Decimal`, Mongo `ObjectId`), symbols.

Fixes:
- Map ORM results to plain DTOs: `{ id: row.id, name: row.name, price: row.price.toString() }`.
- Replace callback props with a Server Action, or move the callback logic into the client component.
- Pass **only the fields the client needs**. Whatever you pass is visible in the page payload, including fields you
  don't render.

## 4. Keep server code and secrets on the server

- Put data access in modules that start with `import 'server-only';`. Importing them from a client module becomes a
  build error instead of a silent leak.
- Use `import 'client-only';` for modules that touch `window`.
- Only `NEXT_PUBLIC_*` env vars are inlined into client bundles; everything else is `undefined` in the browser. Never
  rename a secret to `NEXT_PUBLIC_` to "make it work".
- Build a small data access layer (`lib/data/*.ts`) that checks auth and returns DTOs; pages call it rather than the ORM.

## 5. Data fetching in Server Components

```tsx
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [user, posts] = await Promise.all([getUser(id), getPosts(id)]); // parallel, not waterfall
  if (!user) notFound();
  return <Profile user={user} posts={posts} />;
}
```

- Start independent requests together (`Promise.all`) or pass un-awaited promises down and `use()` them inside
  `<Suspense>` so slow parts stream.
- Wrap non-`fetch` data functions in `React.cache()` to dedupe calls within one render (layout and page asking for the
  same user).
- Don't call your own Route Handlers from Server Components (`fetch('/api/...')`): call the function directly.

## 6. Streaming client data from a server promise

```tsx
// server
const commentsPromise = getComments(id);
return <Suspense fallback={<Spinner />}><Comments comments={commentsPromise} /></Suspense>;
// client
'use client';
import { use } from 'react';
export function Comments({ comments }: { comments: Promise<Comment[]> }) {
  const list = use(comments);
  ...
}
```

## 7. Pitfalls

- `'use client'` at the top of a layout or page "to fix an error": ships the whole subtree; find the leaf instead.
- Hydration mismatches from `Date.now()`, `Math.random()`, locale formatting or `typeof window` branches in render.
  Compute on the server and pass down, or render in `useEffect`. `suppressHydrationWarning` is only for single
  unavoidable text nodes like timestamps.
- Importing a server-only module (db client) into a shared util that a client component also imports.
- `async` client components: not supported. Only Server Components can be `async`.
- Context is not available in Server Components; pass data as props or read it in a client child.
- Leaking secrets through props: an entire user row (with `passwordHash`) passed to a client component is serialised.

## Checklist

- [ ] `'use client'` only on leaf interactive components and provider wrappers.
- [ ] No functions or class instances cross the boundary except Server Actions.
- [ ] Data modules import `server-only`; no secret env var is referenced in client code.
- [ ] Independent fetches run in parallel; slow sections are behind `<Suspense>`.
- [ ] Client bundle for the touched routes didn't grow unexpectedly (check with `@next/bundle-analyzer`).
