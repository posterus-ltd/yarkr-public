# Layout and page: `src/routes/docs.tsx`

## Grid

```
┌──────────────────────────── header (sticky, h-14, blurred) ─────────────────────────────┐
│ ☰(mobile)  [logo] product / Docs                               [theme]  [Open app]     │
├──────────────┬──────────────────────────────────────────────────────┬───────────────────┤
│ sidebar      │  SECTION LABEL (small caps, accent)                  │ On this page      │
│ 17rem        │  # Title                                             │ 15rem, xl+ only   │
│ sticky,      │  markdown body (max-w-3xl, centred)                  │ sticky, scroll-   │
│ lg+ only     │  ──────────────                                      │ spy highlight     │
│              │  [← Previous]            [Next →]                    │                   │
└──────────────┴──────────────────────────────────────────────────────┴───────────────────┘
```

- Outer: `lg:grid lg:grid-cols-[17rem_minmax(0,1fr)]` → sidebar + `<Outlet/>`.
- Page: `xl:grid xl:grid-cols-[minmax(0,1fr)_15rem]` → article + outline. Render the outline only when the page has
  more than one heading.
- Sidebar and outline: `sticky top-14 h-[calc(100dvh-3.5rem)] overflow-y-auto`, so they scroll independently.
- Article: `mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-12 lg:py-10`.
- Below `lg`, a hamburger opens the same nav in a left drawer (Radix Dialog restyled:
  `left-0 top-0 h-dvh w-80 max-w-[85vw] translate-x-0 translate-y-0`, slide in from the left). Links close it.

## Behaviour rules

- **Header:** logo → `/`, a `/` separator, "Docs" → `/docs`, theme toggle, and one primary button back into the
  product: "Open app" when signed in, "Browse …" (a public page) when not.
- **Nav sections** are buttons with `aria-expanded`/`aria-controls` and a chevron that rotates when collapsed. They
  start open. The section holding the current page can't collapse (`expanded = open || hasCurrent`).
- **Active link:** router's `data-[status=active]` → filled background plus a 3px accent bar
  (`absolute inset-y-1 left-0 w-[3px]`).
- **Page:** section label (uppercase, `text-xs tracking-wider text-accent`), `<h1>`, body, pager.
  `document.title = "<title> · <Product> Docs"` in an effect. Unknown slug → not-found block with a "Back to the docs"
  button.
- **Pager:** previous/next from `DOC_ORDER`, crossing sections. `mt-14`, top border, two columns on `sm+`. Next is
  right-aligned and pinned to column 2 even without a previous.
- **Scroll-spy:** passive `scroll` listener. Active = last heading whose `getBoundingClientRect().top <= 96` (header
  plus air). At the very bottom of the page, force the last heading active. `key={slug}` resets it per page.
- **Outline list:** left border; items `-ml-px border-l-[3px]` so the active accent overlays it; `###` items `pl-6`,
  `##` items `pl-3`; active gets `aria-current="location"`.
- **Headings:** `id = slugify(textOf(children))`, `scroll-mt-20`, hover-revealed `#` anchor.
- **Links:** `https://` → new tab, `rel="noreferrer"`. `/`-paths → intercept plain left-click and `navigate({ href })`;
  let modifier-clicks and middle-clicks through.

## Code

`useSession`, `ThemeToggle`, `Logo`, `Button` and the `Dialog` parts are the app's own; swap in yours.

