---
name: llm-as-judge
description: Design LLM-as-judge graders - binary rubric prompts, pointwise vs pairwise scoring, position/length/self-preference bias controls, and calibration against human labels. Use when outputs are open-ended and code cannot grade them, or when an existing judge disagrees with people.
---

# LLM-as-judge

A judge is a classifier you must validate like any other model. Write it narrowly, measure its agreement with human
labels, and only then trust its numbers.

## 1. Decide if you need one

Use code first: exact match, regex, JSON schema, unit tests, tool-call assertions. Use a judge only for properties
code cannot check: faithfulness to a source, whether an answer addresses the question, tone, policy compliance,
completeness against key facts.

## 2. Pointwise or pairwise

| Mode | Use when | Output |
| --- | --- | --- |
| Pointwise, binary per criterion | Regression gates, monitoring, absolute quality bars | pass/fail + reason per criterion |
| Pointwise with reference | You have a reference answer or key facts | pass/fail on "contains facts, no contradictions" |
| Pairwise (A vs B) | Comparing two prompts/models, preference data | A / B / tie |

Avoid 1-10 scales: judges cluster scores and humans disagree on midpoints. If you need gradation, use several binary
criteria and sum them, or a 3-point scale with written anchors.

## 3. Write the judge prompt

- **One criterion per judge call** (or a clearly separated list with one verdict each). Mixed criteria give mushy scores.
- Define pass and fail precisely with examples of each, including borderline cases taken from real data.
- Give the judge exactly what it needs: input, output, and reference or context. Nothing else.
- Ask for a short reasoning **before** the verdict, then a machine-readable verdict.

```text
You are grading whether an assistant answer is fully supported by the provided context.

PASS: every factual claim in the answer is stated in or directly implied by the context.
FAIL: any claim is absent from or contradicted by the context. Hedged statements still count as claims.

<context>{context}</context>
<answer>{answer}</answer>

First list each claim and whether the context supports it. Then output on the last line exactly:
VERDICT: PASS or VERDICT: FAIL
```

- Parse with structured output or a strict regex; count unparseable outputs as errors, not passes.
- Use temperature 0 and pin the judge model version. A judge model upgrade is a new judge that must be recalibrated.

## 4. Control known biases

| Bias | Control |
| --- | --- |
| Position (prefers first/second) | Pairwise: judge both orders; count as win only if consistent, else tie |
| Length / verbosity | Instruct to ignore length; check correlation of verdict with length on calibration data |
| Self-preference | Use a judge from a different model family than the system under test, or confirm with humans |
| Leniency | Include clear FAIL examples in the prompt; measure false-pass rate specifically |
| Reference anchoring | For open tasks, judge against key facts rather than one gold wording |

## 5. Calibrate against humans

1. Sample 100-200 real outputs, stratified to include many failures (not 95% easy passes).
2. Get human labels with the same criterion text (two annotators on a subset to measure human agreement; see
   `human-eval-annotation`).
3. Run the judge. Compute:
   - **TPR / TNR** (recall on passes and on fails) or precision/recall on the FAIL class
   - **Cohen's kappa** judge vs human, compared to human vs human kappa
4. Read every disagreement. Fix the prompt (definitions, examples), not the labels, unless the label was wrong.
5. Iterate on a dev half of the labels; report final agreement on the untouched half.
6. Target: judge-human agreement close to human-human agreement. Below kappa ~0.6, do not use it for gating.

Correct reported pass rates for known judge error when it matters: with judge TPR and TNR known,
`true_rate ≈ (observed + TNR - 1) / (TPR + TNR - 1)`.

## 6. Run it in production evals

- Store judge reasoning with the verdict; it is what you read during error analysis.
- Re-check calibration on fresh samples monthly or whenever the product, prompt or judge model changes.
- Track judge cost; small models often suffice for narrow binary criteria once calibrated.

## Pitfalls

- "Rate helpfulness 1-10" with no definitions.
- Never measuring agreement with humans.
- Calibration set with almost no failures, so a judge that always says PASS scores 95%.
- Judge sees the system prompt or hidden reasoning and is swayed by it.
- Using the same model to generate and to judge without checking self-preference.
