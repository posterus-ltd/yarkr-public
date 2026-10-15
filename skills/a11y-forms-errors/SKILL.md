---
name: a11y-forms-errors
description: 'Build accessible forms: visible labels, hints, required state, autocomplete tokens, fieldsets, inline errors tied to fields, error summaries and focus, WCAG 2.2 redundant entry and accessible authentication. Use when creating or reviewing forms, sign-in, checkout or validation.'
---

# Accessible forms and error handling

## 1. Every field

```html
<label for="email">Email address</label>
<p id="email-hint" class="hint">We'll send the receipt here.</p>
<input id="email" name="email" type="email" autocomplete="email" required
       aria-describedby="email-hint email-error" aria-invalid="true">
<p id="email-error" class="error"><span class="sr-only">Error:</span> Enter an email address like name@example.com</p>
```

- A visible `<label>` bound with `for`/`id` (or wrapping the input). Placeholder is not a label: it disappears, often
  fails contrast, and is not reliably announced.
- Hints and errors linked via `aria-describedby` (space-separated ids; include the error id only while it exists).
- `required` attribute plus a visible indicator. If you mark required fields with `*`, explain it once at the top; or
  mark optional fields "(optional)" instead when most are required.
- Correct `type` (`email`, `tel`, `url`, `number` only for real quantities) and `inputmode` for mobile keyboards.
- `autocomplete` tokens for personal data (1.3.5): `name`, `given-name`, `email`, `tel`, `street-address`,
  `postal-code`, `cc-number`, `username`, `current-password`, `new-password`, `one-time-code`.
- Label text stays visible while typing and matches the accessible name (2.5.3).

## 2. Groups

- Radio and checkbox groups: `<fieldset>` + `<legend>` with the question ("Delivery method").
- Related inputs (date as day/month/year, address): `<fieldset>` + `<legend>`, each input with its own label.
- Custom radio cards: keep real `<input type="radio">` inside, visually styled; don't rebuild with divs.

## 3. Validation strategy

- Validate **on submit** first; then re-validate an invalid field on input/blur so the error clears as it's fixed.
  Don't show errors on blur of an untouched field or while the user is still typing.
- Keep server-side validation as the source of truth; client validation is a convenience.
- If you use custom messages, add `noValidate` on the form to suppress inconsistent browser bubbles, and implement all
  checks yourself.
- Don't disable the submit button until the form is valid. Users can't discover what's missing. Let them submit and
  show errors.

## 4. Error messages (3.3.1, 3.3.3)

- Identify the field and say how to fix it: "Enter a date in the past", not "Invalid input".
- Show next to the field, in text (not only red colour or an icon - 1.4.1), and set `aria-invalid="true"`.
- Preserve the user's input. Never clear the form on error (except password fields if policy requires).

## 5. Error summary on submit

```html
<div role="alert" tabindex="-1" id="error-summary" aria-labelledby="error-summary-title">
  <h2 id="error-summary-title">There is a problem</h2>
  <ul>
    <li><a href="#email">Enter an email address like name@example.com</a></li>
    <li><a href="#postcode">Enter a postcode</a></li>
  </ul>
</div>
```
- On a failed submit with several errors: render the summary at the top, move focus to it (`summary.focus()`), and
  prefix `document.title` with "Error: ".
- Each link focuses its field (links to `#id` move focus to the input in modern browsers; otherwise call `focus()`).
- Single-field forms (search, newsletter): skip the summary and focus the invalid field.
- Use either focus movement or `role="alert"` as the main announcement mechanism; moving focus into an alert region
  can double-announce. Test with a screen reader.

## 6. Success and async status

- After async submit, announce the result: `<p role="status">Saved</p>` (region present before update), or navigate
  to a confirmation page with a clear `<h1>`.
- While pending, keep the button focusable, show "Saving...", ignore repeat clicks, and don't steal focus.

## 7. WCAG 2.2 additions

- **3.3.7 Redundant Entry (A)**: don't ask for the same information twice in one process. Prefill, or offer "Same as
  billing address".
- **3.3.8 Accessible Authentication (Minimum) (AA)**: no cognitive function test (remembering, transcribing,
  puzzles) without an alternative. Allow paste into password and OTP fields, support password managers
  (`autocomplete="current-password"`), allow passkeys/magic links, and offer non-puzzle CAPTCHA alternatives. Object
  recognition or personal-content CAPTCHAs are allowed at AA but still a barrier.
- **3.2.6 Consistent Help (A)**: help/contact links appear in the same relative place across pages.
- **2.5.8 Target Size (AA)**: inputs, checkboxes and icon buttons at least 24x24 CSS px, or spaced so a 24px circle
  around each doesn't overlap another target.

## 8. Error prevention for legal/financial submissions (3.3.4)

Submissions that commit money, legal agreements or delete data must be reversible, checked, or confirmed: add a review
step or confirmation dialog.

## 9. Testing

1. Submit the empty form with keyboard only. Focus goes to the summary or first error; each error is reachable.
2. Screen reader: each field announces label, role, required, invalid and hint/error text.
3. Zoom to 200% and 400% (reflow, 1.4.10): labels and errors stay next to their fields.
4. axe rules: `label`, `autocomplete-valid`, `aria-valid-attr-value`, `form-field-multiple-labels`.

## Pitfalls

- Errors rendered in a newly inserted live region (not announced) - render the container upfront.
- `aria-describedby` pointing to an id that doesn't exist.
- Floating labels that shrink below contrast or size thresholds.
- Required checkbox ("I accept terms") without an error message tied to it.
- Character counters announcing on every keystroke; debounce and announce near the limit only.