```tsx
import { useEffect, useMemo, useState, type MouseEvent, type ReactNode } from "react";
import { Link, Outlet, useNavigate, useParams } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import { ArrowLeft, ArrowRight, ChevronDown, Menu } from "lucide-react";
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { useSession } from "@/lib/auth";
import { DOC_ORDER, DOCS_NAV, getDoc, headingsOf, sectionOf, slugify, type DocHeading } from "@/docs";

export function DocsLayout() {
  const { t } = useTranslation("docs");
  const { user } = useSession();
  const [drawer, setDrawer] = useState(false);

  return (
    <div className="min-h-dvh bg-background text-foreground">
      <a href="#doc" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-3 focus:z-50">
        {t("skipToContent")}
      </a>
      <header className="sticky top-0 z-40 flex h-14 items-center gap-3 border-b border-line bg-background/80 px-4 backdrop-blur">
        <Dialog open={drawer} onOpenChange={setDrawer}>
          <DialogTrigger asChild>
            <Button variant="ghost" size="icon" className="lg:hidden" aria-label={t("openNavigation")}>
              <Menu />
            </Button>
          </DialogTrigger>
          <DialogContent className="left-0 top-0 h-dvh w-80 max-w-[85vw] translate-x-0 translate-y-0 overflow-y-auto rounded-none p-4 data-[state=open]:slide-in-from-left">
            <DialogTitle className="sr-only">{t("navLabel")}</DialogTitle>
            <DocsNav onNavigate={() => setDrawer(false)} />
          </DialogContent>
        </Dialog>
        <Link to="/" aria-label={t("home")}><Logo /></Link>
        <span className="text-muted-foreground" aria-hidden>/</span>
        <Link to="/docs" className="font-medium">{t("title")}</Link>
        <div className="ml-auto flex items-center gap-2">
          <ThemeToggle />
          <Button asChild size="sm">
            {user ? <Link to="/">{t("openApp")}</Link> : <Link to="/registry">{t("openRegistry")}</Link>}
          </Button>
        </div>
      </header>
      <div className="lg:grid lg:grid-cols-[17rem_minmax(0,1fr)]">
        <aside className="sticky top-14 hidden h-[calc(100dvh-3.5rem)] overflow-y-auto border-r border-line p-4 lg:block">
          <DocsNav />
        </aside>
        <Outlet />
      </div>
    </div>
  );
}

function DocsNav({ onNavigate }: { onNavigate?: () => void }) {
  const { t } = useTranslation("docs");
  const { slug } = useParams({ strict: false }) as { slug?: string };
  return (
    <nav aria-label={t("navLabel")} className="space-y-4 text-sm">
      {DOCS_NAV.map((s) => (
        <NavSection key={s.key} sectionKey={s.key} pages={s.pages} current={slug} onNavigate={onNavigate} />
      ))}
    </nav>
  );
}

function NavSection(props: { sectionKey: string; pages: readonly string[]; current?: string; onNavigate?: () => void }) {
  const { t } = useTranslation("docs");
  const [open, setOpen] = useState(true);
  const hasCurrent = !!props.current && props.pages.includes(props.current);
  const expanded = open || hasCurrent;
  const listId = `docs-nav-${props.sectionKey}`;
  return (
    <div>
      <button
        type="button"
        aria-expanded={expanded}
        aria-controls={listId}
        onClick={() => setOpen(!expanded)}
        className="flex w-full items-center justify-between py-1 font-semibold"
      >
        {t(`sections.${props.sectionKey}`)}
        <ChevronDown className={`size-4 transition-transform ${expanded ? "" : "-rotate-90"}`} aria-hidden />
      </button>
      {expanded && (
        <ul id={listId} className="mt-1 space-y-0.5">
          {props.pages.map((p) => (
            <li key={p}>
              <Link
                to="/docs/$slug"
                params={{ slug: p }}
                onClick={props.onNavigate}
                className="relative block rounded-md px-3 py-1.5 text-muted-foreground hover:bg-surface-2 hover:text-foreground data-[status=active]:bg-surface-2 data-[status=active]:font-medium data-[status=active]:text-foreground data-[status=active]:before:absolute data-[status=active]:before:inset-y-1 data-[status=active]:before:left-0 data-[status=active]:before:w-[3px] data-[status=active]:before:rounded-full data-[status=active]:before:bg-accent"
              >
                {getDoc(p)?.title ?? p}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function DocPageView() {
  const { t } = useTranslation("docs");
  const { slug } = useParams({ from: "/docs/$slug" });
  const doc = getDoc(slug);
  const headings = useMemo(() => (doc ? headingsOf(doc.body) : []), [doc]);

  useEffect(() => {
    document.title = doc ? `${doc.title} · ${t("titleSuffix")}` : t("titleSuffix");
  }, [doc, t]);

  if (!doc) {
    return (
      <main id="doc" className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
        <h1 className="text-2xl font-semibold">{t("notFound.title")}</h1>
        <p className="mt-2 text-muted-foreground">{t("notFound.body")}</p>
        <Button asChild className="mt-6"><Link to="/docs">{t("notFound.back")}</Link></Button>
      </main>
    );
  }

  const section = sectionOf(slug);
  return (
    <div className="xl:grid xl:grid-cols-[minmax(0,1fr)_15rem]">
      <main id="doc" className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6 lg:px-12 lg:py-10">
        {section && <p className="text-xs font-semibold uppercase tracking-wider text-accent">{t(`sections.${section}`)}</p>}
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">{doc.title}</h1>
        <DocBody body={doc.body} />
        <Pager slug={slug} />
      </main>
      {headings.length > 1 && <OnThisPage key={slug} headings={headings} />}
    </div>
  );
}

function Pager({ slug }: { slug: string }) {
  const { t } = useTranslation("docs");
  const i = DOC_ORDER.indexOf(slug);
  const prev = i > 0 ? DOC_ORDER[i - 1] : undefined;
  const next = i >= 0 && i < DOC_ORDER.length - 1 ? DOC_ORDER[i + 1] : undefined;
  if (!prev && !next) return null;
  const card = "block rounded-lg border border-line p-4 hover:border-accent";
  return (
    <nav aria-label={t("pager")} className="mt-14 grid gap-4 border-t border-line pt-8 sm:grid-cols-2">
      {prev && (
        <Link to="/docs/$slug" params={{ slug: prev }} className={card}>
          <span className="flex items-center gap-1 text-xs text-muted-foreground"><ArrowLeft className="size-3" />{t("previous")}</span>
          <span className="mt-1 block font-medium">{getDoc(prev)?.title}</span>
        </Link>
      )}
      {next && (
        <Link to="/docs/$slug" params={{ slug: next }} className={`${card} text-right sm:col-start-2`}>
          <span className="flex items-center justify-end gap-1 text-xs text-muted-foreground">{t("next")}<ArrowRight className="size-3" /></span>
          <span className="mt-1 block font-medium">{getDoc(next)?.title}</span>
        </Link>
      )}
    </nav>
  );
}

function OnThisPage({ headings }: { headings: DocHeading[] }) {
  const { t } = useTranslation("docs");
  const [active, setActive] = useState(headings[0]?.id);

  useEffect(() => {
    const onScroll = () => {
      const atBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2;
      if (atBottom) return setActive(headings[headings.length - 1]?.id);
      let current = headings[0]?.id;
      for (const h of headings) {
        const el = document.getElementById(h.id);
        if (el && el.getBoundingClientRect().top <= 96) current = h.id;
      }
      setActive(current);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [headings]);

  return (
    <aside className="sticky top-14 hidden h-[calc(100dvh-3.5rem)] overflow-y-auto py-10 pr-4 xl:block">
      <p className="text-sm font-semibold">{t("onThisPage")}</p>
      <ul className="mt-3 border-l border-line text-sm">
        {headings.map((h) => (
          <li key={h.id}>
            <a
              href={`#${h.id}`}
              aria-current={active === h.id ? "location" : undefined}
              className={`-ml-px block border-l-[3px] py-1 ${h.depth === 3 ? "pl-6" : "pl-3"} ${
                active === h.id ? "border-accent text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {h.text}
            </a>
          </li>
        ))}
      </ul>
    </aside>
  );
}

/** Plain text of rendered children, so a heading's id matches slugify() of its markdown text. */
function textOf(node: ReactNode): string {
  if (node == null || typeof node === "boolean") return "";
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(textOf).join("");
  if (typeof node === "object" && "props" in node) return textOf((node.props as { children?: ReactNode }).children);
  return "";
}

function Heading({ as: Tag, children }: { as: "h2" | "h3"; children?: ReactNode }) {
  const id = slugify(textOf(children));
  return (
    <Tag id={id} className="group scroll-mt-20">
      {children}
      <a href={`#${id}`} aria-hidden tabIndex={-1} className="ml-2 text-muted-foreground no-underline opacity-0 group-hover:opacity-100">
        #
      </a>
    </Tag>
  );
}

