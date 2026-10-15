---
name: llm-eval-metrics
description: Choose and report metrics for LLM tasks - exact match, token F1, BLEU/ROUGE caveats, semantic similarity, pass@k, rubric pass rates, refusal and cost/latency - with bootstrap confidence intervals and paired significance tests. Use when deciding how to score an eval, or when reporting or comparing eval results.
---

# LLM eval metrics

Pick the metric that matches how a user judges the output, make it as deterministic as possible, and always report
uncertainty. A metric without a confidence interval and a sample size is an anecdote.

## Metric by task

| Task | Primary metric | Notes |
| --- | --- | --- |
| Classification, routing, extraction of a field | Accuracy; per-class precision/recall/F1; macro-F1 for imbalance | Confusion matrix beats one number |
| Short factual answers | Normalised exact match; token F1 | Normalise case, punctuation, articles, whitespace, number formats |
| Structured output | Schema validity rate; field-level accuracy | Report validity separately from correctness |
| Code generation | pass@k from executed tests | Unbiased estimator below |
| Summaries, open answers | Rubric criteria pass rate (judge or human); key-fact recall | ROUGE/BLEU correlate poorly with quality for LLM outputs; use only as a sanity check |
| Semantic closeness to a reference | Embedding cosine or a judge "equivalent?" | Cosine thresholds must be calibrated; high similarity ≠ correct |
| RAG | recall@k, faithfulness, answer correctness | See `rag-evaluation` |
| Safety / policy | Violation rate, correct refusal rate, false refusal rate | Track both directions |
| Agents | Task success rate; steps, tool errors, cost per success | Success is the end state, not the transcript |
| Operations | p50/p95 latency, tokens and $ per case, error/timeout rate | Report with quality; a win that doubles cost is a trade-off |

## pass@k

With `n` samples per problem and `c` correct, the unbiased estimate is:

```python
from math import comb
def pass_at_k(n, c, k):
    return 1.0 if n - c < k else 1.0 - comb(n - c, k) / comb(n, k)
```

Average over problems. Use n ≥ 2k; report the temperature used.

## Aggregation rules

- Report per-case results, then aggregate. Keep the per-case table; it is what regression analysis needs.
- Report per-slice (tag) metrics next to the overall number, with the slice size.
- Micro vs macro: macro-average when every class or slice matters equally; say which you used.
- Multi-criterion rubrics: report each criterion's pass rate and the share of cases passing all criteria.
- Exclude nothing silently: errors, timeouts and unparseable outputs count as failures (and are reported separately).

## Uncertainty

Bootstrap a 95% CI by resampling cases:

```python
import numpy as np
def bootstrap_ci(scores, n_boot=10_000, seed=0):
    rng = np.random.default_rng(seed); s = np.asarray(scores, float)
    means = rng.choice(s, (n_boot, len(s)), replace=True).mean(axis=1)
    return s.mean(), np.percentile(means, [2.5, 97.5])
```

- For a pass rate p on n cases, the 95% half-width is about `1.96 * sqrt(p(1-p)/n)`: ±7 points at n=200, p=0.7.
  Use this to size eval sets before running them.
- Comparing two systems on the same cases: use a **paired** test. Bootstrap the per-case difference, or McNemar's test on
  binary outcomes (count of A-pass/B-fail vs A-fail/B-pass). Paired tests are far more sensitive than comparing CIs.
- Non-determinism: run each case 3-5 times at production temperature on a subset to measure run-to-run variance; a
  difference smaller than that variance is not a difference.
- Multiple comparisons: when testing many slices, expect some "significant" swings by chance; confirm on held-out data.

## Reporting template

```text
System B vs A on support-evals v14 (n=312, dev split), judge <judge-model>@<snapshot> (kappa 0.78 vs humans)
Rubric all-pass: 71.2% [66.1, 76.0] vs 66.3% [61.0, 71.4]; paired diff +4.9 [+1.6, +8.3]
Flips: 27 fail→pass, 12 pass→fail. Regressions concentrated in slice "refund" (6 of 12).
Cost/case $0.0041 vs $0.0038; p95 latency 3.1s vs 2.9s.
```

## Pitfalls

- Using BLEU/ROUGE as the headline for generative quality.
- Reporting a single mean with no n and no CI.
- Comparing two runs on different dataset versions or different judges.
- Dropping errored cases from the denominator.
- Picking the metric after seeing which one makes the change look good.
