---
name: playwright-test-authoring
description: Write Playwright (@playwright/test) end-to-end tests with web-first assertions, auto-waiting, test steps and page objects that stay readable as suites grow. Use when adding or restructuring Playwright specs, fixing flaky waits, or reviewing e2e test code.
---

# Playwright test authoring

Write tests that describe user behaviour, rely on Playwright's auto-waiting, and stay independent of each other.

## Workflow

1. Name the user journey in one sentence before writing code ("a signed-in user can archive a project").
2. Check `playwright.config.ts` for `baseURL`, `testDir`, projects and `use` options; reuse them, don't hard-code URLs.
3. Write the test with role/label locators (see the `playwright-locators` skill) and web-first assertions.
4. Run it alone: `npx playwright test path/to/spec.ts -g "archive"` then with `--repeat-each=10` to shake out flakiness.
5. If it fails, open the trace (`playwright-trace-debugging`) before changing waits.

## Skeleton

```ts
import { test, expect } from '@playwright/test';

test.describe('project archive', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/projects');
  });

  test('archives a project from the list', async ({ page }) => {
    const row = page.getByRole('row', { name: /Apollo/ });

    await test.step('open the row menu', async () => {
      await row.getByRole('button', { name: 'More actions' }).click();
    });

    await test.step('archive and confirm', async () => {
      await page.getByRole('menuitem', { name: 'Archive' }).click();
      await page.getByRole('dialog').getByRole('button', { name: 'Archive' }).click();
    });

    await expect(row).toBeHidden();
    await expect(page.getByRole('status')).toHaveText('Project archived');
  });
});
```

## Assertions: always web-first

Web-first assertions retry until the timeout; plain value assertions check once and race the UI.

| Do | Don't |
| --- | --- |
| `await expect(locator).toBeVisible()` | `expect(await locator.isVisible()).toBe(true)` |
| `await expect(locator).toHaveText('Saved')` | `expect(await locator.textContent()).toBe('Saved')` |
| `await expect(locator).toHaveCount(3)` | `expect(await locator.count()).toBe(3)` |
| `await expect(page).toHaveURL(/\/settings/)` | `expect(page.url()).toContain('/settings')` |

- Use `expect.soft()` when you want to collect several independent checks in one test without stopping at the first.
- Use `expect.poll(() => fetchStatus())` or `expect(async () => {...}).toPass()` for non-DOM conditions (API state, files).
- Use `await expect(locator).toHaveAttribute`, `toBeChecked`, `toBeEnabled`, `toHaveValue` rather than reading properties.

## Waiting rules

- Never use `page.waitForTimeout()` in a committed test. It is either too short (flaky) or too long (slow).
- Actions (`click`, `fill`, `check`) already wait for the element to be attached, visible, stable, enabled.
- To wait for a network response tied to an action, start the wait first:
  ```ts
  const saved = page.waitForResponse((r) => r.url().includes('/api/projects') && r.request().method() === 'POST');
  await page.getByRole('button', { name: 'Save' }).click();
  expect((await saved).ok()).toBeTruthy();
  ```
- Prefer asserting on the visible outcome over waiting for the network at all.
- Avoid `waitForLoadState('networkidle')`; it is discouraged and flaky with polling or websockets.

## Page objects: thin and behaviour-named

Use a page object when two or more specs drive the same screen. Keep it as locators plus intent-level methods; keep
assertions in the test unless they are a reusable "is loaded" check.

```ts
import { type Page, type Locator, expect } from '@playwright/test';

export class ProjectsPage {
  readonly search: Locator;
  constructor(private readonly page: Page) {
    this.search = page.getByRole('searchbox', { name: 'Search projects' });
  }
  async goto() {
    await this.page.goto('/projects');
    await expect(this.page.getByRole('heading', { name: 'Projects' })).toBeVisible();
  }
  row(name: string) {
    return this.page.getByRole('row', { name });
  }
  async archive(name: string) {
    await this.row(name).getByRole('button', { name: 'More actions' }).click();
    await this.page.getByRole('menuitem', { name: 'Archive' }).click();
  }
}
```

Expose page objects through fixtures (`test.extend<{ projects: ProjectsPage }>`) so tests receive them ready-made.
Don't build deep inheritance hierarchies of pages; compose small component objects (table, dialog, nav) instead.

## Test independence and data

- Each test must pass when run alone and in any order; `fullyParallel: true` should be safe.
- Create the data a test needs through the API in a fixture or `beforeEach` (`request.post(...)`), not through the UI,
  and give it unique names (`Apollo-${test.info().workerIndex}-${Date.now()}`).
- Don't share mutable state between tests via module variables or `test.describe.serial` unless the flow truly is one
  journey; serial suites hide coupling and retry as a block.
- Clean up through the API in the fixture teardown, or use throwaway tenants per worker.

## Network control

- Mock third-party or slow dependencies with `page.route('**/api/flags', (route) => route.fulfill({ json: {...} }))`.
- Don't mock your own backend in e2e tests by default; that turns them into component tests. Do it deliberately for
  error states that are hard to produce (`route.fulfill({ status: 500 })`).

## Tags and annotations

- Tag with `test('...', { tag: '@smoke' }, async ...)` and run with `--grep @smoke`.
- `test.fixme()` for known-broken tests with an issue link; `test.slow()` to triple the timeout for a known slow flow;
  `test.skip(condition, reason)` for platform-specific gaps.

## Pitfalls

- Missing `await` on an action or `expect` silently races; enable `@typescript-eslint/no-floating-promises`.
- Asserting on exact timestamps, random IDs or locale-formatted numbers; pin `locale`/`timezoneId` in `use` or match regexes.
- Tests that pass locally but rely on dev-server state (seeded user from last run). Seed explicitly.
- One giant test per feature. Split by behaviour; use `test.step` for readability inside a journey.
- Raising global `timeout` to fix flakiness. Find the race in the trace instead.

## Review checklist

- [ ] Locators are role/label/test-id based; no positional CSS or XPath.
- [ ] Every assertion is web-first and awaited.
- [ ] No `waitForTimeout`, no `networkidle`.
- [ ] Test creates its own data and passes in isolation and with `--repeat-each`.
- [ ] Title states behaviour and expected outcome.
