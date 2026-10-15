---
name: pytest-coverage-ci
description: Configure Python test runs in CI - pytest-cov with branch coverage and thresholds, coverage combining across jobs, pytest-xdist parallelism, strict pytest settings, and quarantining flaky tests. Use when setting up or speeding up a Python CI pipeline, adding coverage gates, or dealing with flaky CI failures.
---

# pytest, coverage and CI

Goal: a CI run that is fast, deterministic, fails for real reasons and reports coverage that means something.

## 1. Strict pytest config

```toml
# pyproject.toml
[tool.pytest.ini_options]
testpaths = ["tests"]
addopts = [
  "-ra",                 # summary of skips/xfails/errors
  "--strict-markers",    # typo'd marker = error
  "--strict-config",
  "--import-mode=importlib",
]
xfail_strict = true      # xfail that passes = failure
filterwarnings = ["error"]   # then allow-list known third-party warnings below it
markers = [
  "slow: long-running tests (deselect with -m 'not slow')",
  "integration: needs external services",
]
```

`filterwarnings = error` surfaces deprecations before they become breakages. Add targeted ignores such as
`"ignore::DeprecationWarning:somelib.*"` instead of dropping the rule.

## 2. Coverage config

```toml
[tool.coverage.run]
branch = true
source = ["mypkg"]          # measure the package, not the tests
parallel = true             # unique data file per process (xdist, subprocesses)
relative_files = true       # paths portable across CI machines

[tool.coverage.report]
show_missing = true
skip_covered = true
fail_under = 85
exclude_also = [
  "if TYPE_CHECKING:",
  "raise NotImplementedError",
  "@(abc\\.)?abstractmethod",
  "if __name__ == .__main__.:",
]
```

Run:

```bash
pytest --cov --cov-report=term-missing --cov-report=xml -n auto
```

- With `source` set in config, bare `--cov` picks it up. `--cov=mypkg` also works.
- Branch coverage catches untested `else` paths that line coverage hides; always enable it.
- `fail_under` in config is the single source of truth; don't also hard-code `--cov-fail-under` in CI.
- Set the threshold at the current level minus a little, then ratchet up. A gate nobody can pass gets disabled.
- For PRs, gate **patch coverage** (lines changed) with `diff-cover coverage.xml --compare-branch=origin/main
  --fail-under=90` or your coverage service; total coverage barely moves per PR.

## 3. Combining across jobs (matrix)

Each matrix job uploads its `.coverage.*` files as an artifact; a final job combines:

```bash
coverage combine artifacts/          # needs relative_files = true
coverage report                      # enforces fail_under
coverage xml
```

Don't gate per-job when some code is only exercised on certain Python versions/OSes; gate on the combined result.

## 4. Parallelism with pytest-xdist

- `-n auto` uses one worker per CPU core. On small CI runners, `-n logical` or a fixed `-n 4` may be better; measure.
- `--dist loadscope` groups tests by module/class (shares module fixtures); `--dist loadfile` by file;
  `--dist loadgroup` honours `@pytest.mark.xdist_group("db")` for tests that must share a worker.
- Session fixtures run once **per worker**. Resources like DBs need per-worker names: use the `worker_id` fixture
  (`"gw0"`, ..., or `"master"` without xdist) to suffix database names, ports and temp dirs.
- If tests fail only under xdist, they share state (files, env, globals, a DB). Fix the isolation, don't drop `-n`.

## 5. Speed

- `pytest --durations=20` each week; slow tests are usually slow fixtures.
- Split `-m "not slow and not integration"` for PRs and run the rest on main/nightly, if the team accepts that risk.
- Cache dependencies (uv/pip cache keyed on lockfile) and reuse the virtualenv.
- Large suites: shard across machines (pytest-split with stored durations) in addition to xdist.

## 6. Flaky tests

A flaky test is a bug in the test or the code. Process:

1. Reproduce: repeat it in isolation (`pytest path::test --count 50` with pytest-repeat), then in random order
   (pytest-randomly shuffles automatically once installed; replay an order with `--randomly-seed=N`, the seed is
   printed in the header), then under `-n auto`.
2. Quarantine **with an owner and a link**, not silently:
   ```python
   @pytest.mark.flaky(reruns=2, reruns_delay=1)  # pytest-rerunfailures; tracked in ISSUE-123
   ```
   or a `quarantine` marker deselected in the blocking job and run in a non-blocking one.
3. Fix the root cause (order dependence, time, randomness, network, async leaks, xdist shared resources), then remove
   the marker.

Never add global `--reruns` to the whole suite: it hides new flakiness and real race conditions.

## 7. Reporting

- `--junitxml=reports/junit.xml` for the CI test UI.
- Upload `coverage.xml` and the HTML report (`--cov-report=html`) as artifacts.
- Print `-ra` summaries so skips are visible; a growing skip list is a smell.

## Checklist

- [ ] `--strict-markers`, `xfail_strict`, warnings as errors.
- [ ] Branch coverage, `source` set, `fail_under` in config, combined across matrix jobs.
- [ ] Patch-coverage gate on PRs.
- [ ] Suite green with `-n auto` and in random order.
- [ ] Every flaky marker has an issue link; no suite-wide reruns.
