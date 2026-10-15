---
name: a11y-aria-usage
description: Apply ARIA roles, states and properties correctly (names, aria-expanded/current/pressed, live regions, aria-hidden) and remove redundant or harmful ARIA. Use when building custom widgets, reviewing aria-* code, or fixing axe ARIA and WCAG 4.1.2 Name, Role, Value issues.
---

# Using ARIA correctly

ARIA changes the accessibility tree only. It adds no keyboard behaviour, focusability or styling. Bad ARIA is worse
than none: pages with more ARIA routinely have more detected errors.

## 1. The five rules (W3C "Using ARIA")

1. Use a native element if one exists (`<button>`, `<a href>`, `<input type="checkbox">`, `<dialog>`, `<details>`).
2. Don't change native semantics (`<h2 role="tab">`); wrap instead (`<div role="tab"><h2>..`) or rethink.
3. Every interactive ARIA control must be keyboard operable.
4. Never put `role="presentation"`/`role="none"` or `aria-hidden="true"` on a focusable element.
5. Every interactive element needs an accessible name.

## 2. Accessible name: priority order

1. `aria-labelledby` (references visible text by id; can concatenate several ids)
2. `aria-label`
3. Native label: `<label for>`, `alt`, `<caption>`, `<legend>`, `<figcaption>`, `title` as last resort
4. Content (for roles that allow name from content: button, link, tab, option, menuitem, heading, cell)

Decision rules:
- Visible label exists -> `aria-labelledby` or native `<label>`. Use `aria-label` only when there is no visible text
  (icon buttons).
- `aria-label` on generic `div`/`span` with no role is not reliably announced. Give it a role or use visible text.
- `aria-label` overrides content: `<button aria-label="Close">X Close</button>` is announced only as "Close".
- Translation tools often skip `aria-label`; prefer visible or `.sr-only` text in multilingual products.
- `aria-describedby` adds a description (hint, error, format) read after the name and role.

## 3. States you'll use most

| Attribute | On | Meaning |
| --- | --- | --- |
| `aria-expanded="true|false"` | the button that toggles | disclosure, accordion, menu button, combobox |
| `aria-controls="id"` | same button | points at the controlled element (low support; harmless) |
| `aria-pressed="true|false"` | `<button>` | toggle button. The name must not change with state |
| `aria-current="page|step|date|true"` | link/item | current item in a set (nav, breadcrumb, stepper) |
| `aria-selected` | `tab`, `option`, `gridcell` | selection within a composite widget only |
| `aria-checked` | `checkbox`, `switch`, `menuitemcheckbox` roles | checked state of custom controls |
| `aria-disabled="true"` | control | disabled but still focusable/discoverable; block the action in JS |
| `aria-invalid="true"` | form field | value failed validation (see `a11y-forms-errors`) |
| `aria-busy="true"` | region | content updating; some SRs delay announcements |

Keep states in sync with the UI from the same source of truth: derive `aria-expanded={open}` from the same `open`
state that shows the panel.

## 4. Common widget patterns (WAI-ARIA Authoring Practices)

**Disclosure** (show/hide section): `<button aria-expanded>` + panel. No `role` needed. Prefer `<details>` if styling
allows.

**Tabs**:
```html
<div role="tablist" aria-label="Account settings">
  <button role="tab" id="t1" aria-selected="true" aria-controls="p1">Profile</button>
  <button role="tab" id="t2" aria-selected="false" aria-controls="p2" tabindex="-1">Billing</button>
</div>
<div role="tabpanel" id="p1" aria-labelledby="t1" tabindex="0">...</div>
<div role="tabpanel" id="p2" aria-labelledby="t2" hidden>...</div>
```
Arrow keys move between tabs (roving tabindex), Home/End to first/last; Tab moves into the panel.

**Menu button**: `role="menu"`/`menuitem` is for application-style command menus (like a desktop app menu). Site
navigation dropdowns are **not** menus: use a disclosure button with a list of links.

**Dialog** and **combobox**: see `a11y-dialog-pattern` and `a11y-combobox-pattern`.

## 5. Live regions

```html
<div role="status" aria-live="polite" class="sr-only" id="announcer"></div>   <!-- present on page load -->
```
- The container must exist in the DOM **before** text is inserted; inserting a new element that already contains text
  is often not announced.
- `role="status"` (polite) for "Saved", result counts, cart updates. `role="alert"` (assertive) only for urgent errors.
- Clear and re-set text to repeat the same message; keep messages short.
- Don't use live regions for content that receives focus anyway.

## 6. Hiding content

| Goal | Use |
| --- | --- |
| Hidden from everyone | `hidden` attribute or `display: none` |
| Visible, hidden from AT (decorative icon) | `aria-hidden="true"` (never on focusable content or its ancestors) |
| Hidden visually, available to AT | `.sr-only` class |
| Inert background behind a modal | `inert` attribute (removes focus and AT access) |

## 7. Redundant or harmful ARIA to remove

- `role="button"` on `<button>`, `role="link"` on `<a href>`, `role="navigation"` on `<nav>`, `role="main"` on `<main>`.
- `aria-label` that duplicates visible text exactly (harmless but noisy) or contradicts it (harmful, breaks 2.5.3).
- `role="presentation"` on elements with focusable children.
- `aria-hidden="true"` on `<body>` or app root while a modal is open (use `inert` on siblings or `<dialog>`).
- `role="menu"` on site navigation, `role="grid"` on simple data tables, `role="application"` anywhere.
- `aria-required` alongside native `required` (redundant).
- `tabindex` > 0.

## 8. Verify

- Inspect the computed name and role in DevTools' Accessibility pane for every changed control.
- Run axe; ARIA rules (`aria-allowed-attr`, `aria-required-children`, `aria-valid-attr-value`, `aria-hidden-focus`)
  catch structural mistakes.
- Test the interaction with a screen reader (`a11y-screen-reader-testing`): announced role, name, state change.
