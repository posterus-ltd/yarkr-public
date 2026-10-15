---
name: logic-model-builder
description: "Build logic models and theories of change: inputs, activities, outputs, short/intermediate/long-term outcomes, assumptions and SMART indicators. Use when a grant, program design or evaluation plan needs a logic model, theory of change, results framework or outcome indicators."
---

# Logic model builder

A logic model shows the causal chain from resources to change: *if* we have these inputs and do these activities,
*then* we produce these outputs, which *lead to* these outcomes. Funders use it to judge whether the program logic holds
and whether it can be measured.

## 1. Inputs to collect

- Problem and target population (from the need statement — use the same definitions and numbers).
- Program activities as planned, with dosage (how often, how long, how many participants).
- Funder's required format (W.K. Kellogg-style table, results framework, logframe with means of verification) and any
  mandated indicators.
- Existing data systems: what the organisation can actually collect.

## 2. Work backwards

1. **Long-term outcome / impact**: the change in condition the program contributes to (often beyond the grant period).
2. **Intermediate outcomes**: behaviour or practice changes (6–24 months).
3. **Short-term outcomes**: changes in knowledge, skills, attitudes, access (during the program).
4. **Outputs**: countable products of activities (sessions delivered, people served, materials distributed).
5. **Activities**: what staff do.
6. **Inputs**: staff, partners, funding, facilities, curricula.

Then read it forwards as "if… then…" statements. Every outcome must be reachable from at least one activity; every
activity must contribute to at least one outcome. Cut or add until both hold.

## 3. Outputs vs outcomes (the most common error)

| Output (what we did) | Outcome (what changed for people) |
| --- | --- |
| 120 parents attend 8-week workshops | 75% of completing parents report using two or more positive discipline techniques at 3-month follow-up |
| 2,000 meals distributed | Participating households report reduced food insecurity on the USDA 6-item scale |
| 40 youth placed in internships | 60% of interns are employed or enrolled in education 6 months after program |

## 4. Indicators

For each outcome write 1–2 SMART indicators:
- **Specific** population and change; **Measurable** with a named tool; **Achievable** given dosage and baseline;
  **Relevant** to the outcome; **Time-bound**.
- Format: `<% or #> of <population> who <change> as measured by <tool>, by <time>`; include baseline if known and the
  data source and collection frequency.
- Prefer validated instruments where they exist (e.g. PHQ-9 for depressive symptoms, USDA food security module) and
  name them only if you're sure of them; otherwise write `[instrument to confirm]`.
- Targets should be defensible: base them on the organisation's past results or published program benchmarks, and say
  which.

## 5. Assumptions and external factors

List what must be true for the chain to work ("participants have transport", "school district continues referral
agreement") and external factors outside control (policy changes, economy). These show the funder you understand the
risk and inform the evaluation.

## 6. Output formats

**Table (default):**

| Inputs | Activities | Outputs | Short-term outcomes | Intermediate outcomes | Long-term outcomes |
| --- | --- | --- | --- | --- | --- |

Followed by an **indicator table**:

| Outcome | Indicator | Baseline | Target | Data source / tool | Frequency | Responsible |
| --- | --- | --- | --- | --- | --- | --- |

**Theory of change narrative** (when asked): 1–2 paragraphs stating the pathway, the evidence base for key links
(cite research or prior results), and assumptions.

**Logframe** (international donors): rows Goal / Purpose / Outputs / Activities × columns Narrative summary /
Indicators / Means of verification / Assumptions.

For a visual, emit a Mermaid flowchart (left to right) with one node per box and arrows only where a causal link is
claimed.

## Checklist

- [ ] Outcomes describe change in people/conditions, not program effort.
- [ ] Each outcome has an indicator the organisation can actually collect.
- [ ] Numbers match the proposal narrative, budget (staffing for the activities) and evaluation plan.
- [ ] Long-term outcomes are claimed as contribution, not sole attribution.
- [ ] Timeframes fit within the grant period for anything promised in reports.

## Pitfalls

- Twenty outcomes for a small program; keep 3–6 outcomes total.
- Activities with no outcome ("quarterly newsletter") — drop or justify.
- Targets of 100% or round numbers with no basis.
- Indicators requiring data the organisation has no system or consent to collect.
