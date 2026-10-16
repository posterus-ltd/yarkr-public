---
name: markdown-in-app-docs
description: Build user docs that ship inside a React SPA at /docs, using plain markdown files bundled at build time and a GitHub-docs-style layout (grouped sidebar, "On this page" scroll-spy, prev/next pager). Use when adding in-app help or a /docs route without a separate docs site, CMS or MDX, when docs must work on static hosting and signed out, or when writing pages for such a docs set.
---

# Markdown In-App Docs

User docs that live in the app's own repo and bundle: one `.md` file per page, imported raw at build time, rendered
client-side under `/docs`. No server, no fetch, no MDX, no frontmatter, no CMS. Writers touch only markdown plus one
nav array.

Stack assumed: React 19, Vite, TanStack Router, Tailwind v4, react-i18next, `react-markdown` + `remark-gfm`,
`lucide-react`, a Radix `Dialog` for the mobile drawer. Swap equivalents freely (React Router, Next static export); keep
the structure.

## 1. When to use it (and when not)

Use it when the docs are a few dozen pages for the app's own users, should deploy with the app, and must work offline
and on static hosting. Use a docs site generator instead when you need versioned docs, search across hundreds of pages,
translated content, or contributors outside the app repo.

## 2. File layout

```
src/
  docs/
    index.ts              # glob-imports content, DOCS_NAV order, title extraction, heading + slug helpers
    content/<slug>.md     # one file per page; file name = slug = URL
  routes/docs.tsx         # DocsLayout (frame + sidebar) and DocPageView (one page)
  locales/en/docs.json    # every UI string of the docs chrome (not page content)
  router.tsx              # /docs, /docs/ (redirect), /docs/$slug
  index.css               # .prose-* styles for rendered markdown
```

```bash
pnpm add react-markdown remark-gfm
```

## 3. Build it, in this order

1. **Content module** `src/docs/index.ts`: `import.meta.glob("./content/*.md", { query: "?raw", import: "default",
   eager: true })`; derive `{ slug, title, body }` per file (title = first `# ` line, removed from body); export
   `DOCS_NAV` (groups of slugs), `DOC_ORDER` (flattened), `getDoc`, `slugify`, `headingsOf`. Code:
   [references/content-and-routes.md](references/content-and-routes.md).
