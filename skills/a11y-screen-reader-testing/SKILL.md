---
name: a11y-screen-reader-testing
description: Test pages with axe scans (browser, Playwright, CI) plus manual VoiceOver and NVDA passes, and record findings with WCAG criteria, steps and severity. Use before release, when reproducing a screen-reader bug, setting up a11y checks in CI, or writing up results.
---

# Screen-reader and automated accessibility testing

Automated tools find roughly a third of WCAG issues. Use them to clear the easy failures, then test by hand with a
keyboard and at least one screen reader.

## 1. Automated scan with axe

Browser: axe DevTools extension or Chrome Lighthouse (uses axe; fewer rules).

Playwright (preferred for CI):
```ts
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('checkout has no detectable WCAG A/AA violations', async ({ page }) => {
  await page.goto('/checkout');
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
    .exclude('#third-party-chat')
    .analyze();
  expect(results.violations).toEqual([]);
});
```
- Scan every **state**: open menus, dialogs, error states, expanded accordions, dark mode. axe only sees the DOM at
  the moment it runs.
- Unit level: `jest-axe` / `vitest-axe` with `toHaveNoViolations()` on rendered components (jsdom can't compute
  contrast or layout, so those rules don't run there).
- Treat `incomplete` ("needs review") results as manual checks, not passes.
- Don't blanket-disable rules to get green CI; exclude specific third-party regions and track them.

## 2. Pick screen reader + browser pairs

| Screen reader | Platform | Browser |
| --- | --- | --- |
| NVDA (free) | Windows | Firefox or Chrome |
| JAWS | Windows | Chrome |
| VoiceOver | macOS | Safari |
| VoiceOver | iOS | Safari |
| TalkBack | Android | Chrome |

Minimum for most teams: NVDA + Chrome/Firefox and VoiceOver + Safari (macOS and iOS for mobile-heavy products).
Check your analytics and the WebAIM screen reader survey for your audience.

## 3. VoiceOver (macOS) essentials

- Toggle: `Cmd+F5`. VO keys = `Ctrl+Option` (written `VO`).
- Read next/previous: `VO+Right` / `VO+Left`. Activate: `VO+Space`.
- Rotor (headings, links, landmarks, form controls): `VO+U`, then left/right arrows to switch lists.
- Quick Nav (single-key nav like `H` for headings): toggle with `Left+Right` arrows together, or enable single-key
  Quick Nav in VoiceOver Utility.
- Use the Caption Panel (on by default) to copy what was spoken into notes.

## 4. NVDA (Windows) essentials

- NVDA key: `Insert` (or `CapsLock` if configured). Stop speech: `Ctrl`.
- Browse mode single keys: `H` heading (`1`-`6` by level), `D` landmark, `F` form field, `K` link, `B` button,
  `T` table, `L` list. `Shift+` key goes backwards.
- Elements list: `NVDA+F7`. Toggle browse/focus mode: `NVDA+Space` (forms switch to focus mode automatically).
- Tables: `Ctrl+Alt+Arrows` to move by cell and hear headers.
- Speech Viewer (NVDA menu > Tools) shows spoken output; screenshot or copy it as evidence.

## 5. Manual test script per page

For each page/flow, record what was **announced** vs **expected**:
1. Page load: title announced; `lang` correct (pronunciation).
2. Landmarks list: main, navigation(s) with distinct names, no content outside landmarks.
3. Headings list reads like an outline; one h1.
4. Links list: every link makes sense out of context; no "click here" duplicates.
5. Forms: each field announces label, role, required, current value, hint; submit with errors and check announcement
   and focus.
6. Widgets: menus, tabs, dialogs, comboboxes announce role, name, state, and state changes (expanded/collapsed,
   selected, checked).
7. Dynamic updates: toasts, "Saved", result counts, loading states are announced once, without stealing focus.
8. Images: informative images described, decorative ignored.
9. Route changes in SPAs: new page is announced and focus/reading position is sensible.
10. Repeat key tasks end to end (sign in, search, purchase) using only the screen reader.

## 6. Recording findings

One finding per issue:
```
ID: A11Y-012
Page/component: /checkout - Shipping method radio group
WCAG: 1.3.1 Info and Relationships (A); 4.1.2 Name, Role, Value (A)
Environment: NVDA 2025.x + Firefox, Windows 11
Steps: Tab to shipping options; press Down arrow
Actual: Announces "radio button, not checked, 1 of 3" with no label or group question
Expected: "Delivery method, grouping. Standard, 3-5 days, radio button, checked, 1 of 3"
Severity: High (blocks choosing delivery confidently)
Fix suggestion: wrap in <fieldset><legend>Delivery method</legend>; associate labels with for/id
Evidence: speech viewer log, screenshot
```

Severity scale:
- **Critical**: blocks a core task for a group of users (keyboard trap, unlabeled submit, inaccessible CAPTCHA).
- **High**: task possible only with major effort or workaround.
- **Medium**: causes confusion or slows users; core task still completable.
- **Low**: best-practice or minor annoyance.

## 7. Pitfalls

- Testing with the screen reader only in "read everything" mode; real users navigate by headings, landmarks and form
  fields.
- Testing VoiceOver in Chrome only; VoiceOver behaves best (and is used most) with Safari.
- Assuming an ARIA attribute works because axe passes; check the announcement.
- Mouse use during a screen-reader test (masks focus bugs).
- Logging browser/SR bugs as site bugs: confirm against a known-good pattern (WAI-ARIA APG examples) first.
