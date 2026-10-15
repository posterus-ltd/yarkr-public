---
name: gha-matrix-builds
description: Use GitHub Actions matrix strategies - include/exclude, fail-fast, max-parallel, experimental legs and dynamic matrices generated as JSON by an earlier job. Use when testing across OS/language versions, fanning out over packages in a monorepo, or debugging a matrix that expands wrongly.
---

# Matrix builds in GitHub Actions

## Basic shape

```yaml
jobs:
  test:
    runs-on: ${{ matrix.os }}
    timeout-minutes: 20
    strategy:
      fail-fast: false
      max-parallel: 6
      matrix:
        os: [ubuntu-latest, windows-latest, macos-latest]
        node: [20, 22, 24]
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: "${{ matrix.node }}", cache: npm }
      - run: npm ci && npm test
```

- The matrix is the cartesian product of the top-level keys (here 9 jobs). Hard limit: 256 jobs per matrix.
- `fail-fast` defaults to `true`: one failing leg cancels the others. Set `false` for test matrices so you see every
  failure; keep `true` for expensive builds where any failure means stop.
- `max-parallel` throttles concurrency (useful for rate-limited external services or shared test environments).

## include and exclude: the exact semantics

- `exclude` removes combinations that match all listed keys. Applied **before** `include`.
- `include` entries are processed in order:
  - If an entry's original-matrix keys all match an existing combination **and adds only new keys**, those keys are
    added to every matching combination.
  - If it would overwrite an original matrix value, or matches nothing, it becomes a **new** combination.
- Use `include` alone (no other keys) to define an explicit list of legs:

```yaml
strategy:
  matrix:
    include:
      - { name: lint, cmd: "npm run lint", os: ubuntu-latest }
      - { name: unit, cmd: "npm test", os: ubuntu-latest }
      - { name: windows-unit, cmd: "npm test", os: windows-latest }
```

- Add per-leg variables without multiplying legs:

```yaml
matrix:
  python: ["3.11", "3.12", "3.13"]
  include:
    - python: "3.13"
      coverage: true        # added to the existing 3.13 leg only
```

Then `if: matrix.coverage` on the coverage step (missing keys evaluate to empty/falsy).

## Allowing some legs to fail

```yaml
continue-on-error: ${{ matrix.experimental == true }}
strategy:
  fail-fast: false
  matrix:
    node: [22, 24]
    experimental: [false]
    include:
      - node: 25
        experimental: true
```

Note: a leg with `continue-on-error: true` that fails still shows a red X on the job but doesn't fail the workflow.

## Dynamic matrix from JSON

Compute legs in one job, consume them in the next:

```yaml
jobs:
  plan:
    runs-on: ubuntu-latest
    outputs:
      packages: ${{ steps.changed.outputs.packages }}
    steps:
      - uses: actions/checkout@v4
        with: { fetch-depth: 0 }
      - id: changed
        run: |
          pkgs=$(git diff --name-only origin/${{ github.base_ref || 'main' }}...HEAD -- packages/ \
            | cut -d/ -f2 | sort -u | jq -R . | jq -cs .)
          echo "packages=${pkgs}" >> "$GITHUB_OUTPUT"
  test:
    needs: plan
    if: ${{ needs.plan.outputs.packages != '[]' && needs.plan.outputs.packages != '' }}
    runs-on: ubuntu-latest
    strategy:
      fail-fast: false
      matrix:
        package: ${{ fromJSON(needs.plan.outputs.packages) }}
    steps:
      - uses: actions/checkout@v4
      - run: npm test --workspace packages/${{ matrix.package }}
```

- Output must be **compact single-line JSON** (`jq -c`). Pretty-printed JSON breaks `$GITHUB_OUTPUT`.
- An empty array makes the job fail with "Matrix vector does not contain any values"; guard with `if`.
- You can emit a whole matrix object: `{"include":[{"pkg":"a","node":22}, ...]}` and use `matrix: ${{ fromJSON(...) }}`.
- `base_ref` is empty on push events; handle both cases as above.

## Required status checks with matrices

- Each leg is a separate check named `test (ubuntu-latest, 22)`. Requiring all of them in branch protection is brittle:
  renaming a leg or changing versions blocks PRs.
- Add a single aggregating gate job and require only it:

```yaml
  ci-ok:
    if: ${{ !cancelled() }}
    needs: [test]
    runs-on: ubuntu-latest
    steps:
      - run: |
          [[ "${{ needs.test.result }}" == "success" || "${{ needs.test.result }}" == "skipped" ]] || exit 1
```

  Treat `skipped` as success only when skipping is intended (e.g. dynamic matrix had nothing to do).

## Naming and outputs

- Set a readable name: `name: test (${{ matrix.os }}, node ${{ matrix.node }})`.
- Job outputs from matrix legs collide (last writer wins). To collect results from every leg, upload an artifact
  per leg with a unique name (`results-${{ matrix.os }}-${{ matrix.node }}`), then download with
  `pattern: results-*` and `merge-multiple: true` in a follow-up job.
- `strategy.job-index` and `strategy.job-total` let you shard tests: `npx playwright test --shard=$((${{ strategy.job-index }}+1))/${{ strategy.job-total }}`.

## Cost and speed tips

- macOS and Windows minutes are billed at higher multipliers on private repos; run the full OS matrix on `main` or
  nightly, and only Linux on PRs (via a dynamic matrix or `exclude` driven by an expression-built JSON).
- Pin explicit versions (`ubuntu-24.04`) when reproducibility matters; `-latest` labels move.
- Quote versions like `"3.10"` - YAML reads `3.10` as the number 3.1.
