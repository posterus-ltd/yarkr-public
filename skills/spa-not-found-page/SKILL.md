---
name: spa-not-found-page
description: Add a full-page 404 (Not Found) fallback to a React single-page app that shows the requested path, offers "Go back" and a link home, sets noindex so crawlers don't index it, and is also rendered for guarded pages the user can't access. Use when adding a 404 or catch-all route, wiring notFoundComponent in TanStack Router or a "*" route in react-router, hiding admin pages from unauthorised users, or fixing soft-404s from static SPA hosting.
---

# SPA 404 (Not Found) Page

One full-page fallback for any URL the router doesn't know. It tells the user what went wrong, shows the path they
asked for, and gets them back on track in one click.

Stack assumed: React, TypeScript, TanStack Router or react-router, Tailwind with design tokens, a shared `Button`,
react-i18next. Swap equivalents freely; keep the structure.

## 1. File layout

```
src/
  routes/not-found.tsx       # exports NotFound
  lib/use-go-back.ts         # exports useGoBack(), shared with the error page
  locales/en/*.json          # titles.notFound + notFound namespace
  router.tsx                 # wiring
```

Follow the project's component conventions (for example const arrow functions typed as `FC`, named exports).

## 2. Build it, in this order

1. **`useGoBack()`** in `src/lib/use-go-back.ts`: go back in history, or navigate to `/` when the tab opened straight
   onto the page (no in-app history to go back to). The error page reuses it (see `spa-error-boundary-page`).
2. **Page** `src/routes/not-found.tsx`:
   - Layout: `grid min-h-[70vh] place-items-center px-4 py-12 text-center`, a centred `max-w-md` column, `gap-5`.
   - Content: an illustration (`aria-hidden`), a large "404", an `<h1>`, a one-line message, and the requested
     `pathname` in mono text with `break-all`.
   - Actions: **Go back** (outline, `useGoBack`) and a **primary link** to the app's main page.
   - Head: a document title and `<meta name="robots" content="noindex">`.
3. **Router wiring**:
   - **TanStack Router:** `notFoundComponent: NotFound` on the root route and `defaultNotFoundComponent: NotFound` on
     `createRouter`.
   - **react-router:** a catch-all `{ path: "*", element: <NotFound /> }`.
4. **Guarded pages** (admin, settings, anything role-gated) **render `<NotFound />`** for users without access instead
   of a 403, so they don't reveal that the page exists.

## 3. i18n

```
titles.notFound
notFound: { title, message, lastSeen, goBack, back }
```

## Pitfalls

- **Soft 404s.** Static hosting answers unknown paths with the SPA's `index.html` and a 200. Without `noindex`,
  crawlers index the 404 as a real page.
- **Only the root route wired.** In TanStack Router a nested route without its own `notFoundComponent` falls back to
  the router default; set `defaultNotFoundComponent` too or nested misses render blank.
- **Go back leaves the app.** `history.back()` on a tab opened straight onto the 404 goes to the previous site or does
  nothing. That's why `useGoBack` falls back to `/`.
- **403 for hidden pages.** "Forbidden" confirms the page exists; render the 404 instead.
- **Unbroken long paths** overflow the column at 320 px; `break-all` on the pathname.

## Checklist

- [ ] `/does-not-exist` renders the 404 with the pathname, and the `noindex` meta is present.
- [ ] A nested unknown route renders the same page.
- [ ] A guarded page opened without access renders the 404, not a 403.
- [ ] Go back returns to the previous in-app page; on a fresh tab it goes to `/`.
- [ ] Design tokens only (`text-muted-foreground`, `bg-surface`, …) and the shared `Button`; readable in dark mode.
- [ ] Exactly one `<h1>`; decorative SVGs `aria-hidden`; buttons at least 44 px and keyboard reachable.
- [ ] Animations respect `prefers-reduced-motion`.
- [ ] Co-located tests (vitest + RTL): unknown route → 404 with pathname and `noindex`; `useGoBack` goes back when it
      can, otherwise navigates to `/`.
- [ ] `typecheck`, `test` and `lint` pass; looks right in light and dark mode at 320 px and 1440 px.
