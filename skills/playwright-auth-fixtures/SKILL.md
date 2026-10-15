---
name: playwright-auth-fixtures
description: Set up Playwright authentication with a setup project and storageState reuse, multiple roles, per-worker accounts and custom test.extend fixtures for test data. Use when tests log in repeatedly, need admin vs user roles, or share accounts and collide in parallel.
---

# Playwright auth and fixtures

Log in once, save the browser state, and start every test already authenticated. Build test data in fixtures so tests
stay short and independent.

## Pick a strategy

| Situation | Strategy |
| --- | --- |
| Tests don't mutate server-side user state (read-mostly) | One shared account, setup project, `storageState` |
| Several roles (admin, member, viewer) | One setup test per role, one state file per role |
| Tests mutate account state (settings, cart) and run in parallel | One account per worker, worker-scoped fixture |
| Login is SSO/MFA and slow | Authenticate via API or a test-only login endpoint, then save state |

## Setup project + storageState (default)

```ts
// tests/auth.setup.ts
import { test as setup, expect } from '@playwright/test';

const userFile = 'playwright/.auth/user.json';

setup('authenticate as user', async ({ page }) => {
  await page.goto('/login');
  await page.getByLabel('Email').fill(process.env.E2E_USER_EMAIL!);
  await page.getByLabel('Password').fill(process.env.E2E_USER_PASSWORD!);
  await page.getByRole('button', { name: 'Sign in' }).click();
  await expect(page.getByRole('button', { name: 'Account menu' })).toBeVisible();
  await page.context().storageState({ path: userFile });
});
```

```ts
// playwright.config.ts (projects excerpt)
projects: [
  { name: 'setup', testMatch: /.*\.setup\.ts/ },
  {
    name: 'chromium',
    use: { ...devices['Desktop Chrome'], storageState: 'playwright/.auth/user.json' },
    dependencies: ['setup'],
  },
],
```

- Add `playwright/.auth` to `.gitignore`. State files hold live session cookies.
- Wait for a post-login signal before saving state; saving mid-redirect captures a half-logged-in session.
- Credentials come from environment variables or the CI secret store, never from the repo.
- `storageState` captures cookies and localStorage (and optionally IndexedDB with `indexedDB: true` in recent
  versions). Session storage is not saved; if the app keeps tokens there, inject them with `context.addInitScript`.

## API login (faster, no UI)

```ts
setup('authenticate via API', async ({ request }) => {
  const res = await request.post('/api/test/login', {
    data: { email: process.env.E2E_USER_EMAIL, password: process.env.E2E_USER_PASSWORD },
  });
  expect(res.ok()).toBeTruthy();
  await request.storageState({ path: 'playwright/.auth/user.json' });
});
```

Keep exactly one UI login test elsewhere so the login page itself stays covered.

## Multiple roles

Save `admin.json` and `user.json` in the setup project, then choose per file or per describe:

```ts
test.describe('admin settings', () => {
  test.use({ storageState: 'playwright/.auth/admin.json' });
  test('can invite a member', async ({ page }) => { /* ... */ });
});
```

For a test needing two users at once, create two contexts:

```ts
test('admin sees member request', async ({ browser }) => {
  const adminCtx = await browser.newContext({ storageState: 'playwright/.auth/admin.json' });
  const userCtx = await browser.newContext({ storageState: 'playwright/.auth/user.json' });
  // ... drive both pages, then close both contexts
  await adminCtx.close();
  await userCtx.close();
});
```

To run a test logged out inside an authenticated project: `test.use({ storageState: { cookies: [], origins: [] } })`.

## Per-worker accounts

When tests change account state, give each parallel worker its own account so they never collide.

```ts
// fixtures.ts
import { test as base, request as pwRequest } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

export const test = base.extend<{}, { workerStorageState: string }>({
  storageState: ({ workerStorageState }, use) => use(workerStorageState),

  workerStorageState: [async ({}, use, workerInfo) => {
    const file = path.resolve(`playwright/.auth/worker-${workerInfo.parallelIndex}.json`);
    if (!fs.existsSync(file)) {
      const ctx = await pwRequest.newContext({ baseURL: workerInfo.project.use.baseURL });
      const account = { email: `e2e+w${workerInfo.parallelIndex}@example.test`, password: process.env.E2E_PASSWORD };
      await ctx.post('/api/test/users', { data: account });
      await ctx.post('/api/test/login', { data: account });
      await ctx.storageState({ path: file });
      await ctx.dispose();
    }
    await use(file);
  }, { scope: 'worker' }],
});
export { expect } from '@playwright/test';
```

Use `parallelIndex` (stable 0..workers-1, reused across worker restarts) rather than `workerIndex` (grows on restarts).

## Data fixtures

Put setup and teardown for test data in fixtures; the code after `use()` runs even when the test fails.

```ts
type Fixtures = { project: { id: string; name: string } };

export const test = base.extend<Fixtures>({
  project: async ({ request }, use, testInfo) => {
    const name = `proj-${testInfo.workerIndex}-${Date.now()}`;
    const res = await request.post('/api/projects', { data: { name } });
    const project = await res.json();
    await use(project);
    await request.delete(`/api/projects/${project.id}`);
  },
});
```

- Fixtures are lazy: only the ones a test destructures are set up.
- Use `{ auto: true }` for fixtures every test needs (e.g. failing on console errors) without naming them.
- Use `{ scope: 'worker' }` for expensive shared resources (accounts, seeded tenants); test scope for anything mutated.
- Combine fixture files with `mergeTests(a, b)` instead of one huge `test.extend`.

## Pitfalls

- Expired sessions in long CI runs: keep token lifetimes for test users longer than the suite, or re-authenticate in setup.
- Committing `.auth/*.json` or logging tokens via `console.log` in fixtures.
- Using `globalSetup` for login: it doesn't appear in the HTML report or trace. Prefer the setup project.
- Parallel tests sharing one account while editing its profile: intermittent failures that disappear with `--workers=1`.
- Hard-coded `baseURL` in fixtures; read it from `workerInfo.project.use.baseURL` or the `baseURL` fixture.