2. **Routes** under the root, not under the authenticated app shell: `/docs` (layout), `/docs/` (redirect with
   `replace` to the first slug, hard-coded so the index route doesn't import the content), `/docs/$slug`. Both
   components `lazyRouteComponent`, so all markdown lands in one docs chunk. Configure the host's SPA fallback for
   `/docs/*`.
3. **Layout and page** `src/routes/docs.tsx`: header, sidebar, drawer, page, pager, outline, markdown renderer. Code
   and behaviour rules: [references/layout.md](references/layout.md).
4. **Styles and strings**: one shared hand-written prose class plus a `.prose-docs` override, and a `docs` i18n
   namespace: [references/styles-and-i18n.md](references/styles-and-i18n.md). Don't add `@tailwindcss/typography`.
5. **Entry point** in the app: first item of the profile dropdown, `<a href="/docs" target="_blank" rel="noopener">`
   with a book icon, an external-link icon and an sr-only "opens in a new tab". Separator after it.
6. **Write the pages** (section 4) and order them in `DOCS_NAV` (section 5).

Key decisions to keep:
- **Order lives in code, not files.** `DOCS_NAV` is the only place that decides grouping and order. A file not listed
  is reachable by URL but absent from the sidebar and pager. Section labels are i18n keys.
- **One `slugify` for both the outline and rendered headings**, so outline links always hit their element.
- **`headingsOf` skips fenced code**, so `# comment` lines in bash blocks never become headings.
- **Docs sit outside the app shell**: own header, no app sidebar, works signed out, deep-linkable including anchors.

## 4. The markdown contract (hand this to writers)

1. File name = slug = URL: `connect-over-mcp.md` → `/docs/connect-over-mcp`. Lowercase, dashes.
2. The first `# ` heading is the page title, and the only `#`. The layout renders it (h1, sidebar, pager, tab title).
3. Sections use `##` and `###` only. They build the outline and get anchor ids.
4. Internal links are absolute app paths: `[Build arks](/docs/build-arks)`, `/docs/concepts#ark`, `/settings`.
   External links are full `https://` URLs (they open in a new tab).
5. GFM is on: tables, task lists, strikethrough, fenced code with a language. No raw HTML, no MDX components.

Style:
- Open with one or two sentences: what the thing is and who it's for. Never "In this guide we will…".
- Name UI exactly as shown, in bold, with arrows for paths: **Settings → MCP server**.
- Numbered lists for procedures, tables for "which option does what", code blocks for anything typed or pasted.
- Short sections with task-shaped headings ("Get your URL", "Disconnect an app").
- Link to the deeper page instead of repeating it.
- Wrap source prose at ~120 columns.
- The introduction ends with a "Where to start" table: *You want to… | Read*.

````markdown
# Connect over MCP

One sentence: what this is and why you'd use it.

## Get your URL

Open **Settings → MCP server** and choose a **Connection**:

| Connection | Serves |
| --- | --- |
| **Everything** | Every item you can access. |

## Clients without OAuth

Create a read-only [API token](/docs/api-tokens) and send it as a header:

```json
{ "headers": { "Authorization": "Bearer ${TOKEN}" } }
```
````

## 5. Information architecture

Group by the reader's journey, not by code modules:

| Section | Purpose | Typical pages |
| --- | --- | --- |
| Get started | Orient in minutes | Introduction, Quickstart (one path per audience), Concepts (one `##` per term) |
| Set up | One-time admin tasks, in the order they happen | Connect X, Select Y, Add members |
| Use | Day-to-day tasks for end users | Browse, Install with the CLI, Connect over MCP, Tokens |
| Publish / Advanced | Authoring and power-user topics | Versions and releases, Evals |

Aim for 10–20 pages of 30–90 lines. The pager makes the set readable front to back, so order it as a tutorial.

Adding a page: create `src/docs/content/<slug>.md` starting with `# Title`; add `<slug>` to the right `DOCS_NAV`
group; link to it from related pages.

## Pitfalls

- Importing `src/docs` from the router or main bundle (e.g. to compute the first slug): every page ends up in the main
  chunk. Hard-code the redirect target.
- Different slug functions for the outline and the rendered `h2`/`h3`: anchors silently miss.
- Writers adding a second `#` or `####` headings: the title extraction or outline breaks. Review against section 4.
- Relative links (`../quickstart`) or bare `/docs/x` handled by `<a>` without interception: full page reloads.
- Forgetting the SPA fallback for `/docs/*` on S3/CDN: deep links 404.
- Anchors landing under the sticky header: missing `scroll-mt-20` on headings.
- Wide tables or code causing page-level horizontal scroll on mobile: tables need `display:block; overflow-x:auto`.
- A new `DOCS_NAV` key without a `sections.<key>` string: the raw key shows in the sidebar.

## Checklist

- [ ] `/docs` redirects to the first page; unknown slugs show the not-found block.
- [ ] Sidebar order and grouping match `DOCS_NAV`; current page highlighted; its section can't collapse.
- [ ] Title appears once (h1), in the sidebar, pager and browser tab.
- [ ] Outline lists `##`/`###` only, ignores headings in code fences, highlights while scrolling, and the last item
      activates at page bottom.
- [ ] Heading anchors land below the sticky header; `#` link appears on hover.
- [ ] Internal links navigate without a reload; cmd/ctrl-click opens a new tab; external links open a new tab.
- [ ] Prev/next cross section boundaries; first page has no previous, last has no next.
- [ ] Mobile: drawer works and closes on navigation; tables and code scroll horizontally; no page-level horizontal
      scroll.
- [ ] Light and dark themes both readable. Skip link works by keyboard.
- [ ] Main bundle contains no markdown (check the build output: docs are one lazy chunk).
- [ ] Profile menu "Docs" item opens `/docs` in a new tab; docs work signed out.
