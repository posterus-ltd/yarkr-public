---
name: a11y-semantic-html
description: Choose native HTML elements, landmarks, headings, lists, tables, alt text and page titles so pages are accessible before adding ARIA. Use when building or reviewing markup, replacing div-based widgets, or fixing axe findings on landmarks, headings, alt text or names.
---

# Semantic HTML for accessibility

Native elements carry role, name, state and keyboard behaviour for free. ARIA only changes what assistive tech is
told; it adds no behaviour. Fix markup first, then reach for ARIA (see `a11y-aria-usage`).

## 1. Element choice

| Need | Use | Not |
| --- | --- | --- |
| Navigates to a URL | `<a href="...">` | `<div onClick>`, `<a>` without `href`, `<button>` that calls `router.push` for plain links |
| Performs an action (submit, open, toggle) | `<button type="button">` | `<a href="#">`, `<span role="button">` |
| Choose one of few options | `<input type="radio">` in `<fieldset>` | styled divs |
| On/off | `<input type="checkbox">` (or `<button aria-pressed>` for toggles) | div with class `active` |
| Select from list | `<select>` | custom dropdown unless search/rich content is required |
| Disclosure | `<details><summary>` | div with click handler |
| Modal | `<dialog>` with `showModal()` | positioned div (see `a11y-dialog-pattern`) |
| Data grid | `<table>` with `<th>` | CSS grid of divs |

A `<button>` inside a `<form>` defaults to `type="submit"`; always set `type="button"` for non-submit buttons.

## 2. Page skeleton and landmarks

```html
<html lang="en">
<head><title>Invoices - Acme Billing</title></head>
<body>
  <a class="skip-link" href="#main">Skip to main content</a>
  <header>...site logo, <nav aria-label="Main">...</nav></header>
  <main id="main" tabindex="-1">
    <h1>Invoices</h1>
    ...
  </main>
  <aside aria-label="Help">...</aside>
  <footer>...</footer>
</body>
</html>
```

Rules:
- Exactly one `<main>`. `<header>`/`<footer>` are banner/contentinfo landmarks only when not nested in
  `article`/`section`/`main`.
- All visible content sits inside some landmark.
- Multiple `<nav>` (or `<aside>`) elements each get a distinct `aria-label` ("Main", "Breadcrumb", "Pagination").
- `<section>` is only a region landmark when it has an accessible name; don't name every section.
- `lang` on `<html>` (3.1.1); `lang` on inline passages in another language (3.1.2).
- Unique, descriptive `<title>` per page and per SPA route: "Page - Site" order (2.4.2).

## 3. Headings

- One `<h1>` describing the page's main content.
- Don't skip levels going down (h2 -> h4); going back up is fine.
- Pick the level from the outline, then style with CSS. Never pick `<h4>` because it looks small.
- Card titles in a list of cards are usually headings (h2/h3) so screen-reader users can jump between them.
- Don't use headings for visual emphasis on non-heading text.

## 4. Lists and tables

- Groups of similar items (nav links, cards, search results) use `<ul>`/`<ol>`. Screen readers announce the count.
  Note: Safari/VoiceOver drops list semantics when `list-style: none`; add `role="list"` on the `<ul>` if the count matters.
- Data tables: `<caption>`, `<th scope="col">`/`<th scope="row">`. Complex headers: `id` + `headers`.
- Never use tables for layout. If an existing layout table can't be removed, add `role="presentation"`.
- Sortable column: put a `<button>` inside the `<th>` and `aria-sort` on the `<th>` currently sorted.

## 5. Images and icons (1.1.1)

| Image | Markup |
| --- | --- |
| Informative | `alt` conveys the information, not "image of" |
| Decorative / redundant with adjacent text | `alt=""` (empty, not missing) |
| Functional (the only content of a link/button) | `alt` describes the action/destination: "Search", "Home" |
| Complex (chart) | short `alt` + longer description in text nearby or `<figure>/<figcaption>` |
| Inline SVG icon, decorative | `aria-hidden="true"` and `focusable="false"` |
| Icon-only button | `<button aria-label="Close">` with the SVG hidden, or visually hidden text |

Next.js `<Image>` requires `alt`; it can still be wrong. Check the content, not just presence.

## 6. Names for interactive elements (4.1.2, 2.4.4, 2.5.3)

- Link text makes sense out of context: "Download the 2025 annual report (PDF, 2 MB)", not "Click here".
- Repeated "Read more" links: add visually hidden context (`<span class="sr-only"> about pricing changes</span>`).
- The accessible name must contain the visible label text (2.5.3 Label in Name) so voice users can say what they see.

Visually hidden utility:
```css
.sr-only { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden;
  clip: rect(0 0 0 0); white-space: nowrap; border: 0; }
```

## 7. Review procedure

1. Run axe (DevTools extension or `@axe-core/playwright`) and fix landmark/heading/alt/name findings.
2. Open the browser's accessibility tree (Chrome DevTools > Elements > Accessibility, full-page tree view) and check
   roles and names of every control.
3. Use a headings/landmarks bookmarklet or screen-reader rotor: does the outline read like a table of contents?
4. Grep the codebase for anti-patterns:
   ```bash
   rg -n --glob '*.{tsx,jsx,html}' -e '<(div|span)[^>]*onClick' -e 'href="#"' .
   rg -n --pcre2 --glob '*.{tsx,jsx,html}' '<img(?![^>]*\balt=)' .
   ```

## Pitfalls

- `<div role="button" tabindex="0">` instead of `<button>`: needs Enter and Space handling, focus styles, disabled
  semantics - all free with `<button>`.
- Placeholder used as label.
- `aria-label` on a `<div>` or `<span>` with no role: ignored by most screen readers.
- Removing focus outlines with `outline: none` without a replacement (see `a11y-keyboard-focus`).
- Text in images. Use real text styled with CSS.
