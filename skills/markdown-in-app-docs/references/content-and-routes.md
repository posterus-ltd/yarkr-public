# Content module and routes

## `src/docs/index.ts`

```ts
/**
 * The user docs at /docs: plain markdown files in ./content, one per page, named by slug.
 * A page's title is its first `# ` heading; DOCS_NAV decides the order and grouping of the sidebar.
 */

const files = import.meta.glob<string>("./content/*.md", { query: "?raw", import: "default", eager: true });

export interface DocPage {
  slug: string;
  title: string;
  /** The markdown without its `# ` title, which the page renders itself. */
  body: string;
}

export interface DocHeading {
  id: string;
  text: string;
  depth: 2 | 3;
}

export const DOCS_NAV = [
  { key: "start", pages: ["introduction", "quickstart", "concepts"] },
  { key: "setup", pages: ["connect-github", "select-repos"] },
  { key: "use", pages: ["install-with-the-cli", "connect-over-mcp"] },
] as const;

export type DocsSectionKey = (typeof DOCS_NAV)[number]["key"];

const pages = new Map<string, DocPage>();
for (const [path, source] of Object.entries(files)) {
  const slug = path.slice("./content/".length, -".md".length);
  const m = /^#\s+(.+)\r?\n/m.exec(source);
  pages.set(slug, {
    slug,
    title: m?.[1]?.trim() ?? slug,
    body: m ? source.slice(0, m.index) + source.slice(m.index + m[0].length) : source,
  });
}

/** Sidebar order, flattened: what "previous" and "next" step through. */
export const DOC_ORDER: string[] = DOCS_NAV.flatMap((s) => [...s.pages]);

export const getDoc = (slug: string) => pages.get(slug);

/** The DOCS_NAV section a page belongs to, for the label above its title. */
export const sectionOf = (slug: string) =>
  DOCS_NAV.find((s) => (s.pages as readonly string[]).includes(slug))?.key;

/** GitHub's heading anchors: lowercase, punctuation dropped, spaces to dashes. */
export function slugify(text: string) {
  return text.toLowerCase().trim().replace(/[^\p{L}\p{N}\s-]/gu, "").replace(/\s+/g, "-");
}

/** The `##` and `###` headings outside code blocks, for "On this page". */
export function headingsOf(body: string): DocHeading[] {
  const out: DocHeading[] = [];
  let fenced = false;
  for (const line of body.split("\n")) {
    if (/^\s*(```|~~~)/.test(line)) fenced = !fenced;
    if (fenced) continue;
    const m = /^(#{2,3})\s+(.+?)\s*#*\s*$/.exec(line);
    if (!m) continue;
    // Strip inline code, links and emphasis so the outline text matches the rendered heading text.
    const text = m[2]!.replace(/`([^`]+)`/g, "$1").replace(/\[([^\]]+)\]\([^)]*\)/g, "$1").replace(/\*/g, "");
    out.push({ id: slugify(text), text, depth: m[1]!.length as 2 | 3 });
  }
  return out;
}
```

Notes:
- The title regex is multiline but takes the first match, so anything before the `# ` line (rare) is kept in the body.
- If two headings on a page share text they get the same id; write distinct headings rather than adding dedup logic
  (the renderer and outline would have to agree on the suffixes).
- Optional dev guard: warn when a `DOCS_NAV` slug has no file, or a file isn't in `DOCS_NAV`.

```ts
if (import.meta.env.DEV) {
  for (const s of DOC_ORDER) if (!pages.has(s)) console.warn(`docs: ${s} is in DOCS_NAV but has no content/${s}.md`);
  for (const s of pages.keys()) if (!DOC_ORDER.includes(s)) console.warn(`docs: content/${s}.md is not in DOCS_NAV`);
}
```

## `router.tsx` (TanStack Router)

```ts
import { createRoute, lazyRouteComponent, redirect } from "@tanstack/react-router";

/** The user docs: public, outside the app shell, so they open in their own tab from the profile menu. */
const docsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/docs",
  component: lazyRouteComponent(() => import("@/routes/docs"), "DocsLayout"),
});

const docsIndexRoute = createRoute({
  getParentRoute: () => docsRoute,
  path: "/",
  // The first page in the sidebar. Not imported from src/docs, which would put every page in the main bundle.
  beforeLoad: () => {
    throw redirect({ to: "/docs/$slug", params: { slug: "introduction" }, replace: true });
  },
});

const docRoute = createRoute({
  getParentRoute: () => docsRoute,
  path: "$slug",
  component: lazyRouteComponent(() => import("@/routes/docs"), "DocPageView"),
});

// rootRoute.addChildren([…, docsRoute.addChildren([docsIndexRoute, docRoute]), …])
```

- `docsRoute` is a child of `rootRoute`, not of the authenticated layout route, so no auth guard runs.
- React Router equivalent: `{ path: "docs", lazy: () => import("./routes/docs"), children: [{ index: true, loader: () =>
  redirect("/docs/introduction") }, { path: ":slug", … }] }`.

## Hosting

Static hosts must serve `index.html` for `/docs/*`:
- S3 + CloudFront: custom error responses 403/404 → `/index.html`, 200.
- Netlify: `/* /index.html 200` in `_redirects`. Vercel: a rewrite of `/(.*)` to `/index.html`.
