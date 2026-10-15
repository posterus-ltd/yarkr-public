---
name: playwright-visual-regression
description: "Add visual regression checks with Playwright's toHaveScreenshot: stable rendering, masking dynamic content, thresholds, per-platform baselines and a reviewed baseline-update workflow. Use when adding screenshot tests or fixing noisy, flaky visual diffs."
---

# Visual regression with Playwright

Screenshot assertions catch layout and styling regressions that functional assertions miss. They only pay off when
they are deterministic; a noisy visual suite gets ignored.

## When to use them

- Use for: design-system components, key landing/checkout screens, charts, email/PDF previews, responsive breakpoints.
- Don't use for: every page of the app, content-heavy pages that change daily, or as a replacement for behaviour
  assertions. Pair each screenshot with at least one functional assertion.
- Prefer element screenshots (`expect(locator).toHaveScreenshot()`) over full pages: smaller diffs, fewer false alarms.

## Basic usage

```ts
import { test, expect } from '@playwright/test';

test('pricing card renders', async ({ page }) => {
  await page.goto('/pricing');
  const card = page.getByRole('article').filter({ hasText: 'Pro' });
  await expect(card).toBeVisible();
  await expect(card).toHaveScreenshot('pricing-pro.png');
});

test('dashboard layout', async ({ page }) => {
  await page.goto('/dashboard');
  await expect(page).toHaveScreenshot('dashboard.png', {
    fullPage: true,
    mask: [page.getByTestId('last-updated'), page.getByRole('img', { name: 'Avatar' })],
    maxDiffPixelRatio: 0.01,
  });
});
```

`toHaveScreenshot` retries: it takes screenshots until two consecutive ones match, then compares with the baseline.
That absorbs late paints but not real nondeterminism.

## Make rendering deterministic

Set defaults once in config:

```ts
// playwright.config.ts
expect: {
  toHaveScreenshot: {
    animations: 'disabled',   // finishes CSS animations/transitions, cancels infinite ones
    caret: 'hide',
    scale: 'css',
    maxDiffPixelRatio: 0.01,
  },
},
use: {
  viewport: { width: 1280, height: 720 },
  locale: 'en-US',
  timezoneId: 'UTC',
  colorScheme: 'light',
},
```

Then remove remaining sources of noise:

- **Dynamic content**: `mask` locators (painted over with a solid box; `maskColor` to change it), or stub the data with
  `page.route` so it's fixed.
- **Time**: `await page.clock.setFixedTime(new Date('2026-01-15T10:00:00Z'))` before navigation for clocks and
  relative dates.
- **Fonts**: wait for them (`await page.evaluate(() => document.fonts.ready)`), self-host web fonts, and avoid
  system-font fallbacks that differ by OS.
- **Lazy images/skeletons**: assert the final content is visible before the screenshot.
- **Scrollbars, carets, hover states**: move the mouse away (`page.mouse.move(0, 0)`), use `caret: 'hide'`.
- **Leftover noise**: inject a `stylePath` stylesheet for screenshots that hides volatile widgets (chat bubbles, ads).

## Baselines and platforms

- Baselines live next to the spec: `<spec>.ts-snapshots/<name>-<project>-<platform>.png`. Rendering differs between
  OSes and browsers, so a macOS baseline won't match Linux CI.
- Generate and compare baselines in one environment: the official Docker image matching your `@playwright/test`
  version (`mcr.microsoft.com/playwright:v<version>-<distro>`), both locally and in CI.
- Customise the layout with `snapshotPathTemplate` if you want one baseline set per project without the platform
  suffix (only when everyone generates in the same container).
- Commit baselines to git (Git LFS if they're large). Review them like code.

## Updating baselines

```bash
npx playwright test --update-snapshots                       # rewrite baselines for failing/missing screenshots
npx playwright test tests/pricing.spec.ts --update-snapshots  # scope it
```

Recent versions also accept `--update-snapshots=changed|missing|all|none`; check `npx playwright test --help` for your version.

Workflow:

1. A visual test fails in CI. Open the HTML report: it shows expected, actual and a diff (with a slider).
2. Decide: intended change or regression?
3. If intended, regenerate in the same Docker image as CI (or via a CI job that commits/attaches updated snapshots),
   and include the changed PNGs in the PR so reviewers see them.
4. Never run `--update-snapshots` on the whole suite to make CI green without looking at each diff.

## Thresholds

- `maxDiffPixels`: absolute pixel budget; good for small elements.
- `maxDiffPixelRatio`: fraction of pixels (0..1); good for full pages.
- `threshold`: per-pixel colour tolerance in YIQ space (0..1, default 0.2); raise slightly for anti-aliasing noise only.
- Keep thresholds tight. If you need more than ~1-2% to pass, the test is nondeterministic; fix the cause.

## Pitfalls

- Baselines generated on a developer laptop, compared on Linux CI: every test fails. Use the container.
- Upgrading Playwright changes browser builds and can shift rendering; expect a baseline refresh PR with each upgrade.
- Screenshotting before data loads; assert visible content first.
- Masking so much that the screenshot proves nothing.
- Huge full-page screenshots of long pages; split into sections or components.
