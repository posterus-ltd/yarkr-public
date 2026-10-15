---
name: llm-regression-testing
description: Gate prompt, model, retrieval and tool changes on eval regressions - stored baselines, per-metric thresholds, paired comparisons, flaky-case handling and per-case diff reports in CI. Use when changing a prompt or model version, upgrading a provider model, or setting up a ship/hold gate for LLM features.
---

# LLM regression testing

Every change to a prompt, model, temperature, retrieval setup or tool definition can silently break cases that used to
work. A regression gate compares the candidate to a baseline on the same cases and blocks changes that make things
measurably worse, while tolerating noise.

## 1. Baselines

- The baseline is the eval run of the current production config (main branch) on the same dataset version, stored as
  per-case results (JSONL) plus summary.
- Refresh the baseline whenever main changes or the dataset version changes. Never compare across dataset or judge
  versions; re-run the baseline instead.
- Store baselines as CI artifacts or in a results store keyed by (dataset version, config hash).

## 2. What to gate on

| Gate | Example rule |
| --- | --- |
| Headline quality | Pass rate must not drop more than 2 points, **and** the paired 95% CI of the difference must not lie entirely below 0 |
| Critical slices | Safety, refusal, top-revenue intents: no drop beyond 1 point, or zero tolerance for specified must-pass cases |
| Must-pass cases | A tagged list (incidents, legal/safety) that must pass every time |
| Format validity | Schema-valid rate ≥ 99.5% |
| Cost and latency | Cost per case ≤ +15%; p95 latency ≤ +20% (warn, or block if contractual) |

Use relative and absolute thresholds that reflect your eval-set noise (see `llm-eval-metrics` for CIs). Write the
rules down in a config file versioned with the code.

## 3. Handle non-determinism and flaky cases

1. Measure noise: run the baseline config 3-5 times on the same cases. Cases whose verdict changes across identical runs
   are **flaky**.
2. For flaky cases, either run k samples and score majority or pass rate, or fix them (sharpen the rubric, lower
   temperature for the test, make the check deterministic).
3. Track a flaky list; exclude flaky cases from must-pass gates but keep them in aggregate metrics.
4. Pin model versions (dated snapshots) in tests; an unpinned alias can change underneath you and look like a
   regression in your change.

## 4. Compare per case

For each case compute the transition: pass→pass, fail→fail, **pass→fail (regression)**, **fail→pass (fix)**.

```python
def diff(base, cand):
    b = {r["id"]: r["pass"] for r in base}; c = {r["id"]: r["pass"] for r in cand}
    ids = b.keys() & c.keys()
    return {"regressed": sorted(i for i in ids if b[i] and not c[i]),
            "fixed": sorted(i for i in ids if not b[i] and c[i]),
            "missing": sorted(b.keys() ^ c.keys())}
```

McNemar's test on (regressed, fixed) counts tells you if the net change is beyond chance. A net-positive change with
regressions concentrated in one slice still needs review.

## 5. Diff report (PR comment)

```markdown
### Eval: support-evals v14 (n=312) - candidate vs main
| metric | main | candidate | diff [95% CI] | gate |
| all-pass | 66.3% | 71.2% | +4.9 [+1.6, +8.3] | ok |
| refusal slice | 94.0% | 92.0% | -2.0 [-6.1, +2.0] | WARN |
| p95 latency | 2.9s | 3.1s | +7% | ok |
Regressed (12): refund-017, refund-044, ... (links to side-by-side outputs)
Fixed (27): ...
Flaky excluded: 5
```

Link each regressed id to a side-by-side view of both outputs and grader reasons; reviewers decide from cases, not from
the number.

## 6. Process

- Smoke subset on every relevant PR; full set nightly and before release.
- Model upgrades (new provider snapshot) go through the same gate as prompt changes, plus a manual read of 20-30
  regressed cases.
- When a regression is accepted deliberately (policy change), update expected outputs in the dataset in the same PR and
  say so in the description.
- Every production incident adds a must-pass case.

## Pitfalls

- Gating on "any case failed": with LLM noise the gate is always red and gets ignored.
- Comparing against a stale baseline or a different dataset version.
- Averages that hide a collapsed critical slice.
- Unpinned model aliases in the baseline.
- Accepting regressions without updating the dataset, so the same cases flag forever.
