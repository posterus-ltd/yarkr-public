---
name: gha-reusable-workflows
description: Share CI logic across GitHub repos with reusable workflows (workflow_call) and composite actions - inputs, outputs, secrets passing, permissions and versioning. Use when deduplicating workflows, building an org-wide CI template, or choosing between a reusable workflow and a composite action.
---

# Reusable workflows and composite actions

## Pick the right tool

| Need | Use |
| --- | --- |
| Reuse whole jobs (own runner, `environment`, matrix, services) | Reusable workflow (`on: workflow_call`) |
| Reuse a sequence of steps inside a caller's job | Composite action (`runs.using: composite`) |
| Logic that needs real code, tests, or a Node/Docker runtime | JavaScript or Docker action |
| Org-wide default workflow for new repos | Workflow template in the org `.github` repo |

Rule of thumb: if it needs its own `runs-on`, it's a reusable workflow; if it should run in the caller's
workspace after the caller's checkout, it's a composite action.

## Reusable workflow

`.github/workflows/build.yml` in the shared repo:

```yaml
on:
  workflow_call:
    inputs:
      node-version:
        type: string
        default: "22"
      run-e2e:
        type: boolean
        default: false
    secrets:
      NPM_TOKEN:
        required: false
    outputs:
      artifact-name:
        description: Name of the uploaded build artifact
        value: ${{ jobs.build.outputs.artifact }}

permissions:
  contents: read

jobs:
  build:
    runs-on: ubuntu-latest
    outputs:
      artifact: ${{ steps.meta.outputs.name }}
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: "${{ inputs.node-version }}", cache: npm }
      - run: npm ci && npm run build
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
      - id: meta
        run: echo "name=dist-${{ github.sha }}" >> "$GITHUB_OUTPUT"
```

Caller:

```yaml
jobs:
  build:
    uses: my-org/ci-templates/.github/workflows/build.yml@v2
    with:
      run-e2e: true
    secrets: inherit            # or pass explicitly: secrets: { NPM_TOKEN: ${{ secrets.NPM_TOKEN }} }
    permissions:
      contents: read
  deploy:
    needs: build
    runs-on: ubuntu-latest
    steps:
      - run: echo "${{ needs.build.outputs.artifact-name }}"
```

### Rules that bite

- A job that calls a reusable workflow can only have `uses`, `with`, `secrets`, `needs`, `if`, `permissions`,
  `strategy`, `concurrency` and `name`. No `steps`, no `runs-on`, no `env`.
- `env` set in the caller is **not** propagated to the called workflow. Pass values as inputs.
- Input types are `string`, `number`, `boolean` only. Pass lists/objects as JSON strings and `fromJSON()` them.
- `secrets: inherit` only works within the same org/enterprise. For cross-org calls, pass secrets explicitly.
- Permissions: the called workflow's `GITHUB_TOKEN` can only be equal to or narrower than what the caller grants. If
  the callee needs `id-token: write`, the calling job must grant it.
- Nesting: up to 10 levels of workflows in total (caller plus nested reusable workflows), and loops are not allowed.
  A single workflow run can call a limited number of unique reusable workflows; keep trees shallow.
- `uses:` must be a static string: no expressions in the ref or path.
- Local reuse: `uses: ./.github/workflows/build.yml` (same repo, same commit; no `@ref`).
- Private/internal repo reuse requires the shared repo's **Settings > Actions > Access** to allow it.
- `github` context in the callee refers to the **caller's** event, repo and ref. `github.workflow_ref` is the caller;
  the callee's own identity appears in `job_workflow_ref` (an OIDC claim) - useful for cloud trust policies.
- Matrix: a caller job can use `strategy.matrix` and pass `${{ matrix.x }}` as an input. Outputs from matrix legs
  overwrite each other; the last one to finish wins.

## Composite action

`action.yml` (repo root or a subfolder like `actions/setup-toolchain/action.yml`):

```yaml
name: setup-toolchain
description: Install toolchain and restore caches
inputs:
  go-version:
    description: Go version
    default: "1.23"
outputs:
  cache-hit:
    description: Whether the module cache was restored
    value: ${{ steps.go.outputs.cache-hit }}
runs:
  using: composite
  steps:
    - id: go
      uses: actions/setup-go@v5
      with:
        go-version: ${{ inputs.go-version }}
    - shell: bash                      # required on every run step in a composite
      run: ${{ github.action_path }}/scripts/install-tools.sh
      env:
        GO_VERSION: ${{ inputs.go-version }}
```

Caller: `- uses: my-org/actions/setup-toolchain@v1` (or `./actions/setup-toolchain` after checkout).

Pitfalls:
- Every `run` step needs an explicit `shell`.
- Composites can't read `secrets` directly; pass them as inputs (they stay masked if they came from a secret).
- Use `${{ github.action_path }}` to reference files shipped with the action, never relative paths (they resolve
  against the caller's workspace).
- Inputs are always strings in composites; compare booleans with `inputs.flag == 'true'`.
- Composite steps appear collapsed in logs; add `name:` to each step for readable output.
- Same untrusted-input rule as workflows: pass inputs to scripts via `env`, not `${{ }}` inside `run`.

## Versioning and rollout

- Tag releases semver (`v2.3.1`) and move a major tag (`v2`) to the latest compatible release. Callers pin `@v2`;
  security-sensitive callers pin a full SHA.
- Breaking changes (renamed/required inputs, removed outputs, wider permissions needed) ship as a new major.
- Keep a `CHANGELOG.md` and a test workflow in the shared repo that calls each reusable workflow via `./` path on PRs.
- Use Dependabot `github-actions` ecosystem in consumers so `@sha` pins get bumped.
- Don't call reusable workflows from `@main` in production pipelines: any push to main changes everyone's CI.

## Migration recipe (dedupe N copy-pasted workflows)

1. Diff the copies; list real variation points. Each becomes an input with a sensible default.
2. Move job-level logic to a reusable workflow; move repeated setup steps to a composite action.
3. Replace secrets referenced by name with declared `secrets:` (or `inherit` inside one org).
4. Roll out to one repo, compare run time and logs, then the rest via a scripted PR (`gh` + `sed`).
5. Keep required status check names stable: the check name of a called job is `<caller job> / <callee job>`, so
   update branch protection rules if names change.
