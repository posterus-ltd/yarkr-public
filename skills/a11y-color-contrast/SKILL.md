---
name: a11y-color-contrast
description: 'Check and fix colour contrast for WCAG 2.2 AA: text (1.4.3), UI components and graphics (1.4.11), focus rings, colour-only cues (1.4.1), forced colours and dark mode. Use when reviewing palettes or tokens, fixing axe color-contrast failures, or styling states.'
---

# Colour contrast (WCAG 2.2 AA)

## 1. Thresholds

| What | Ratio | Criterion |
| --- | --- | --- |
| Body text (< 24px regular, < 18.66px bold) | **4.5:1** | 1.4.3 |
| Large text (>= 24px, or >= 18.66px and bold 700) | **3:1** | 1.4.3 |
| UI component boundaries needed to identify them (input borders, toggle tracks, checkbox outlines) | **3:1** against adjacent colours | 1.4.11 |
| States conveyed visually (selected tab underline, checked state, focus ring) | **3:1** | 1.4.11 |
| Meaningful graphics (chart lines, icon-only buttons' icons) | **3:1** | 1.4.11 |
| Disabled controls, pure decoration, logos | exempt | - |

- Ratios are not rounded: 4.49:1 fails.
- 24px = 18pt; 18.66px = 14pt. Use computed CSS px; `rem` depends on root font size.
- AAA (7:1, 4.5:1 large) is not required for AA conformance.
- Contrast is measured against the **actual** background, including images and gradients: test the worst spot.

## 2. How to measure

- Chrome DevTools: inspect an element > colour picker shows ratio with AA/AAA marks; the Accessibility pane shows
  computed contrast. CSS Overview panel lists all low-contrast text on a page.
- axe `color-contrast` rule (automated, text only; reports "needs review" over images/gradients/pseudo-elements).
- Formula for scripts and token linting (WCAG 2.x relative luminance):

```ts
const lin = (c: number) => { c /= 255; return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; };
const lum = ([r, g, b]: number[]) => 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
export const ratio = (a: number[], b: number[]) => {
  const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};
// ratio([118,118,118],[255,255,255]) -> 4.54  (#767676 is the lightest grey passing on white)
```

Note: APCA (a proposed method for WCAG 3) is not the conformance test for 2.2. Use it only as an extra signal.

## 3. Audit procedure for a page or component library

1. List every text/background pair from design tokens: body, muted/secondary, link, placeholder, error, success,
   warning, text on primary buttons, text on badges, text on images.
2. Compute ratios for light **and** dark themes. Put them in a table; mark failures.
3. For each interactive component, check boundary vs page background (1.4.11) and every state: default, hover,
   focus, active, selected, error. Disabled is exempt but must still look disabled.
4. Check the focus ring against both the component and the page background.
5. Check text over images/video: add a scrim (`linear-gradient(rgba(0,0,0,.6), rgba(0,0,0,.6))`) or text shadow
   and re-test at the lightest point.
6. Turn on Windows High Contrast / `forced-colors: active` emulation (DevTools > Rendering) and confirm borders,
   focus rings and icons remain visible.

## 4. Fix strategies (prefer in this order)

1. Adjust the token's lightness (keep hue) until it passes. Darken text on light backgrounds; lighten on dark.
2. Use a different token for small text than for large headings or fills (e.g. `--brand-600` for text, `--brand-500`
   for large fills).
3. Add a border or underline that passes 3:1 instead of relying on a low-contrast fill.
4. Increase size/weight only if the text genuinely qualifies as large afterwards.

Common failing tokens: placeholder grey, muted helper text, white text on brand orange/green/yellow, links on
tinted backgrounds, input borders at #ccc-ish greys (about 1.6:1 on white), toast text on semi-transparent backgrounds.

## 5. Use of colour (1.4.1)

Colour can't be the **only** way to convey information:
- Links in body text: underline them, or 3:1 contrast with surrounding text **plus** a non-colour cue on hover/focus.
- Errors: icon + text, not just a red border.
- Charts: patterns, direct labels or shapes in addition to hue; check with a colour-blindness emulator
  (DevTools > Rendering > Emulate vision deficiencies).
- Required fields, statuses (online/offline), diff views: add text or icons.

## 6. Forced colours and dark mode

```css
@media (forced-colors: active) {
  .btn { border: 1px solid ButtonText; }          /* backgrounds are overridden; borders keep shape */
  .icon { forced-color-adjust: auto; }
}
```
- Don't convey state with `background-color` alone; forced-colors mode removes it.
- SVG icons: `fill="currentColor"` so they follow the system colour.
- Dark themes need their own contrast table; don't assume inverted values pass.

## Pitfalls

- Testing only the default state; hover and selected states often fail.
- Opacity on text (`opacity: .6`) silently lowers contrast; compute with the blended colour.
- Relying on axe alone: it skips non-text contrast, focus rings and text over images.
- Brand guidelines treated as fixed: propose an accessible variant token rather than shipping failures.
