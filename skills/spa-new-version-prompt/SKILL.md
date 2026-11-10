---
name: spa-new-version-prompt
description: Tell users of a Vite single-page app when a newer build is deployed and ask them to reload, using a persistent toast triggered by failed lazy chunk loads (vite:preloadError) and by polling a build-time version.json on tab focus. Use when users hit "Failed to fetch dynamically imported module" after a deploy, when old tabs keep running stale code, or when adding an "update available" / "new version" banner or toast to an SPA.
---

# SPA New Version Prompt

Tell users when a newer build of the web app is deployed and ask them to reload.

Each deploy replaces the previous build's hashed chunks. A tab still running the old build keeps working until its
next lazy import, which then fails with a 404. Old tabs also miss fixes and can send requests the API no longer
accepts.

**Never reload under the user.** It can drop unsaved input. Always ask.

Stack assumed: Vite, React, TypeScript, `sonner` toasts, react-i18next, vitest. Swap equivalents freely; keep the
structure.

## 1. File layout

```
vite.config.ts             # commit define + plugin that emits version.json
src/
  lib/new-version.ts       # exports watchForNewVersion(); plain functions, no React
  main.tsx                 # calls watchForNewVersion() once, after <Toaster /> mounts
  locales/en/common.json   # newVersion strings
```

## 2. Two signals, one prompt

1. **Reactive (required): a lazy chunk failed to load.**
   - Vite fires `vite:preloadError` on `window`. Listen for it and show the prompt.
   - Call `event.preventDefault()` only if the app handles the failure itself; otherwise let the error reach the
     error boundary, which shows the same new-version copy (see `spa-error-boundary-page`).
2. **Proactive (recommended): detect a deploy before anything breaks.**
   - At build time, write `dist/version.json` containing `{ "commit": "<sha>" }` and inject the same value as a
     `define`. If the app already has a commit define (for example `__COMMIT_HASH__` from `spa-about-page`), reuse it.
   - Poll `/version.json` with `cache: "no-store"` when the tab regains focus (`visibilitychange` → `visible`) and on a
     slow interval (for example every 10 minutes, as a named constant). Skip the interval tick while the tab is hidden.
   - If the fetched commit differs from the running one, show the prompt.
   - Ignore network errors and non-200 responses, logging at debug level only: being offline is not a new version.
   - Make sure the host doesn't cache `version.json` (`Cache-Control: no-cache`).

```ts
// vite.config.ts (sketch)
const versionJson = (commit: string): Plugin => ({
  name: "version-json",
  apply: "build",
  generateBundle() {
    this.emitFile({ type: "asset", fileName: "version.json", source: JSON.stringify({ commit }) });
  },
});
// plugins: [react(), versionJson(commit)], define: { __COMMIT_HASH__: JSON.stringify(commit) }
```

## 3. The prompt

- A persistent toast: `toast.info(title, { id: "new-version", description, duration: Infinity, action: { label:
  reload, onClick: () => window.location.reload() } })`.
- The fixed `id` keeps repeated triggers from stacking toasts.
- Don't show it again in the same tab after the user dismisses it, unless a chunk actually fails (then it's no longer
  optional).
- Wording: "A new version of <App> is out" plus a short line on why to reload. When triggered by a chunk failure, say
  the page can't open new screens until they reload.

`watchForNewVersion()` registers both listeners and is idempotent. Call it once in `main.tsx`, after the `<Toaster />`
is mounted. Keep the logic in plain functions so it can be tested without React.

## 4. i18n

```
common:newVersion: { title, description, reload }
```

## Pitfalls

- **Auto-reloading** on `vite:preloadError`. Tempting, loses form input, and loops if the new build is also broken.
- **Cached `version.json`.** A CDN or service worker serving a stale copy hides every deploy; set `no-store` on the
  fetch and `no-cache` on the host, and exclude it from service-worker precaching.
- **SPA fallback swallows the 404.** If the host rewrites a missing `version.json` to `index.html`, `res.json()` throws
  on HTML. Check `res.ok` and the content type, and treat a parse error as "unknown", not "new version".
- **Different commit values** in the define and the file (computed twice, or one from `.env`). Compute once in the
  config and pass the same string to both.
- **Polling in hidden tabs** burns battery and requests for nobody; poll on focus and skip hidden ticks.
- **Called before `<Toaster />` mounts**, so the first toast is lost.
- **In `vite dev`** there is no `version.json`; disable the poll when `import.meta.env.DEV`.

## Checklist

- [ ] Dispatching `vite:preloadError` shows exactly one toast, even when fired twice.
- [ ] A poll returning a different commit shows the toast; the same commit or a failed fetch doesn't.
- [ ] The poll runs on `visibilitychange` to visible and doesn't run while the tab is hidden.
- [ ] Dismissing the toast keeps it hidden in that tab until a chunk load actually fails.
- [ ] `dist/version.json` is emitted and matches the commit the bundle reports; the host serves it uncached.
- [ ] Tests use fake timers and a stubbed `fetch`.
- [ ] `typecheck`, `test` and `lint` pass. Manual check: open the built app (`vite preview`), rebuild with a different
      commit, focus the tab, and the toast appears; Reload loads the new build.
