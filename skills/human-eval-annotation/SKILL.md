---
name: human-eval-annotation
description: Run human evaluation of LLM outputs - annotation guidelines, pointwise and side-by-side tasks, annotator calibration, inter-rater agreement (kappa, Krippendorff's alpha) and sample sizing. Use when collecting ground-truth labels, calibrating an LLM judge, or making a launch decision.
---

# Human eval annotation

Human labels are the ground truth that judges and metrics are calibrated against. They are only as good as the
guidelines and the agreement between annotators, so measure both.

## 1. Choose the task format

| Format | Use when | Output |
| --- | --- | --- |
| Pointwise binary criteria | Calibrating judges, quality bars, regression labels | pass/fail per criterion + note |
| Pointwise Likert (3 or 5 point) | Need gradation and have anchored definitions | score + note |
| Side-by-side (A vs B) | Comparing two systems; preference data | A better / B better / tie (+ strength) |
| Error tagging | Error analysis, taxonomy counts | category labels per output |

Side-by-side is more sensitive than absolute scores for comparing systems. Randomise left/right per item and hide which
system is which.

## 2. Write guidelines

A one-to-three page document containing:

- The task context: who the user is and what a good outcome is for them.
- Each criterion with a definition, a PASS example, a FAIL example and **borderline examples with the decision and
  why**. Borderline examples are where agreement is won.
- What to do when unsure (choose and flag `unsure`, never skip silently) and how to report broken items.
- What annotators must not do: use external tools to check facts unless asked, or judge on length or style when the
  criterion is about correctness.

Pilot: 2-3 annotators label the same 30-50 items, discuss every disagreement, update the guidelines. Repeat until
agreement is acceptable. Version the guidelines and record the version per label.

## 3. Annotation interface

- Show only what the criterion needs: input, output, and context or reference if relevant. Same layout for every item.
- One item and one decision per screen when possible; keyboard shortcuts for labels.
- Collect a free-text note on fails; it powers error analysis.
- Tools: Argilla, Label Studio, a spreadsheet for small runs, or a minimal custom web page. Export to JSONL with item id,
  annotator id, label, note, timestamp, guideline version.

## 4. Agreement

Overlap 20-30% of items across at least two annotators (100% for small calibration sets).

| Statistic | Use |
| --- | --- |
| Percent agreement | Easy to read, but inflated when one label dominates |
| Cohen's kappa | Two annotators, categorical |
| Fleiss' kappa | More than two annotators, each item rated by the same number |
| Krippendorff's alpha | Any number of annotators, missing ratings, ordinal scales |

```python
from sklearn.metrics import cohen_kappa_score
kappa = cohen_kappa_score(labels_a, labels_b)  # same item order
```

Rough reading: < 0.4 the task or guidelines are broken; 0.4-0.6 usable for direction only; > 0.6 good; > 0.8 strong.
Low agreement on a criterion means the criterion is ambiguous, not that annotators are careless; fix the definition.

Resolve disagreements by adjudication (a third senior annotator) and keep both raw and adjudicated labels.

## 5. Sample sizing

- For a pass rate, 95% CI half-width ≈ `1.96 * sqrt(p(1-p)/n)`: n=100 gives about ±10 points, n=400 about ±5.
- For side-by-side, to detect a 60/40 preference with reasonable power you need roughly 200+ non-tie judgements;
  ties reduce effective n.
- For judge calibration, 100-200 items stratified so failures are well represented (aim for at least 30-50 fails).

## 6. Quality control

- Insert gold items with known answers (~5-10%); track each annotator's accuracy on them.
- Monitor time per item; very fast annotators often click through.
- Re-calibrate annotators when guidelines change; drift happens over long projects.
- Domain-expert tasks (medical, legal, code) need expert annotators; crowd labels are not ground truth there.

## 7. Ethics and data handling

Strip PII from items before annotation, warn annotators about disturbing content and allow opting out, pay fairly, and
store labels with access controls matching the source data.

## Pitfalls

- Guidelines with definitions but no borderline examples.
- Reporting labels from a single annotator as ground truth with no agreement number.
- Showing system names or fixed left/right positions in side-by-side tasks.
- 1-10 scales with no anchors.
- Calibration sets that are almost all passes.
