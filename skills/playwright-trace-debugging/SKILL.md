---
name: playwright-trace-debugging
description: Debug failing or flaky Playwright tests from traces, videos, screenshots, UI mode and the inspector, and decide whether the app or the test is at fault. Use when a Playwright test fails in CI, times out, passes only on retry, or behaves differently locally.
---

# Debugging Playwright failures with traces

Diagnose from evidence first. The trace almost always shows the cause; editing waits blindly makes things worse.

## 1. Make sure evidence is captured

```ts
// playwright.config.ts
use: {
  trace: 'on-first-retry',          // or 'retain-on-failure' when CI runs without retries
  screenshot: 'only-on-failure',
  video: 'retain-on-failure',
},
retries: process.env.CI ? 2 : 0,
```

- `trace: 'on'` locally when chasing a specific bug; it's too heavy for full CI runs.
- Upload `test-results/` and `playwright-report/` as CI artifacts on failure, or the trace is lost.

## 2. Open the trace

```bash
npx playwright show-report                       # HTML report; click the failed test, then the trace
npx playwright show-trace test-results/<dir>/trace.zip
```

You can also drop a `trace.zip` onto trace.playwright.dev (it runs locally in the browser; still check your data policy).

Read it in this order:

1. **Errors tab / failed action**: the exact call, the locator, and Playwright's log of what it waited for
   ("waiting for getByRole('button', { name: 'Save' })", "element is not enabled", "element is outside of the viewport",
   "another element would receive the click").
2. **DOM snapshot** before/after that action: is the element there? Is it covered by an overlay or toast? Is the text
   what the assertion expected?
3. **Network tab**: failed or slow requests around the failure, 4xx/5xx, a request that never fired.
4. **Console tab**: uncaught exceptions, hydration errors, CSP violations.
5. **Timeline**: what changed between the last passing action and the failure.

## 3. Reproduce locally

```bash
npx playwright test tests/cart.spec.ts:42 --project=chromium      # one test, one project
npx playwright test -g "applies coupon" --headed
npx playwright test -g "applies coupon" --repeat-each=20 --workers=4  # surface flakiness
npx playwright test --ui                                            # watch mode, time-travel, locator picker
npx playwright test -g "applies coupon" --debug                     # inspector, step through actions
PWDEBUG=1 npx playwright test ...                                    # same as --debug
```

- Insert `await page.pause()` to stop at a point and explore with the inspector; remove before committing.
- `DEBUG=pw:api npx playwright test ...` prints every API call with timing.
- To mimic CI: run with the same `--workers`, `CI=1`, the same browser channel, and the Playwright Docker image if CI uses it.

## 4. Classify: app bug or test bug?

| Evidence | Likely cause | Fix |
| --- | --- | --- |
| Assertion got stale value, then correct value appears later in snapshot | Non-retrying assertion or reading a value once | Use web-first `expect(locator)` assertions |
| "strict mode violation: resolved to 2 elements" | Ambiguous locator, often duplicate desktop/mobile markup | Scope locator to a region |
| "element intercepts pointer events" | Overlay, cookie banner, toast, animating modal | Dismiss the overlay in a fixture; wait for it to be hidden |
| Fails only in parallel; passes with `--workers=1` | Shared data or account between tests | Unique data per test, per-worker accounts |
| Fails only on retry #0, passes on retry | Race with app readiness or data seeding | Assert a readiness signal; seed via API before navigation |
| 5xx in network tab or exception in console | App bug | File it with the trace attached; don't paper over it |
| Request never sent after click | Click happened before handler attached (hydration) | Wait for a hydrated signal, or fix the app to disable controls until ready |
| Timeout at `page.goto` | Slow server or `waitUntil: 'load'` blocked by third parties | Block third parties with `page.route`, check the server |
| Only fails in one browser | Real cross-browser bug or engine-specific timing | Reproduce with `--project=<browser>`; check console |

A test that is flaky because the app is flaky is reporting a real problem; users see it too.

## 5. Fix, then prove it

- Change the smallest thing the evidence points to.
- Re-run with `--repeat-each=20` (and in parallel) before calling it fixed.
- Do not raise timeouts or add `waitForTimeout` as the fix. If something is genuinely slow, use `test.slow()` and note why.
- Do not add retries to hide a flake; track flaky tests (the HTML report marks "flaky" = failed then passed) and fix them.

## Quarantine policy

If a fix needs more time, mark it `test.fixme('reason + issue link')` rather than deleting it, and open an issue with
the trace attached. Quarantined tests need an owner and a date.

## Pitfalls

- Debugging from the error message alone; the action log in the trace usually names the real blocker.
- Trusting the final screenshot: it's taken after failure and may differ from the moment the action ran. Use the
  action's before/after snapshots.
- Traces containing secrets or PII from production-like data; scrub test data and limit artifact retention.
- Comparing a headed local run with a headless CI run and concluding "works on my machine". Match the environment.
