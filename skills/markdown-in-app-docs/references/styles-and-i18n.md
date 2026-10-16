# Styles and strings

## Prose styles (`index.css`)

One hand-written prose class for all rendered markdown in the app (`.prose-app` here; name it after your brand), plus
a docs override. All colours are theme tokens, so light and dark mode need nothing extra.

```css
.prose-app { font-size: 15px; line-height: 1.65; max-width: 72ch; }
.prose-app > * + * { margin-top: 0.9em; }
.prose-app > :first-child { margin-top: 0; }

.prose-app h2, .prose-app h3, .prose-app h4 { font-weight: 600; line-height: 1.3; }
.prose-app h2 { padding-bottom: 0.3em; border-bottom: 1px solid var(--line); }

.prose-app ul { list-style: square; padding-left: 1.4em; }
.prose-app ol { list-style: decimal; padding-left: 1.4em; }
.prose-app li::marker { color: var(--accent); }
.prose-app li + li { margin-top: 0.25em; }

.prose-app a { color: var(--primary); text-decoration: underline; text-underline-offset: 3px; }

.prose-app :not(pre) > code { font-size: 0.86em; padding: 0.1em 0.35em; border-radius: 4px; background: var(--surface-2); }
.prose-app pre {
  font-size: 13px; line-height: 1.55; padding: 0.9em 1em; border-radius: 8px; overflow-x: auto;
  background: var(--code-bg); color: var(--code-fg);
}

.prose-app blockquote { border-left: 3px solid var(--accent); padding-left: 1em; color: var(--muted-foreground); }

.prose-app table { display: block; overflow-x: auto; border-collapse: collapse; font-size: 14px; }
.prose-app th, .prose-app td { border: 1px solid var(--line); padding: 0.4em 0.7em; text-align: left; vertical-align: top; }
.prose-app th { background: var(--surface-2); font-weight: 600; }

/* The docs at /docs: the page sets the measure, and headings get more room. */
.prose-docs { max-width: none; }
.prose-docs h2 { font-size: 1.4rem; margin-top: 2em; }
.prose-docs h3 { font-size: 1.1rem; margin-top: 1.6em; }
```

Define `--code-bg`/`--code-fg` for both themes; don't reuse the page background, or code blocks disappear in one theme.
`display: block` on tables is what stops wide tables from causing page-level horizontal scroll on phones.

## Strings (`locales/en/docs.json`)

All chrome strings live in a `docs` namespace registered with the others. Page content is not translated.

```json
{
  "title": "Docs",
  "titleSuffix": "Product Docs",
  "home": "Product home",
  "openApp": "Open Product",
  "openRegistry": "Browse the registry",
  "skipToContent": "Skip to content",
  "openNavigation": "Open docs navigation",
  "navLabel": "Docs",
  "onThisPage": "On this page",
  "pager": "Previous and next page",
  "previous": "Previous",
  "next": "Next",
  "sections": { "start": "Get started", "setup": "Set up your organisation", "use": "Use the product", "publish": "Publish" },
  "notFound": { "title": "This page doesn't exist", "body": "It may have moved. The sidebar lists every page.", "back": "Back to the docs" }
}
```

Every `DOCS_NAV[].key` needs a `sections.<key>` entry. Add `user.docs` and `user.opensInNewTab` to the namespace that
holds the profile menu.
