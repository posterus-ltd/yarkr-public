---
name: gha-workflow-authoring
description: Write or fix GitHub Actions workflows - triggers, jobs and needs, expressions and contexts, concurrency groups, permissions and security hardening. Use when creating .github/workflows/*.yml, debugging why a workflow did or didn't run, or reviewing a workflow for safety.
---

# Authoring GitHub Actions workflows

## Skeleton to start from

```yaml
name: ci
on:
  push:
    branches: [main]
  pull_request:
  workflow_dispatch:

permissions:
  contents: read            # least privilege by default; widen per job

concurrency:
  group: ${{ github.workflow }}-${{ github.event.pull_request.number || github.ref }}
  cancel-in-progress: ${{ github.event_name == 'pull_request' }}

jobs:
  test:
    runs-on: ubuntu-latest
    timeout-minutes: 15
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version-file: .nvmrc, cache: npm }
      - run: npm ci
      - run: npm test
```

Always set `permissions`, `timeout-minutes` (default is 360) and a `concurrency` group.

## Triggers

- `push` / `pull_request` filters: `branches`, `branches-ignore`, `tags`, `paths`, `paths-ignore`. You can't combine
  `branches` and `branches-ignore` for the same event; use `!pattern` negations inside `branches` instead.
- `paths` filters skip the whole workflow. If a skipped workflow is a **required status check**, the PR blocks forever.
  For required checks, run the workflow always and skip inside jobs (e.g. with `dorny/paths-filter` or a `git diff` step).
- `pull_request` runs on the merge commit, with a read-only token and no secrets for forks. That is the safe default.
- `pull_request_target` runs in the base repo context **with secrets and a write token**. Never check out and run the PR
  head (`ref: ${{ github.event.pull_request.head.sha }}`) in it; that is the classic "pwn request". Use it only for
  labeling/commenting that doesn't execute PR code.
- `workflow_run` chains workflows (e.g. publish results of an untrusted build); it runs with base-repo privileges, so
  treat downloaded artifacts as untrusted data.
- `schedule` cron is UTC, runs only on the default branch, can be delayed under load, and is disabled after 60 days of
  repo inactivity in public repos.
- `workflow_dispatch` inputs: types `string`, `boolean`, `choice`, `number`, `environment`. Read as `inputs.<name>`.
- Events triggered with the default `GITHUB_TOKEN` do not start new workflow runs (except `workflow_dispatch` and
  `repository_dispatch`). To trigger downstream workflows, use a GitHub App token.

## Jobs, needs and conditions

- Jobs run in parallel unless linked with `needs`. A job is skipped if any `needs` job failed or was skipped, unless its
  `if` uses a status function: `if: ${{ !cancelled() && needs.build.result == 'success' }}`.
- Status functions: `success()` (implicit default), `failure()`, `cancelled()`, `always()`. Prefer `!cancelled()` over
  `always()` so cancel still works.
- Pass data between jobs with outputs:

```yaml
jobs:
  version:
    runs-on: ubuntu-latest
    outputs:
      tag: ${{ steps.v.outputs.tag }}
    steps:
      - id: v
        run: echo "tag=$(git describe --tags --always)" >> "$GITHUB_OUTPUT"
  deploy:
    needs: version
    runs-on: ubuntu-latest
    steps:
      - run: echo "deploying ${{ needs.version.outputs.tag }}"
```

- `::set-output` and `::save-state` are deprecated; use `$GITHUB_OUTPUT`, `$GITHUB_STATE`, `$GITHUB_ENV`, `$GITHUB_PATH`
  and `$GITHUB_STEP_SUMMARY`.
- Multiline outputs need a heredoc delimiter: `{ echo "body<<EOF"; cat file; echo "EOF"; } >> "$GITHUB_OUTPUT"`.
- Files don't survive between jobs; use `actions/upload-artifact@v4` / `download-artifact@v4` (v4 artifacts are
  immutable per name: use unique names per matrix leg, then `pattern:` + `merge-multiple: true` to download).

## Expressions and contexts

- `if:` on steps/jobs may omit `${{ }}`, but a leading `!` must be wrapped: `if: ${{ !startsWith(github.ref, 'refs/tags/') }}`.
- Useful functions: `contains()`, `startsWith()`, `endsWith()`, `format()`, `join()`, `toJSON()`, `fromJSON()`, `hashFiles()`.
- `fromJSON` turns string inputs into booleans/numbers: `${{ fromJSON(inputs.retries) }}`.
- `env` context isn't available in `runs-on` or job-level `if`; use `vars` (configuration variables) there.
- Default values: `${{ inputs.target || 'staging' }}`. Beware: `false` and `0` are falsy, so this pattern breaks booleans.

## Script injection (most common security bug)

Never interpolate untrusted context directly into `run:`. Titles, branch names, commit messages and issue bodies are
attacker-controlled.

```yaml
# Bad: ${{ }} is expanded into shell source before bash runs
- run: echo "${{ github.event.pull_request.title }}"
# Good: pass through env and quote
- env:
    TITLE: ${{ github.event.pull_request.title }}
  run: echo "$TITLE"
```

## Permissions and supply chain

- Set the workflow-level default to `contents: read` and grant per job: `id-token: write` (OIDC), `packages: write`,
  `pull-requests: write`, `contents: write` (releases/tags).
- Setting any key in `permissions` sets every unlisted scope to `none`.
- Pin third-party actions to a full commit SHA with a version comment: `uses: org/action@<40-char-sha> # v3.2.1`. Let
  Dependabot (`package-ecosystem: github-actions`) bump them. First-party `actions/*` on major tags is a common, acceptable
  trade-off; be stricter in release pipelines.
- Use `environment:` with protection rules (required reviewers, branch restrictions) for production deploys, and put
  deploy secrets in the environment, not the repo.
- `secrets` are masked in logs, but derived values aren't: `echo "::add-mask::$VALUE"` for anything sensitive you compute.

## Shell behaviour

- `run` uses `bash -e {0}` without pipefail when `shell` isn't set; with `shell: bash` explicitly it's
  `bash --noprofile --norc -eo pipefail {0}`. Set `defaults: run: shell: bash` so pipes fail properly.
- Windows runners default to `pwsh`.
- `working-directory` can be set per step or under `defaults.run`.

## Debugging a workflow

1. Didn't run? Check the trigger filters, that the file is on the right branch (for `schedule`, `workflow_dispatch`:
   default branch), YAML validity, and whether a `[skip ci]` commit message suppressed it.
2. Use `actionlint` locally (also catches shellcheck issues in `run:` blocks).
3. Re-run with debug logging (`ACTIONS_STEP_DEBUG=true` secret/variable, or "Enable debug logging" on re-run).
4. Dump context: `- run: echo '${{ toJSON(github.event) }}'` only in trusted contexts; prefer writing it to a file.
5. `gh run view <id> --log-failed` and `gh run rerun <id> --failed` from the CLI.

## Checklist before merging a workflow

- [ ] `permissions` set at workflow level, widened only per job
- [ ] `timeout-minutes` on every job
- [ ] `concurrency` group so PR pushes cancel stale runs; deploys use `cancel-in-progress: false`
- [ ] No `${{ }}` of untrusted input inside `run:`
- [ ] No `pull_request_target` that checks out PR code
- [ ] Third-party actions pinned to SHAs
- [ ] Required checks aren't skipped by `paths` filters
- [ ] `actionlint` passes
