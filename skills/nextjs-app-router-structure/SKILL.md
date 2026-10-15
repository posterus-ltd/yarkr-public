---
name: nextjs-app-router-structure
description: 'Organise Next.js App Router projects: layouts, route groups, private folders, dynamic segments, parallel and intercepting routes, loading/error/not-found files. Use when adding routes, restructuring app/, building modals-as-routes, or placing boundaries.'
---

# Next.js App Router structure

Applies to Next.js 15 and 16 (`app/` directory). Check `package.json` for the version first; the notes call out
where 15 and 16 differ.

## 1. The file conventions and what each one does

| File | Role | Notes |
| --- | --- | --- |
| `layout.tsx` | Shared UI that wraps children and **persists across navigation** (does not re-mount) | Root layout must render `<html>` and `<body>` |
| `page.tsx` | Makes the segment publicly routable | A folder without `page.tsx` or `route.ts` is not a route |
| `loading.tsx` | Wraps `page` in a `<Suspense>` boundary; shown instantly on navigation | Covers the page, not the layout of the same segment |
| `error.tsx` | Error boundary for the segment; **must be `'use client'`** | Receives `error` and `reset`; does not catch errors in the same segment's `layout` |
| `global-error.tsx` | Catches errors in the root layout | Must render its own `<html>` and `<body>` |
| `not-found.tsx` | Rendered when `notFound()` is called in the segment | Root `app/not-found.tsx` also handles unmatched URLs |
| `template.tsx` | Like layout but **re-mounts** on every navigation | Use only for enter animations or per-page state reset |
| `default.tsx` | Fallback for a parallel slot that has no match after a hard load | Required for every slot in Next 16 builds |
| `route.ts` | HTTP handler (see `nextjs-route-handlers`) | Cannot coexist with `page.tsx` in the same segment |

Render nesting per segment: `layout > template > error boundary > loading (Suspense) > not-found boundary > page`.
Consequence: to catch an error thrown in `app/dashboard/layout.tsx`, put `error.tsx` in `app/` (the parent).

## 2. Folder conventions

- `app/blog/[slug]/page.tsx` - dynamic segment. `params` is a **Promise** in Next 15+: `const { slug } = await params`.
- `[...slug]` catch-all (requires at least one segment), `[[...slug]]` optional catch-all (also matches the parent).
- `(marketing)/` route group: organises files and lets segments share a layout **without** affecting the URL.
  Use groups to give `/login` a different layout from `/dashboard`, or to have several root layouts (each group with its
  own `<html>`; navigating between root layouts triggers a full page load).
- `_components/` private folder: excluded from routing. Colocate components, hooks and tests there.
- `@slot/` parallel route: a named slot passed as a prop to the parent layout (`{ children, team, analytics }`).
- `(.)photo/[id]` intercepting route: `(.)` same level, `(..)` one level up, `(..)(..)` two up, `(...)` from app root.
  Levels are counted in **route segments, not folders** (route groups and slots don't count).

Two routes that resolve to the same URL (for example `(a)/about/page.tsx` and `(b)/about/page.tsx`) is a build error.

## 3. Decision rules

- Put data fetching in the **lowest** component that needs it. Layouts can't receive the page's `searchParams` and don't
  re-render on navigation between their children, so don't fetch per-page data in a layout.
- Put `loading.tsx` where you want the instant skeleton. For finer streaming, wrap slow components in `<Suspense>`
  inside the page instead of adding more route segments.
- Add `error.tsx` at least at the root of each major section, close to where failures happen, so one broken widget
  doesn't blank the whole app. Show a retry button wired to `reset()`.
- Call `notFound()` from `next/navigation` when a record lookup fails; don't render an empty page with status 200.
- Use `generateStaticParams` for dynamic segments whose values are known at build time.
- Use `generateMetadata` (async, gets `params`) for per-page titles; static `export const metadata` otherwise. Every
  page needs a unique `title`.

## 4. Modal-as-route pattern (parallel + intercepting)

```
app/
  layout.tsx            // renders {children} and {modal}
  @modal/
    default.tsx         // export default function Default() { return null }
    (.)photos/[id]/page.tsx   // modal version, shown on client navigation
  photos/[id]/page.tsx  // full page, shown on hard load / refresh / shared link
```

```tsx
// app/layout.tsx
export default function RootLayout({ children, modal }: { children: React.ReactNode; modal: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}{modal}</body>
    </html>
  );
}
```

Close the modal with `router.back()`. Add a catch-all `@modal/[...catchAll]/page.tsx` returning `null` if the modal
lingers after navigating elsewhere. Without `default.tsx` a hard refresh of a sibling route 404s.

## 5. Typical layout of a mid-size app

```
app/
  (marketing)/layout.tsx, page.tsx, pricing/page.tsx
  (app)/layout.tsx              // authenticated shell, nav
  (app)/dashboard/page.tsx, loading.tsx, error.tsx
  (app)/settings/[tab]/page.tsx
  api/webhooks/stripe/route.ts
  layout.tsx, not-found.tsx, global-error.tsx
lib/                             // server-only data access, auth
components/                      // shared UI
```

Keep data access in `lib/` (or `server/`) with `import 'server-only'` so it can never be bundled into client code.

## 6. Pitfalls

- Expecting a layout to re-render on navigation (it doesn't). Read the pathname in a client component with
  `usePathname()` for active-link styling.
- Reading `searchParams` in a layout: not available. Read it in the page and pass down, or use `useSearchParams()` in a
  client component wrapped in `<Suspense>`.
- Synchronous `params.slug` access: Next 15 warns, Next 16 removed sync access. Always `await params`.
- `error.tsx` without `'use client'`: build error.
- Missing `default.tsx` for parallel slots: 404 on hard navigation.
- Deeply nested route groups purely for organisation; use private folders for that and keep groups for layouts.
- Putting `<html>`/`<body>` in nested layouts: only root layouts render them.

## Checklist before finishing

- [ ] Each new route has `page.tsx`; dynamic params are awaited and typed.
- [ ] Loading and error boundaries exist at sensible levels; `error.tsx` is a client component with a retry.
- [ ] Missing records call `notFound()`.
- [ ] Every parallel slot has `default.tsx`.
- [ ] Each page has a unique title via `metadata`/`generateMetadata`.
- [ ] `next build` passes and prints the expected static/dynamic marker for each route.
