---
name: prd-success-metrics
description: Define a PRD's primary success metric, guardrail metrics, baselines, targets and measurement window before build starts. Use when writing the goals section of a PRD, when a spec has vague goals like "improve engagement", or when planning how a launch will be judged.
---

# PRD success metrics

Decide how you will judge the feature *before* building it. Otherwise every launch is declared a success after the
fact.

## Output shape

```markdown
## Goals and success metrics

**Outcome:** <one sentence: the user/business change we expect>

| Type | Metric | Definition | Baseline | Target | Window | Source |
|---|---|---|---|---|---|---|
| Primary | Weekly report creators / weekly active admins | Admins who create ≥1 report in a Mon-Sun week ÷ admins active that week | 18% (Aug 2026, n=4,210) | 25% | 6 weeks after 100% rollout | Amplitude chart <link> |
| Secondary | Median time to first report | From account creation to first `report_created` | 3.2 days | ≤ 1 day | same | <link> |
| Guardrail | Report page p95 load | | 1.4 s | no worse than 1.6 s | continuous | Datadog <link> |
| Guardrail | Support tickets tagged `reports` / 1k accounts | | 6.1 | not above 7 | 6 weeks | Zendesk <link> |

**Decision rule:** Ship to all if primary ≥ target and no guardrail breached. If primary moves < half the target,
revisit before investing in phase 2.
**Instrumentation needed:** events `report_created {source}`, `report_viewed` (owner: <eng>, by <date>).
```

## Steps

1. **State the outcome in user terms.** What will users do differently? Then pick the metric that best captures
   that behaviour.
2. **Choose exactly one primary metric.** It must be:
   - sensitive to this feature (it can actually move within the window),
   - attributable (you can isolate the feature's effect: experiment, flag cohort or clear before/after),
   - hard to game (not raw clicks or page views on the new thing).
   Prefer a rate or ratio over a raw count, so growth in traffic doesn't masquerade as success.
3. **Add 1-2 secondary metrics** that explain *why* the primary moved (funnel step, time-to-value).
4. **Add 2-4 guardrails**: things that must not get worse. Typical: latency, error rate, support contact rate,
   churn/cancellation, revenue per user, a sibling feature's usage (cannibalisation).
5. **Write the exact definition**: numerator, denominator, filters (exclude internal/test accounts), unit (user,
   account, session), time grain. Two analysts should compute the same number.
6. **Pull the baseline** from real data with the date range and sample size. If no data exists, say so and make
   "instrument and baseline for 2 weeks" a pre-launch task.
7. **Set the target** from evidence: past comparable launches, the size of the affected segment, or the minimum
   change worth the investment. Note the reasoning in one line.
8. **Set the window**: long enough to cover the usage cycle (weekly features need ≥ 2-4 full weeks) and novelty effect.
9. **Write the decision rule** in advance: what result leads to ship, iterate or roll back.
10. **List the instrumentation** that must exist before launch and put it in the requirements as an NFR.

## Sizing a target honestly

- Max plausible impact ≈ (share of users exposed) × (share who adopt) × (effect on adopters). If 20% of accounts see
  the feature and half adopt it, a 10-point lift among adopters is only ~1 point overall.
- For A/B tests, check the minimum detectable effect against available traffic before committing to a target; if
  the test would need months, use a before/after on a flagged cohort and state the weaker confidence.

## Metric choice by feature type

| Feature type | Good primary | Weak primary |
|---|---|---|
| Onboarding | Activation rate (key action within N days) | Onboarding screen views |
| Productivity / workflow | Task completion time or completion rate | Button clicks |
| Retention play | N-week retention of the target cohort | DAU |
| Monetisation | Conversion to paid, expansion revenue per account | Pricing page visits |
| Quality / reliability | Error rate, contact rate per 1k users | "Fewer complaints" |
| Self-serve support | Deflection rate *with* guardrail on repeat contact | Help-center views |

## Pitfalls

- Several "primary" metrics: you'll cherry-pick whichever moved.
- Vanity metrics on the new surface (views of the new page always go up from zero).
- No guardrails: the feature hits its target by hurting something else.
- Baselines from a different definition than the target.
- Measuring during a marketing push or seasonal peak without noting it.
- Forgetting to update the PRD with actuals after the window closes; add a "Results" row when shipped.
