---
name: a11y-dialog-pattern
description: Build accessible modal and non-modal dialogs with native <dialog> (showModal, inert background, Esc, labelling, initial focus, focus return), or fix custom div modals. Use when adding or reviewing any modal, drawer, lightbox, sheet or confirm prompt.
---

# Accessible dialogs

Default to the native `<dialog>` element. It handles the hard parts (inert background, top layer, `Esc`) and is
supported in all current browsers.

## 1. Modal dialog with `<dialog>`

```html
<button type="button" id="open-delete">Delete project</button>

<dialog id="confirm-delete" aria-labelledby="cd-title" aria-describedby="cd-desc">
  <h2 id="cd-title">Delete project?</h2>
  <p id="cd-desc">This permanently deletes "Website redesign" and its 42 tasks.</p>
  <form method="dialog">
    <button value="cancel" autofocus>Cancel</button>
    <button value="confirm">Delete project</button>
  </form>
</dialog>
```
```js
const dlg = document.getElementById('confirm-delete');
openBtn.addEventListener('click', () => dlg.showModal());
dlg.addEventListener('close', () => { if (dlg.returnValue === 'confirm') deleteProject(); });
```

What `showModal()` gives you:
- Rendered in the top layer with `::backdrop`; the rest of the page is inert (no focus, no clicks, hidden from AT).
- `Esc` fires `cancel` then closes. `<form method="dialog">` closes it and sets `returnValue`.
- Focus moves into the dialog on open; browsers restore focus to the previously focused element on close.

Your job:
1. **Name**: `aria-labelledby` pointing at the visible heading (or `aria-label` if no heading).
2. **Initial focus**: put `autofocus` on the right element:
   - Destructive confirm: the least destructive action (Cancel).
   - Form dialog: the first field.
   - Long content: the heading or dialog container with `tabindex="-1"` so reading starts at the top.
3. **Close button**: a visible `<button>` with a name ("Close"); icon-only needs `aria-label`.
4. **Focus return**: if the trigger may be gone after closing (deleted row), move focus to a sensible element yourself
   in the `close` handler.
5. **Scroll lock**: `body:has(dialog[open]) { overflow: hidden; }`.
6. Use `show()` (non-modal) only for dialogs that must let users keep working in the page; they don't make the rest
   inert and don't close on `Esc` by default.

Use `requestClose()` or `cancel` event handling for "unsaved changes" prompts: call `event.preventDefault()` on
`cancel` to keep it open. Light dismiss via backdrop click: the `closedby="any"` attribute where supported, or a click
handler checking `event.target === dlg`.

## 2. React

```tsx
function Modal({ open, onClose, title, children }: Props) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const d = ref.current!;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);
  return (
    <dialog ref={ref} aria-labelledby="m-title" onClose={onClose}>
      <h2 id="m-title">{title}</h2>
      {children}
      <button type="button" onClick={onClose}>Close</button>
    </dialog>
  );
}
```
- Keep parent state in sync via `onClose` (fires on `Esc` too).
- Use `useId()` for the title id when several modals can exist.
- Headless libraries (Radix Dialog, React Aria `Modal`, Headless UI `Dialog`) are acceptable alternatives; verify they
  set name, inert background and focus return.

## 3. Fixing a custom div modal

If you can't switch to `<dialog>`:
```html
<div role="dialog" aria-modal="true" aria-labelledby="t" tabindex="-1"> ... </div>
```
1. On open: save `document.activeElement`; set `inert` on every sibling of the modal root (e.g. `#app`); move focus
   into the dialog.
2. Handle `Esc` to close.
3. On close: remove `inert`, restore focus to the saved element.
4. Render the dialog outside the inert container (portal to `body`).
`aria-modal="true"` alone does not stop focus or virtual cursor from leaving; `inert` does.

## 4. Drawers, sheets, popovers

- Side drawers that block the page are modal dialogs: same rules.
- Menus, tooltips and non-blocking popovers aren't dialogs. The `popover` attribute (`popovertarget`) gives light
  dismiss and top layer without inertness; it's suitable for menus/pickers, not for confirmations.
- Toasts are not dialogs; use a `role="status"` region and never move focus to them.

## 5. Test

- Keyboard: open with Enter/Space, Tab cycles only inside, Shift+Tab wraps, `Esc` closes, focus returns.
- Screen reader: announces "dialog", its name, and (if set) description; virtual cursor can't read the page behind.
- Zoom 400% / small viewport: content scrolls inside the dialog and buttons stay reachable.
- axe: `aria-dialog-name`, `aria-hidden-focus`.

## Pitfalls

- `display: none` toggling instead of `showModal()`: no inertness, no `Esc`.
- `aria-hidden="true"` on the app root while the modal is a child of it: hides the modal too.
- Opening a dialog on page load or on focus without user action.
- Autofocusing the destructive button in a confirm dialog.
- Nested modals: avoid; if unavoidable, each one `showModal()`s on top and returns focus to the previous one.
- Using `open` attribute directly (`<dialog open>`) for modals: renders non-modal.
