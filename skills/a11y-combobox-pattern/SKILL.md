---
name: a11y-combobox-pattern
description: 'Build or review accessible combobox, autocomplete and searchable-select widgets with the ARIA 1.2 pattern: input role, listbox, aria-activedescendant, keyboard model, result announcements. Use when a native select isn''t enough or an autocomplete fails keyboard or screen-reader users.'
---

# Accessible combobox / autocomplete

A combobox is an input with a popup of suggestions. It's one of the hardest widgets to get right. Decide first if you
need one.

## 0. Do you need a custom combobox?

| Need | Use |
| --- | --- |
| Pick one of < ~15 fixed options | native `<select>` |
| Free text with optional suggestions, simple | `<input list>` + `<datalist>` (styling limited; test with your SR pairs) |
| Search/filter long lists, async results, rich options | custom combobox (this skill) or a vetted library |

Vetted libraries: React Aria `useComboBox`/`ComboBox`, Downshift `useCombobox`, Headless UI `Combobox`, Radix-based
command menus (check their combobox semantics). Prefer one over hand-rolling; still test it.

## 1. Markup (ARIA 1.2 pattern, list autocomplete)

```html
<label id="city-label" for="city">City</label>
<input id="city" type="text" role="combobox"
       aria-autocomplete="list" aria-expanded="true" aria-controls="city-listbox"
       aria-activedescendant="city-opt-2" autocomplete="off">
<ul id="city-listbox" role="listbox" aria-labelledby="city-label">
  <li id="city-opt-1" role="option" aria-selected="false">Berlin</li>
  <li id="city-opt-2" role="option" aria-selected="true">Bern</li>
</ul>
<div role="status" class="sr-only">2 results available.</div>
```

- `role="combobox"` goes **on the input** (ARIA 1.2), not on a wrapper.
- `aria-expanded` reflects whether the listbox is shown; when collapsed, hide the listbox (`hidden`) and drop
  `aria-activedescendant`.
- DOM focus **stays in the input**; the highlighted option is communicated with `aria-activedescendant` (id of the
  option) and `aria-selected="true"` on that option, plus a visible highlight style.
- `aria-autocomplete`: `list` (popup filters), `both` (popup + inline completion of the input text), `none`.
- Option ids must be unique and stable while the list is shown.
- `autocomplete="off"` stops the browser's own autofill popup from covering yours (use a real token if the field is
  personal data like an address).

## 2. Keyboard model

| Key | Behaviour |
| --- | --- |
| Typing | filters, opens the popup if there are results, resets highlight |
| `Down` | opens popup if closed; moves highlight to next option (wraps or stops; be consistent) |
| `Up` | moves highlight to previous option |
| `Alt+Down` | opens without moving highlight |
| `Enter` | accepts highlighted option, closes popup, input shows its text; if nothing highlighted, submits as typed |
| `Esc` | closes popup; second `Esc` clears input (optional) |
| `Tab` | closes popup; accept highlighted value only if that's your documented behaviour; moves focus on |
| `Home`/`End` | move caret in the input (don't hijack) |

Mouse/touch: clicking an option selects it and keeps focus in the input. Use `onMouseDown={e => e.preventDefault()}`
on options so the input doesn't blur before the click registers.

## 3. Announcements

- Result count after filtering, debounced (~300-500 ms): "5 results available" / "No results" in a polite
  `role="status"` region that exists from page load.
- Don't announce on every keystroke; announce when typing pauses.
- Async: show and announce "Loading..." only if results take longer than ~1 s.
- Selected value is announced by the input's value change; avoid extra alerts.

## 4. Multi-select (tags/chips)

- Selected items render as a list of buttons ("Remove Berlin") before the input.
- Listbox gets `aria-multiselectable="true"`; options toggle `aria-selected`.
- Backspace in an empty input removes the last chip; announce "Berlin removed".

## 5. Visual requirements

- Highlighted option is visually distinct beyond colour (outline or background plus check icon), contrast 3:1.
- Popup doesn't cover the input; it fits at 320 px width and 400% zoom with scrolling.
- Highlighted option scrolls into view: `el.scrollIntoView({ block: 'nearest' })`.
- Option targets at least 24x24 px (2.5.8).

## 6. Test matrix

1. Keyboard only: type, arrow, Enter, Esc, Tab, reopen.
2. NVDA + Firefox/Chrome: each arrow announces the option text and position ("Bern, 2 of 5"); count is announced.
3. VoiceOver + Safari (macOS and iOS): the most fragile pair for `aria-activedescendant`; confirm options are read.
4. TalkBack + Chrome if mobile matters.
5. axe: `aria-required-children`, `aria-valid-attr-value` (activedescendant ids exist), `label`.

## Pitfalls

- `role="combobox"` on a `div` wrapper with an inner textbox (ARIA 1.1 pattern): inconsistent support today.
- Moving DOM focus into the options: breaks typing and the virtual cursor.
- `aria-activedescendant` pointing at an id that's been re-rendered away.
- Using `role="menu"`/`menuitem` for suggestions.
- Filtering that ignores diacritics or case surprises users ("Zurich" vs "Zürich"); normalise.
- Selecting on hover.
