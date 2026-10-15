---
name: a11y-keyboard-focus
description: 'Make UIs fully keyboard operable: logical tab order, visible and unobscured focus, skip links, roving tabindex, modal focus traps, focus on SPA route changes (WCAG 2.1.1, 2.4.3, 2.4.7, 2.4.11). Use when building interactive components or fixing lost or invisible focus.'
---

# Keyboard operability and focus management

Everything doable with a mouse must be doable with a keyboard alone, with focus always visible and in a sensible place.

## 1. Manual keyboard pass (do this first, takes 5 minutes)

Unplug the mouse mentally. From the address bar:
1. `Tab` through the page. Every interactive element receives focus, in reading order, and focus is always visible.
2. `Shift+Tab` goes back in reverse order.
3. `Enter` activates links and buttons; `Space` activates buttons, checkboxes; arrows operate radios, selects, sliders,
   tabs, menus.
4. `Esc` closes dialogs, popovers, menus and returns focus to the trigger.
5. Nothing traps focus except an open modal (2.1.2).
6. Focus never lands on hidden or off-screen content, and is never hidden behind a sticky header/footer or cookie
   banner (2.4.11 Focus Not Obscured, new in 2.2).

On macOS enable "Keyboard navigation" in System Settings > Keyboard and, in Safari, "Press Tab to highlight each item".

## 2. tabindex rules

| Value | Use |
| --- | --- |
| none | native interactive elements: already focusable |
| `0` | custom interactive element that can't be native (rare) |
| `-1` | programmatic focus targets: headings after route change, `<main>` for skip link, inactive items in roving tabindex |
| `>0` | never. It overrides DOM order for the whole page |

Fix tab order by fixing **DOM order**. CSS reordering (`order`, `flex-direction: row-reverse`, grid placement) changes
visual order but not focus order (2.4.3, 1.3.2).

## 3. Focus visibility

```css
:focus-visible { outline: 3px solid var(--focus-ring); outline-offset: 2px; }
/* only if a design system removes outlines globally: */
:focus:not(:focus-visible) { outline: none; }
```
- Never `outline: none` without a replacement. `box-shadow` rings disappear in Windows forced-colors mode; use
  `outline` (it can be `outline-color: transparent` plus a box-shadow, which keeps a visible outline in forced colors).
- The indicator needs 3:1 contrast against adjacent colours (1.4.11; see `a11y-color-contrast`).
- Sticky headers obscuring focused elements: `html { scroll-padding-top: <header height>; }`.

## 4. Skip link (2.4.1)

```html
<a href="#main" class="skip-link">Skip to main content</a>
...
<main id="main" tabindex="-1">
```
```css
.skip-link { position: absolute; left: 1rem; top: -100px; }
.skip-link:focus { top: 1rem; }
```
First focusable element on the page, visible on focus, and focus actually moves (`tabindex="-1"` on target).

## 5. Composite widgets: roving tabindex

Tabs, toolbars, radio groups, listboxes, menus, grids: the widget is **one tab stop**; arrow keys move inside it.

```ts
function onKeyDown(e: React.KeyboardEvent, index: number) {
  const last = items.length - 1;
  const next = { ArrowRight: index === last ? 0 : index + 1, ArrowLeft: index === 0 ? last : index - 1,
                 Home: 0, End: last }[e.key];
  if (next === undefined) return;
  e.preventDefault();
  setActive(next);              // active item renders tabIndex={0}, others tabIndex={-1}
  refs.current[next]?.focus();
}
```
Use `aria-activedescendant` instead when focus must stay in an input (combobox).

## 6. Modals and overlays

- Prefer `<dialog>` + `showModal()`: background becomes inert, `Esc` closes. See `a11y-dialog-pattern`.
- Custom overlays: set `inert` on siblings of the overlay root, move focus in on open, restore focus to the trigger on
  close (store `document.activeElement` before opening).
- Popovers/menus that aren't modal: don't trap focus; close on `Esc` and on focus leaving.

## 7. Focus after changes

| Event | Move focus to |
| --- | --- |
| SPA route change | the new page's `<h1 tabindex="-1">` (or `<main>`), and update `document.title` |
| Item deleted from list | next item, previous item, or list heading |
| Inline form error on submit | error summary or first invalid field |
| Content loaded via "Load more" | first new item |
| Dialog closed | the element that opened it (or a sensible fallback if it was removed) |

Next.js App Router announces route changes via its built-in route announcer but doesn't move focus; add a small client
component that focuses the `h1` when `usePathname()` changes if your audit requires it.

## 8. Other keyboard criteria

- 2.1.4 Character key shortcuts: single-key shortcuts must be remappable, disableable, or active only on focus.
- 2.5.7 Dragging movements (2.2): drag-and-drop (sortable lists, sliders, maps) needs a single-pointer alternative,
  and keyboard users need buttons/arrow keys to reorder.
- Hover-only content (tooltips, mega menus) must also open on focus and be dismissible with `Esc` (1.4.13).
- `onClick` on a `div` gives no keyboard access; use a `<button>`.

## Automated checks

```ts
// Playwright: assert tab order and visible focus
await page.keyboard.press('Tab');
await expect(page.getByRole('link', { name: 'Skip to main content' })).toBeFocused();
```
axe catches `tabindex` > 0, `aria-hidden` focusable content and missing names, but not order, traps or visibility:
the manual pass in section 1 is required.

## Pitfalls

- `disabled` buttons are removed from tab order and can hide why an action is unavailable; consider `aria-disabled`.
- Focus lost to `<body>` after deleting the focused element or closing a menu.
- Off-canvas menus that are visually hidden but still tabbable (use `hidden`/`inert` when closed).
- Autofocusing inputs on page load, which skips context for screen-reader users.
