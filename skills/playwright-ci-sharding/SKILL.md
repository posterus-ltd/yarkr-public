---
name: playwright-ci-sharding
description: Run Playwright suites in CI with sharding across machines, parallel workers, retries, browser install caching, blob reports merged into one HTML report, and artifact upload. Use when setting up or speeding up Playwright in GitHub Actions or other CI, or when CI runs are slow or flaky.
---

# Playwright in CI: sharding, retries, reports

Goal: a fast, reproducible run whose failures come with a report and traces anyone can open.

## Config for CI

```ts
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,                       // split tests within files too; needed for even shards
  forbidOnly: !!process.env.CI,              // fail if a test.only slipped in
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 2 : undefined,   // tune to runner cores; more workers than cores slows things down
  reporter: process.env.CI ? [['blob'], ['github']] : [['html'], ['list']],
  use: {
    baseURL: process.env.BASE_URL ?? 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  webServer: {
    command: 'npm run start:test',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});
```

## Sharding

- `npx playwright test --shard=2/4` runs the second quarter of the tests.
- With `fullyParallel: true`, tests are distributed individually; otherwise whole files are, and one big file makes an
  unbalanced shard.
- Pick shard count from wall time: if a single machine takes 20 minutes and you want 5, use 4 shards plus headroom for
  setup. Per-shard overhead (checkout, install, server start) caps the gain.
- Setup projects (`dependencies: ['setup']`) run in every shard that needs them; keep setup fast.

## GitHub Actions example

```yaml
name: e2e
on: [pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    timeout-minutes: 30
    strategy:
      fail-fast: false
      matrix:
        shardIndex: [1, 2, 3, 4]
        shardTotal: [4]
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 22, cache: npm }
      - run: npm ci
      - run: npx playwright install --with-deps chromium
      - run: npx playwright test --shard=${{ matrix.shardIndex }}/${{ matrix.shardTotal }}
      - uses: actions/upload-artifact@v4
        if: ${{ !cancelled() }}
        with:
          name: blob-report-${{ matrix.shardIndex }}
          path: blob-report
          retention-days: 7

  merge-reports:
    if: ${{ !cancelled() }}
    needs: [test]
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 22, cache: npm }
      - run: npm ci
      - uses: actions/download-artifact@v4
        with:
          path: all-blob-reports
          pattern: blob-report-*
          merge-multiple: true
      - run: npx playwright merge-reports --reporter html ./all-blob-reports
      - uses: actions/upload-artifact@v4
        with:
          name: html-report
          path: playwright-report
          retention-days: 14
```

- `fail-fast: false` so one failing shard doesn't cancel the others and hide their results.
- Blob reports include traces and attachments; the merged HTML report is the single place to look.

## Browser installation and caching

- Install only the browsers you test: `npx playwright install --with-deps chromium`.
- Alternative: run the job in the official image `mcr.microsoft.com/playwright:v<version>-noble` whose tag matches your
  `@playwright/test` version exactly; browsers and OS deps are preinstalled, and rendering matches visual baselines.
- Caching `~/.cache/ms-playwright` keyed on the Playwright version saves download time, but OS dependencies
  (`install-deps`) still need installing on a fresh runner. Measure before adding cache complexity.
- Version mismatch between the installed browsers and `@playwright/test` fails with "Executable doesn't exist"; key
  any cache on the exact version from the lockfile.

## Retries and flakiness

- Retries in CI (1-2) keep the pipeline moving; they don't fix flakes. A test that passes on retry is reported as
  "flaky" in the HTML report; track that number and fix the top offenders.
- Don't set retries per test to hide a specific flake; fix it or `test.fixme` it with an issue.
- `--fail-on-flaky-tests` (recent versions) makes flaky results fail the run, useful once the suite is clean.
- `--only-changed=origin/main` (recent versions) runs only tests affected by changed files; useful as a fast pre-check,
  not as the gate.

## Speed checklist

- [ ] `fullyParallel: true` and tests independent of each other.
- [ ] Workers matched to runner cores; shards for wall time beyond that.
- [ ] Auth via setup project + `storageState`, not a UI login per test.
- [ ] Data seeded through API calls, not UI clicks.
- [ ] Third-party scripts blocked with `page.route` where they add latency.
- [ ] Only the needed browsers installed; full cross-browser matrix on a nightly run, Chromium on PRs.
- [ ] App built once (production build) rather than run in dev mode.

## Pitfalls

- Uploading `playwright-report` per shard instead of blob reports, leaving N partial reports.
- Forgetting `if: !cancelled()` on upload steps: failed runs lose their traces.
- `webServer.reuseExistingServer: true` in CI, silently testing a stale server.
- Tests depending on run order break when sharded; fix with independent data, not with `workers: 1`.
- Running against a shared staging environment from many shards at once; data collisions look like flakiness.
