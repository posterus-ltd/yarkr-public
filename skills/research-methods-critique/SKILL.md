---
name: research-methods-critique
description: Critically appraise a study's design, sampling, measurement, confounding, statistics and validity threats, and propose concrete remedies. Use when reviewing a paper, preprint, protocol, thesis or manuscript draft, doing critical appraisal for a review, or peer-reviewing methods.
---

# Research methods critique

Judge whether the study's conclusions follow from its design and data, and how confident a reader should be. Be
specific (point to the section, table or number), proportionate (distinguish fatal flaws from minor issues), and
constructive (each problem gets a remedy or a sensitivity analysis).

## 1. Orient

- What is the research question, and is it causal, descriptive, predictive or exploratory? The standards differ:
  causal language needs a design that supports causal inference.
- What is the primary outcome/estimand? Was it pre-registered (trial registry, OSF, PROSPERO)? Compare the
  registration to the paper for outcome switching.
- Which reporting guideline applies: CONSORT (RCTs), STROBE (observational), PRISMA (systematic reviews), STARD
  (diagnostic accuracy), TRIPOD+AI (prediction models), COREQ / SRQR (qualitative), SPIRIT (trial protocols). Use it
  as a completeness check.

## 2. Appraise by domain

**Design and causal inference**
- Does the design match the claim? Cross-sectional data can't establish temporal order.
- Observational causal claims: is there an explicit confounder set (ideally justified with a DAG)? Adjusting for
  mediators or colliders introduces bias.
- Common traps: immortal time bias, reverse causation, confounding by indication, regression to the mean in
  pre/post designs without control, ecological fallacy.

**Sampling and selection**
- How were participants recruited? Who was excluded, who dropped out, and do completers differ from non-completers?
- Is the sample representative of the target population for the generalisation made?
- Randomised trials: allocation concealment, randomisation method, baseline balance, blinding, attrition and whether
  analysis was intention-to-treat.

**Measurement**
- Are instruments validated for this population and language? Outcome assessors blinded?
- Self-report vs objective measures; recall and social desirability bias.
- Is the exposure measured before the outcome? Misclassification differential or non-differential?

**Statistics**
- Sample size justification and power for the primary outcome; small samples produce inflated effects when
  "significant".
- Effect sizes with confidence intervals, not just p-values. Clinical/practical significance vs statistical.
- Multiplicity: many outcomes, subgroups or timepoints without correction or pre-specification.
- Model assumptions checked? Clustering/repeated measures handled (mixed models, robust SEs)?
- Missing data: amount, mechanism assumed, method (complete case vs multiple imputation).
- Signs of analytic flexibility: unexplained covariate choices, dichotomised continuous variables, p-values clustering
  just under 0.05, outcomes differing from registration.
- Prediction models: internal/external validation, calibration as well as discrimination, overfitting (events per
  variable).

**Qualitative rigour**
- Sampling strategy and saturation/information power reasoning; reflexivity; how themes were derived; quotes that
  support themes; negative cases; member checking or triangulation where appropriate.

**Interpretation**
- Do conclusions overreach (causal language, generalisation beyond sample)? Are limitations acknowledged honestly?
- Conflicts of interest and funding roles.

## 3. Rate and remedy

For each issue: **severity** (`major` — could change the conclusion; `moderate` — weakens confidence; `minor` —
reporting/clarity), the **evidence** (where in the paper), and a **remedy**: additional analysis (sensitivity analysis,
E-value for unmeasured confounding, per-protocol vs ITT comparison, multiple imputation), reporting fix, or tempered
claim. If raw data aren't available, say what the authors should report.

## 4. Output

```markdown
**Study:** <citation> · **Design:** <…> · **Question type:** causal/descriptive/…

**Summary judgement:** <2–3 sentences: what the study can and cannot support>

| # | Domain | Issue | Location | Severity | Remedy |
| - | ------ | ----- | -------- | -------- | ------ |

**Strengths:** <specific>
**Overall confidence in main finding:** high / moderate / low / very low — <reason>
```

For a peer review, convert the table into numbered major and minor comments addressed to the authors, courteous and
actionable.

## Pitfalls

- Generic criticism ("sample size is small") without showing why it matters for this result.
- Treating every limitation as fatal; every study has limitations.
- Critiquing a descriptive study for not establishing causation it never claimed.
- Missing the forest: check first whether the headline conclusion actually follows from the primary analysis.