function DocLink({ href = "", children }: { href?: string; children?: ReactNode }) {
  const navigate = useNavigate();
  if (/^https?:\/\//.test(href)) {
    return <a href={href} target="_blank" rel="noreferrer">{children}</a>;
  }
  const onClick = (e: MouseEvent<HTMLAnchorElement>) => {
    if (!href.startsWith("/") || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
    navigate({ href });
  };
  return <a href={href} onClick={onClick}>{children}</a>;
}

const components: Components = {
  h2: ({ children }) => <Heading as="h2">{children}</Heading>,
  h3: ({ children }) => <Heading as="h3">{children}</Heading>,
  a: ({ href, children }) => <DocLink href={href}>{children}</DocLink>,
};

function DocBody({ body }: { body: string }) {
  return (
    <div className="prose-app prose-docs mt-6">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {body}
      </ReactMarkdown>
    </div>
  );
}
```

Keep it this simple: no raw HTML (`rehype-raw`), no syntax highlighter, no MDX components. Each addition is a new
dependency and a new thing writers can break.

## Entry point in the app

```tsx
<DropdownMenuItem asChild>
  <a href="/docs" target="_blank" rel="noopener">
    <BookOpen /> {t("user.docs")}
    <ExternalLink className="ml-auto !size-3.5 text-muted-foreground" aria-hidden />
    <span className="sr-only">{t("user.opensInNewTab")}</span>
  </a>
</DropdownMenuItem>
<DropdownMenuSeparator />
```
