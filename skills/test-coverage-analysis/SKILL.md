---
name: test-coverage-analysis
description: Read line/branch coverage reports critically to find untested risky code, ignore vanity percentages and set sensible thresholds. Use when interpreting a coverage report, judging whether a diff's tests cover its changes, or choosing coverage gates for CI.
---

# Test coverage analysis

Coverage tells you what code **ran** during tests, not what was **checked**. Use it to find blind spots, never as
proof of quality. 100% line coverage with no assertions is 0% verification.

## What the metrics mean

| Metric | Measures | Use it for |
| --- | --- | --- |
| Line/statement | lines executed at least once | quick map of untouched code |
| Branch | each side of each `if`/`?:`/`&&`/`switch` arm taken | the most useful default; catches untested else-paths |
| Function | functions called at all | spotting dead or forgotten code |
| Mutation score | % of injected bugs that make a test fail | whether tests actually assert behaviour |

Prefer **branch coverage** for gates. Use **mutation testing** (Stryker for JS/TS/C#, PIT for Java, mutmut or
cosmic-ray for Python, cargo-mutants for Rust) on critical modules to check assertion strength.

## Generating reports

```bash
# Python (coverage.py / pytest-cov)
pytest --cov=src --cov-branch --cov-report=term-missing --cov-report=html
# JS/TS with Vitest
npx vitest run --coverage            # configure provider (v8 or istanbul) in vitest.config
# Jest
npx jest --coverage
# Go
go test ./... -coverprofile=cover.out && go tool cover -func=cover.out
go tool cover -html=cover.out
# JVM: JaCoCo plugin for Maven/Gradle; read the HTML report per package
```

## Reading a report: process

1. **Sort by risk, not by percentage.** Rank files by: handles money, auth, permissions, data deletion, parsing of
   external input, concurrency, or recent incident history. Look at those files first regardless of overall %.
2. **Read uncovered lines in context.** For each red/yellow region ask: what behaviour lives here, and what
   breaks if it's wrong? Typical high-value gaps: error handlers, `else` branches, retry/timeout paths,
   permission-denied paths, rollback/cleanup code, boundary checks.
3. **Check partially covered branches** (yellow): the untaken side is usually the failure path.
4. **Spot false coverage.** Code executed by a broad integration test or snapshot but never asserted on.
   Signs: a test with no assertions or only `toMatchSnapshot` of a huge object; coverage that comes only from
   a setup/fixture path; tests that catch and ignore exceptions.
5. **Ignore low-value gaps** explicitly: generated code, trivial getters, `__repr__`, framework glue, debug-only
   code. Exclude them in config rather than writing tests for them.
6. **Write a short finding list**: file:line range, behaviour untested, risk, suggested test.

## Judging a diff's coverage

- Use **diff/patch coverage** (coverage of changed lines only): e.g. `diff-cover coverage.xml --compare-branch=origin/main`
  for Cobertura XML reports, or the patch status from Codecov/Coveralls if the repo uses them.
- For each changed branch, find the test that takes it and the assertion that would fail if it were wrong.
  If you can't name the assertion, it's uncovered for practical purposes.
- Changed lines covered only incidentally (by an unrelated test) count as a gap if the behaviour is risky.

## Thresholds

- Gate on **not decreasing** coverage and on **patch coverage** of new code (commonly 80% branch), rather than a
  high global number that pushes people to test trivia.
- Set per-module thresholds: stricter for core domain logic, looser for UI glue and adapters.
- Never set 100% as a gate; it buys low-value tests and `# pragma: no cover` abuse.
- Ratchet: when coverage rises, raise the floor; keep the floor a little below current to avoid flaky gates.

## Pitfalls

- Treating the global percentage as a quality score in reviews or dashboards.
- Merging coverage from unit and e2e runs without knowing which suite covers what; keep them separable.
- Exclusion comments sprinkled to hit a number; review every new exclusion.
- Coverage tools miss code run in subprocesses, workers or other runtimes unless configured (e.g. coverage.py
  `parallel`/`concurrency` settings).
- Low coverage on a file that is actually dead: delete it rather than test it.
