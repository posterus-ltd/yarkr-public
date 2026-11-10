---
name: spa-error-boundary-page
description: Add a full-page error fallback to a React single-page app for routes that throw while loading or rendering, with a reassuring message, Go back and Reload actions, and a collapsible copyable "Error details" panel (message, HTTP status, URL, timestamp, stacks). Use when adding an error boundary, errorComponent in TanStack Router or errorElement in react-router, replacing a blank white screen after a crash, or handling stale-build chunk load errors after a deploy.
---

# SPA Error Boundary Page

A full-page fallback shown when a route throws while loading or rendering. It reassures the user, offers a way out,
and gives support a copyable report without leading with raw error text.

Stack assumed: React, TypeScript, TanStack Router or react-router, Tailwind with design tokens, a shared `Button`,
react-i18next. Swap equivalents freely; keep the structure.

## 1. File layout

```
src/
  routes/error-page.tsx      # exports ErrorPage
  lib/use-go-back.ts         # useGoBack(), shared with the 404 (see spa-not-found-page)
  locales/en/*.json          # errorPage namespace
  router.tsx                 # wiring
```

Follow the project's component conventions (for example const arrow functions typed as `FC`, named exports).

## 2. Build it, in this order

1. **Normalise the error** first: `error instanceof Error ? error : new Error(String(error))`. Anything can be thrown.
2. **Report it.** Log it, or send it to monitoring if the app has it. Never swallow it.
3. **Page** `src/routes/error-page.tsx`:
   - Same layout as the 404 (`grid min-h-[70vh] place-items-center px-4 py-12`), but `max-w-xl` because it holds a
     details panel.
   - Content: an icon or illustration, a short eyebrow line, an `<h1>`, and a reassuring message. No blame, no raw
     error text up front.
   - Actions: **Go back** (outline, `useGoBack`) and **Reload** (primary, `window.location.reload()`).
   - A collapsible `<details>` titled "Error details" holding a copyable code block with:
     - `name: message`
     - HTTP status and code when it's the app's API error class
     - the current URL and an ISO timestamp
     - `error.stack` and the component stack, when present
4. **Stale-build errors:** if the error is a failed dynamic import (the old build's chunks are gone after a deploy),
   show the new-version copy and lead with **Reload** instead of the generic "something broke". See
   `spa-new-version-prompt`.
5. **Router wiring**:
   - **TanStack Router:** `errorComponent: ErrorPage` on the root route and `defaultErrorComponent: ErrorPage` on
     `createRouter`. Props come from `ErrorComponentProps` (`error`, `info?.componentStack`).
   - **react-router:** `errorElement: <ErrorPage />` on the root route; read the error with `useRouteError()`.

## 3. i18n

```
errorPage: { eyebrow, title, message, back, reload, details }
```

## Pitfalls

- **The error page itself throws** (it reads `error.message` off a string, or calls a hook that depends on the broken
  context). Normalise first and keep its dependencies minimal: no data fetching, no auth context.
- **Raw stack as the headline.** Users read it as "you broke it". Keep it in the collapsed details.
- **Chunk load errors treated as bugs.** After a deploy they're expected; tell the user a new version is out and
  reloading fixes it. Detect them by message (`Failed to fetch dynamically imported module`,
  `Importing a module script failed`, `error loading dynamically imported module`) or by the `vite:preloadError`
  flag set in `spa-new-version-prompt`.
- **Only the root route wired.** Set the router default too, or nested route errors fall through to a blank screen.
- **Error swallowed silently.** The page must log or report before rendering.

## Checklist

- [ ] A route that throws renders ErrorPage, and the details panel contains the error message.
- [ ] A non-`Error` throw (a string) still renders a readable message.
- [ ] An API error shows its HTTP status in the details.
- [ ] A failed dynamic import shows the new-version copy with Reload first.
- [ ] The details block copies to the clipboard and includes URL and ISO timestamp.
- [ ] The error is logged or reported to monitoring.
- [ ] Design tokens only and the shared `Button`; readable in dark mode.
- [ ] Exactly one `<h1>`; decorative SVGs `aria-hidden`; buttons at least 44 px and keyboard reachable.
- [ ] Animations respect `prefers-reduced-motion`.
- [ ] Co-located tests (vitest + RTL) cover the first three items.
- [ ] `typecheck`, `test` and `lint` pass; a forced throw looks right in light and dark mode at 320 px and 1440 px.
