---
name: literature-synthesis-matrix
description: Extract included studies into a synthesis matrix (design, sample, outcomes, findings, risk of bias, limitations) and write a thematic, comparative synthesis rather than summaries in series. Use when synthesising evidence for a literature review, systematic/scoping review, thesis chapter or background section.
---

# Literature synthesis matrix

Synthesis means saying what the body of evidence shows, where studies agree or disagree, and why. A review that reads
"Smith (2020) found… Jones (2021) found…" is an annotated bibliography, not a synthesis. The matrix makes comparison
possible; the write-up is organised by theme or question, not by paper.

## 1. Design the extraction form before extracting

Columns depend on the question; a typical quantitative set:

| Column | Notes |
| --- | --- |
| Study ID | First author + year, and a stable key (links to the reference library) |
| Country / setting | |
| Design | RCT, cohort, case-control, cross-sectional, qualitative, mixed |
| Sample | n analysed, key characteristics |
| Intervention / exposure | Dose, duration, delivery |
| Comparator | |
| Outcomes & measures | Instrument, timepoint |
| Main findings | Effect estimate with CI/p, direction; or key themes for qualitative |
| Risk of bias / quality | Tool and overall rating |
| Limitations | As stated + your own |
| Funding / COI | |
| Theme tags | Filled in during synthesis |

For qualitative studies replace effect columns with: phenomenon, approach (e.g. thematic analysis), key themes with
illustrative quotes, and reflexivity. For scoping reviews, chart what's needed to map the evidence (PCC), not effects.

Pilot the form on 2–3 studies; adjust; then extract all. In formal reviews, a second person verifies extraction.

## 2. Extraction rules

- Extract exactly what the paper reports, with page/table reference; write `NR` (not reported) rather than inferring.
- Keep units and timepoints explicit. Record the effect measure the study used (MD, SMD, OR, RR, HR) and its CI.
- Multiple reports of one study → one row, citing all reports.
- Note discrepancies between abstract and results (use the results).
- Appraise risk of bias with a tool matched to design: RoB 2 (RCTs), ROBINS-I (non-randomised interventions),
  Newcastle–Ottawa or JBI checklists (observational), CASP or JBI (qualitative), QUADAS-2 (diagnostic accuracy).

## 3. From matrix to synthesis

1. **Group** studies: by outcome, intervention type, population, setting or design. Sort the matrix by the grouping.
2. **Tabulate** per group: number of studies, total participants, direction of effect, range of estimates, risk of bias
   distribution.
3. **Compare**: Where do results converge? Diverge? Can differences be explained by design, population, dose, follow-up
   length or risk of bias? Look for patterns (e.g. effects only in trials with > 6-month follow-up).
4. **Weigh**: give more weight to larger, lower-risk-of-bias studies; don't count votes ("7 of 10 studies were
   positive" is weak — state effect sizes and certainty instead).
5. **Rate certainty** per outcome when appropriate with GRADE (high / moderate / low / very low), considering risk of
   bias, inconsistency, indirectness, imprecision and publication bias.
6. **Identify gaps**: populations, settings, outcomes or designs missing.

If meta-analysis isn't appropriate, follow the SWiM reporting guideline (synthesis without meta-analysis): state how
studies were grouped, the standardised metric used, the synthesis method, and how heterogeneity was investigated.

## 4. Writing the synthesis

Organise by theme or sub-question. Each paragraph:
- Opens with the **claim** about the evidence ("App-based self-management modestly lowers HbA1c in the short term").
- Supports it with **multiple studies** compared, with magnitudes and certainty ("pooled/ranged 0.3–0.6 percentage
  points across six RCTs at 3–6 months (moderate certainty)").
- Addresses **disagreement** and explains it where possible.
- Ends with the **implication** or gap.

Cite several studies per sentence where they share a finding. Use hedged, calibrated language matched to certainty
("probably", "may", "evidence is very uncertain").

## Output

1. The matrix (Markdown table or CSV), with `NR` for missing data.
2. Grouped summary table per theme/outcome.
3. Thematic synthesis text.
4. Gaps and limitations of the evidence base (and of the review).

## Pitfalls

- Paper-by-paper paragraphs.
- Treating statistically non-significant results as evidence of no effect.
- Ignoring risk of bias when weighing findings.
- Over-extrapolating from narrow populations or settings.
- Inferring data the paper doesn't report.
