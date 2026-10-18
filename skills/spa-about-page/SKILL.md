---
name: spa-about-page
description: Add an About page to a Vite single-page app that shows the build's git commit hash, links to a generated third-party open source license list (a .txt file built by rollup-plugin-license), and links to the Impressum, terms of service and privacy policy, all opening in a new tab. Use when adding an About, Legal or "Open source licenses" page, showing which commit a deployment runs, producing a third-party notices / attributions file for a Vite build, or wiring legal links into an SPA.
---

# SPA About Page

One small page at `/about` that answers "which build is this, what is it built on, and where are the legal texts":

- the commit hash the bundle was built from, injected at build time;
- a link to `third-party-licenses.txt`, generated on every production build by
  [`rollup-plugin-license`](https://www.npmjs.com/package/rollup-plugin-license) from the modules actually in the
  bundle;
- links to the Impressum, terms of service and privacy policy.

Every link on the page opens in a new tab. The page needs no server: the hash is a compile-time constant and the
license list is a static file in `dist/`.

Stack assumed: Vite 5+, React, TypeScript, TanStack Router, Tailwind, react-i18next, `lucide-react`. Swap equivalents
freely (React Router, Vue, Svelte); keep the structure.

## 1. File layout

```
vite.config.ts             # commit hash define + rollup-plugin-license
src/
  vite-env.d.ts            # declare const __COMMIT_HASH__
  about/links.ts           # legal URLs and the license file URL, in one place
  routes/about.tsx         # the page
  locales/en/about.json    # every UI string of the page
  router.tsx               # /about route, outside the authenticated shell
```

```bash
pnpm add -D rollup-plugin-license
```

## 2. Build it, in this order

1. **Commit hash** in `vite.config.ts`: resolve it once from the CI's env variable, falling back to
   `git rev-parse HEAD`, then to `"unknown"`. Expose it through `define` as `__COMMIT_HASH__` (full 40-char SHA) and
   declare it in `src/vite-env.d.ts`. Never let a missing `.git` fail the build. Code:
   [references/build-config.md](references/build-config.md).
2. **License list** in `vite.config.ts`: add `license({ thirdParty: { output: { file: <outDir>/third-party-licenses.txt
   } } })` with `apply: "build"`. Use an absolute path that follows Vite's `build.outDir`. Keep the default text
   format (name, version, license, full license text) unless legal asks for a different one. Code: same reference.
3. **Links module** `src/about/links.ts`: `LEGAL_LINKS` (impressum, terms, privacy) read from `VITE_*` env variables
   with defaults, and `LICENSES_URL = import.meta.env.BASE_URL + "third-party-licenses.txt"`. Code:
   [references/page.md](references/page.md).
4. **Page** `src/routes/about.tsx`: app name and one-line description, a "Build" row with the short hash (7 chars,
   monospace, full SHA in `title`, copy button), an "Open source" row linking to the license list, and a "Legal" list
   of three links. Every `<a>` has `target="_blank" rel="noopener noreferrer"`, an external-link icon and an sr-only
   "(opens in a new tab)". Code: same reference.
5. **Route** `/about` registered under the root route, not the authenticated app shell, so it works signed out.
   Lazy-load the component. Configure the host's SPA fallback for `/about`.
6. **Entry points**: an "About" item in the profile/help menu and a footer link on public pages. The About page
   itself opens in the same tab; only its outgoing links open new tabs.
7. **Hosting**: make the host serve `.txt` as `text/plain; charset=utf-8` (license texts contain non-ASCII names) and
   exclude it from the SPA fallback so a missing file is a real 404, not `index.html`.

Key decisions to keep:
- **The hash is baked in at build time**, not fetched. What the page shows is exactly what the bundle was built from.
- **The license list covers the bundle, not `package.json`.** rollup-plugin-license walks the modules Rollup actually
  included, so dev tools and tree-shaken packages stay out and every shipped package is in.
- **All legal URLs live in `links.ts`.** The page, the footer and the cookie banner import them; nothing hard-codes a
  URL twice.
- **Plain `<a>` for every link on the page**, including internal routes like `/impressum`: each link opens a fresh
  tab anyway, so client-side routing gains nothing, and the license file is not a route at all.

## 3. Page content

| Block | Content | Notes |
| --- | --- | --- |
| Header | App name, one-sentence description, version from `package.json` if you ship one | `h1` = "About <App>" |
| Build | `Commit a1b2c3d` + copy button | Link to `<repo>/commit/<sha>` only when the repo is public (`VITE_REPO_URL` set) |
| Open source | "<App> is built with open source software." + **Third-party licenses** link | Opens the `.txt` in a new tab |
| Legal | **Impressum**, **Terms of service**, **Privacy policy** | Three links in a list, each in a new tab |
| Footer | © year, company name | Optional |

Wording: label links with the document name, never "click here". Keep "Impressum" untranslated in German and English
UIs if the company is German (it's the legal term); translate the other two.

## Pitfalls

- **Link 404s in `vite dev`.** The plugin runs at build time only, so the file exists after `vite build` / in
  `vite preview`. Either accept that (note it in the README) or keep a placeholder at
  `public/third-party-licenses.txt` that the build overwrites. Don't commit a real generated list: it goes stale.
- **Relative output path.** The plugin resolves `output.file` against `process.cwd()`, not the config file. In a
  monorepo or when building from another directory the file lands outside `dist/`. Use `path.resolve(__dirname, ...)`.
- **Build in Docker or a shallow CI checkout without `.git`.** `git rev-parse` throws; read the CI variable first
  (`GITHUB_SHA`, `CI_COMMIT_SHA`, …) or pass `--build-arg COMMIT_SHA=$(git rev-parse HEAD)` and catch the error.
- **`define` with an unquoted value.** `define: { __COMMIT_HASH__: hash }` inlines the bare hash as code and breaks
  the build; always `JSON.stringify(hash)`.
- **Using `import.meta.env.VITE_COMMIT_HASH` from `.env` files.** Works, but a stale `.env.local` silently wins over
  the real hash. Compute it in the config.
- **Hard-coded `/third-party-licenses.txt`.** Breaks when the app is served under a sub-path; prefix
  `import.meta.env.BASE_URL`.
- **Missing `rel="noopener noreferrer"`** on `target="_blank"` links to external legal pages: the opened tab gets
  `window.opener`. (Modern browsers imply `noopener`, but keep it explicit.)
- **Impressum only reachable via About.** German law (§ 5 DDG) wants it "easily recognisable and directly
  reachable": also link it from the public footer, not only from a page behind a menu.
- **Packages without a license field** show `License: null` in the list. Add `allow: { test: "...", failOnUnlicensed:
  true }` to catch them in CI, and resolve each one by hand.
- **Mojibake in the license tab** (`Ã©` instead of `é`): the host serves `.txt` without `charset=utf-8`.

## Checklist

- [ ] `vite build` writes `dist/third-party-licenses.txt`; it lists runtime packages (e.g. `react`) and no dev-only
      ones (e.g. `vite`, `eslint`).
- [ ] The page shows a 7-char hash that matches `git rev-parse --short HEAD` of the deployed commit; hover shows the
      full SHA; copy puts the full SHA on the clipboard.
- [ ] A build without `.git` succeeds and shows the CI SHA or `unknown`.
- [ ] Third-party licenses, Impressum, Terms and Privacy each open in a new tab; the About tab stays put.
- [ ] Every new-tab link has `rel="noopener noreferrer"`, an external-link icon and sr-only "(opens in a new tab)".
- [ ] Legal URLs come only from `links.ts`; changing one there updates About and footer.
- [ ] `/about` works signed out and on a deep link (SPA fallback); the `.txt` URL returns `text/plain; charset=utf-8`.
- [ ] Works under a non-root `base`.
- [ ] Light and dark themes readable; page usable at 320 px width; all strings come from the `about` namespace.
