---
name: llm-eval-dataset-design
description: Design an LLM eval dataset - sample real traffic, add targeted edge cases, define expected outputs or rubrics per case, tag slices, and split into dev and held-out sets. Use when starting evals for a prompt, agent or model feature, or when existing evals stop catching real failures.
---

# LLM eval dataset design

An eval set is a product spec in examples. It should look like real usage, over-represent the cases that break, and
say for every case what "good" means in a way a script or judge can check.

## 1. Define the task and the grading mode

Write one paragraph: what input the system gets, what it must produce, and what users care about. Then pick a grading
mode per case type:

| Output type | Expected field | Grader |
| --- | --- | --- |
| Label, number, short fact, JSON field | `expected` exact value | Exact match / normalised match |
| Structured output | JSON schema + key field values | Schema validation + field checks |
| Code | Tests | Execute tests (pass@k) |
| Free text with a right answer | `reference` answer + key facts list | Judge checks key facts present, nothing contradicted |
| Open-ended (tone, helpfulness) | `rubric` with 2-5 binary criteria | LLM judge per criterion, calibrated |
| Agent / tool use | Expected final state or required tool calls | State check, trajectory assertions |

Prefer the most deterministic grader that fits. Binary pass/fail criteria are easier to label, judge and act on than
1-10 scales.

## 2. Collect cases from four sources

1. **Real traffic** (most weight): sample production logs or beta usage. Stratify by intent/topic/user segment, not just
   random, so rare-but-important intents appear. Scrub PII before storing.
2. **Known failures**: bug reports, thumbs-down, support escalations, every incident. Each one becomes a case.
3. **Edge cases by design**: empty or huge inputs, ambiguous requests, wrong language, adversarial / prompt injection,
   out-of-scope requests that must be refused, conflicting instructions, boundary values.
4. **Synthetic fill**: generate only to cover dimensions with too few real cases (see `synthetic-data-generation`), and
   review every synthetic case before it enters the set.

Sizes that work: 50-100 cases to start iterating; 200-500 for decisions with confidence intervals; grow from failures.

## 3. Case schema

```yaml
- id: refund-017
  input: {messages: [{role: user, content: "I was charged twice, can I get one back?"}]}
  expected: null
  reference: "Explains duplicate-charge refund; asks for order id; no promise of a timeline beyond policy."
  rubric:
    - Asks for the order id or confirms it from context
    - Does not promise a refund timeline other than 5-10 business days
    - Does not ask for full card number
  tags: [billing, refund, multi-intent]
  source: prod-2026-09
  difficulty: medium
  split: dev
```

Keep `id` stable forever; comparisons across runs depend on it. Record `source` so you can report real vs synthetic.

## 4. Write expected outputs carefully

- Two people should agree on pass/fail from the rubric alone. If they would not, split or sharpen the criterion.
- Capture **must** and **must not** criteria; refusals and safety cases need "must not" checks.
- For open-ended tasks, list key facts rather than a single gold answer that penalises valid alternatives.
- Have a domain expert review references; wrong labels are the most common eval bug. Track a `label_confidence`.

## 5. Split

- **dev**: you look at it, iterate prompts on it.
- **held-out / test**: run only to confirm a decision; never read individual cases while tuning. Refresh it when you
  have seen it too often.
- Split by group (same user, same document, same template) to prevent near-duplicates leaking across splits.
- Keep a small **smoke** subset (10-20 cases) for fast CI runs.

## 6. Coverage check

Build a table of tags × count × current pass rate. Every slice that matters for a launch decision needs at least ~30
cases to say anything; mark thinner slices as "directional only".

## Maintenance

- Version the dataset (git or a dataset store) and record the version in every eval run.
- Add every production failure that is fixed as a regression case.
- Re-review labels when the product policy changes; stale labels punish correct behaviour.
- Remove or fix cases that every system passes trivially or that are mislabelled; they hide signal.

## Pitfalls

- Only happy-path, hand-written cases that look like the prompt's examples.
- Gold answers so specific that correct paraphrases fail.
- Tuning on the held-out set.
- No tags, so a regression in one slice disappears in the average.
- Including production data without consent or PII scrubbing.
