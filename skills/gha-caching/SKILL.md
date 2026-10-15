---
name: gha-caching
description: Speed up GitHub Actions with actions/cache and the built-in caches of setup-* actions - cache key design, restore-keys, scoping rules, Docker layer caching and eviction. Use when CI is slow, caches never hit, caches go stale, or you're adding dependency caching to a workflow.
---

# Caching in GitHub Actions

## Decide what to cache

1. Measure first: look at step timings in a run. Cache only steps that cost more than restoring the cache (often
   a cache under ~30s of work isn't worth it).
2. Prefer the setup action's built-in cache; it picks correct paths and keys:

| Ecosystem | Built-in option |
| --- | --- |
| Node | `actions/setup-node@v4` with `cache: npm \| yarn \| pnpm` (+ `cache-dependency-path` for monorepos) |
| Python | `actions/setup-python@v5` with `cache: pip \| pipenv \| poetry`; `astral-sh/setup-uv` with `enable-cache: true` |
| Go | `actions/setup-go@v5` caches modules and build cache by default (`cache: false` to disable) |
| Java | `actions/setup-java@v4` with `cache: maven \| gradle \| sbt`; or `gradle/actions/setup-gradle` |
| Ruby | `ruby/setup-ruby` with `bundler-cache: true` |
| Rust | `Swatinem/rust-cache@v2` |

3. Cache the **download cache**, not the install output, when installs are deterministic: e.g. `~/.npm` with `npm ci`,
   not `node_modules`. Caching `node_modules` breaks across Node versions and with native modules.

## actions/cache key design

```yaml
- uses: actions/cache@v4
  with:
    path: |
      ~/.cache/pip
      .venv
    key: ${{ runner.os }}-${{ runner.arch }}-py${{ steps.py.outputs.python-version }}-${{ hashFiles('**/requirements*.txt', 'pyproject.toml') }}
    restore-keys: |
      ${{ runner.os }}-${{ runner.arch }}-py${{ steps.py.outputs.python-version }}-
```

- The key must include **everything that changes the content**: OS, arch, toolchain version, lockfile hash.
- `key` is exact-match. `restore-keys` are prefix matches tried in order; the newest matching entry wins. A prefix
  hit is a partial restore: `cache-hit` output is `false`, and the cache is re-saved under the new key at job end.
- `cache-hit` is `'true'` only on an exact key hit. Use it to skip installs only when the cache contains the full
  install result: `if: steps.cache.outputs.cache-hit != 'true'`.
- Entries are immutable: if the key already exists, the save is skipped. So a key without a content hash never
  updates. If you need a rolling cache, put a changing component (e.g. `${{ github.run_id }}`) last and rely on
  `restore-keys` for the prefix.
- `hashFiles()` returns an empty string when nothing matches. Check the glob, or the key silently collapses.

## Split restore and save

Use `actions/cache/restore@v4` and `actions/cache/save@v4` when you want to:
- save even if tests fail (`if: always()` on the save step), or
- save only on the default branch so PRs don't churn the cache:

```yaml
- uses: actions/cache/restore@v4
  id: restore
  with: { path: ~/.cache/bazel, key: bazel-${{ runner.os }}-${{ github.sha }}, restore-keys: bazel-${{ runner.os }}- }
- run: bazel test //...
- uses: actions/cache/save@v4
  if: github.ref == 'refs/heads/main'
  with: { path: ~/.cache/bazel, key: bazel-${{ runner.os }}-${{ github.sha }} }
```

## Scope and eviction rules

- A run can restore caches created on its **own branch** or the **base branch** (for PRs) or the default branch.
  It cannot see caches from sibling feature branches. Seed caches by running the workflow on `main`.
- PR caches are scoped to the merge ref (`refs/pull/N/merge`) and are only reusable by re-runs of that PR.
- Repos have a storage limit (default 10 GB); least recently used entries are evicted when over the limit, and entries
  not accessed for 7 days are removed. Thrash shows up as constant misses on busy repos: reduce what you store (skip
  PR saves, drop large build outputs) or raise the limit where your plan allows.
- Caches aren't shared across repos or with forks' write access; fork PRs can read base caches but don't pollute them.
- Manage with the CLI: `gh cache list --sort size_in_bytes`, `gh cache delete <key|id>`, `gh cache delete --all`.

## Docker image builds

Use BuildKit's GitHub Actions cache backend:

```yaml
- uses: docker/setup-buildx-action@v3
- uses: docker/build-push-action@v6
  with:
    context: .
    push: false
    cache-from: type=gha
    cache-to: type=gha,mode=max
```

- `mode=max` caches all intermediate stages (best for multi-stage builds), at the cost of more storage.
- With many images in one repo, set `scope=<image-name>` on both `cache-from` and `cache-to`, or they overwrite each
  other.
- For large images, a registry cache (`type=registry,ref=ghcr.io/org/app:buildcache`) avoids the repo cache limit.
- Order Dockerfile layers so dependency manifests are copied and installed before source code.

## Other ways to save time (often better than caching)

- `actions/checkout` with default `fetch-depth: 1`; only fetch full history when tools need it.
- Skip work with path filters inside jobs rather than caching it.
- Upload/download build outputs between jobs with artifacts, not caches; caches are best-effort and may be missing.
- Use larger runners or self-hosted runners with warm local caches for very heavy builds.

## Troubleshooting checklist

- [ ] Look at the cache step log: "Cache restored from key" vs "Cache not found for input keys".
- [ ] Does the post-job "Post Cache" step say it saved, or "already exists"? Immutable keys explain stale caches.
- [ ] Does `hashFiles` match anything? Print the key in a step.
- [ ] Is the branch able to see the cache (scope rules above)? Has the default branch ever saved it?
- [ ] Is the path absolute or `~`-relative and identical between save and restore (OS differences)?
- [ ] Is the cache being evicted? Check `gh cache list` for total size near the limit.
- [ ] Never cache secrets or credentials files (e.g. `~/.docker/config.json`, `.npmrc` with tokens): fork PRs can read
      base-branch caches.
