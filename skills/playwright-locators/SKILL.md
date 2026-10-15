---
name: playwright-locators
description: Choose resilient Playwright locators (getByRole, getByLabel, getByTestId) and filter/chain them instead of brittle CSS or XPath. Use when writing or fixing selectors, when tests break after markup changes, or on strict-mode "resolved to N elements" errors.
---

# Playwright locators

A good locator finds the element the way a user (or assistive technology) would, and survives styling and layout changes.

## Priority order

1. `page.getByRole(role, { name })` - buttons, links, headings, textboxes, checkboxes, rows, dialogs, tabs.
2. `page.getByLabel('Email')` - form fields with a `<label>`, `aria-label` or `aria-labelledby`.
3. `page.getByPlaceholder(...)` - only when there is no label (and file a bug: missing label is an a11y issue).
4. `page.getByText('Order shipped')` - non-interactive content.
5. `page.getByAltText`, `page.getByTitle` - images and titled elements.
6. `page.getByTestId('invoice-total')` - when no user-facing attribute is stable or unique.
7. `page.locator('css=...')` - last resort, scoped inside a semantic parent; never long chains or `nth-child`.

If a role locator can't find a control, the markup is likely inaccessible. Prefer fixing the markup (add a label, use a
`<button>`) over falling back to CSS.

## Name matching

- `name` is a substring, case-insensitive match by default: `{ name: 'Save' }` also matches "Save draft".
- Use `{ name: 'Save', exact: true }` or a regex `{ name: /^Save$/ }` when there are near-duplicates.
- Accessible name comes from text content, `aria-label`, `aria-labelledby`, `alt`, or the associated `<label>`.
- Useful role options: `checked`, `pressed`, `expanded`, `selected`, `disabled`, `level` (for headings), `includeHidden`.

```ts
await expect(page.getByRole('heading', { name: 'Billing', level: 2 })).toBeVisible();
await page.getByRole('checkbox', { name: 'Accept terms' }).check();
await page.getByRole('button', { name: 'Filters', expanded: false }).click();
```

## Scoping: chain and filter

Narrow to a region first, then find inside it. This removes ambiguity without positional selectors.

```ts
const dialog = page.getByRole('dialog', { name: 'Delete project' });
await dialog.getByRole('button', { name: 'Delete' }).click();

const row = page.getByRole('row').filter({ hasText: 'INV-1042' });
await row.getByRole('button', { name: 'Download' }).click();

const card = page.getByRole('listitem').filter({
  has: page.getByRole('heading', { name: 'Pro plan' }),
});
await card.getByRole('link', { name: 'Choose' }).click();
```

- `filter({ hasText })`, `filter({ hasNotText })`, `filter({ has })`, `filter({ hasNot })`, `filter({ visible: true })`.
- `locator.and(other)` requires both to match the same element; `locator.or(other)` matches either (useful for "either
  the dialog or the banner appears", combined with `.first()`).
- Locators are lazy: define them once (e.g. at the top of the test or in a page object) and reuse; they re-resolve on use.

## Strict mode

Actions and assertions on a locator that matches more than one element throw "strict mode violation". Treat that as a
signal to scope better, not to add `.first()`.

- `.first()`, `.last()`, `.nth(i)` are acceptable only when order is the behaviour under test (e.g. sorted results).
- To assert on a list, use `await expect(page.getByRole('listitem')).toHaveCount(3)` or
  `toHaveText(['a', 'b', 'c'])` on the multi-element locator.

## Test ids

- Configure the attribute once if the app doesn't use `data-testid`: `use: { testIdAttribute: 'data-qa' }`.
- Add test ids for elements without a stable accessible name: canvas regions, charts, repeated icon-only cells.
- Name them by meaning (`order-total`), not by position or style (`right-col-3`).

## Frames and shadow DOM

- Iframes: `page.frameLocator('iframe[title="Payment"]').getByLabel('Card number')`, or
  `page.locator('iframe[title="Payment"]').contentFrame()` in recent versions.
- Open shadow DOM is pierced automatically by role/text/test-id and CSS locators; XPath does not pierce shadow roots.

## Finding locators fast

- `npx playwright codegen <url>` records actions with suggested locators.
- In UI mode (`npx playwright test --ui`) or the trace viewer, use the locator picker to inspect what a locator resolves to.
- `await page.pause()` while running headed opens the inspector for live experimentation; never commit it.

## Anti-patterns and fixes

| Brittle | Resilient |
| --- | --- |
| `page.locator('#root > div:nth-child(2) button.btn-primary')` | `page.getByRole('button', { name: 'Submit' })` |
| `page.locator('//div[@class="modal"]//button[2]')` | `page.getByRole('dialog').getByRole('button', { name: 'Confirm' })` |
| `page.locator('text=Delete').first()` | `row.getByRole('button', { name: 'Delete' })` |
| `page.locator('.css-1x2y3z')` (generated class) | `page.getByTestId('price-chart')` |
| `getByText('Save')` on a button | `getByRole('button', { name: 'Save' })` |

## Pitfalls

- Localised UIs: role names change per locale. Pin `locale` in the project config or use test ids for text-heavy controls.
- Text with dynamic numbers ("3 items"): use a regex `/\d+ items/` or assert separately with `toHaveText`.
- Hidden duplicates (mobile and desktop nav both in the DOM): scope to the visible region or use `filter({ visible: true })`.
- Icon-only buttons without `aria-label` have no name; fix the markup rather than locating by SVG path.
