---
name: llm-eval-harness
description: Run LLM evals as code with promptfoo, Inspect AI, pytest or a small custom runner - versioned datasets, cached model outputs, graders, result files and a CI job that comments scores and fails on regressions. Use when setting up or fixing an eval pipeline, or wiring evals into pull requests.
---

# LLM eval harness

An eval harness turns "I tried a few prompts" into a repeatable experiment: same dataset version, same config, cached
outputs, machine-readable results, and a CI gate. Pick the lightest tool that fits; the conventions matter more than
the framework.

## Choose a tool

| Need | Tool |
| --- | --- |
| Prompt/model comparisons, YAML config, many providers, quick web viewer | promptfoo |
| Python-first, agents with tools and sandboxes, rich log viewer, research-style tasks | Inspect AI (`inspect_ai`) |
| Evals living next to app code, reusing app functions and fixtures | pytest (plain, or with a helper library such as DeepEval) |
| Existing OpenAI Evals registry assets | OpenAI Evals (otherwise prefer the above) |
| Very custom pipelines | A ~200-line runner: load cases → call system → grade → write JSONL |

## promptfoo sketch

```yaml
# promptfooconfig.yaml
description: support-answers
prompts:
  - file://prompts/support_v3.txt
providers:
  - id: anthropic:messages:<model-id>
  - id: openai:chat:<model-id>
tests: file://evals/support_cases.yaml
defaultTest:
  assert:
    - type: llm-rubric
      value: Does not promise refund timelines other than 5-10 business days.
```

```yaml
# evals/support_cases.yaml
- vars: {question: "Can I change my plan mid-month?"}
  assert:
    - type: icontains
      value: prorated
    - type: llm-rubric
      value: Explains proration and links to the billing page.
```

Run `npx promptfoo@latest eval -c promptfooconfig.yaml -o results.json`, inspect with `npx promptfoo@latest view`.
Prefer deterministic assertion types (`equals`, `contains`, `is-json`, `javascript`, `python`) and keep `llm-rubric`
for what code cannot check.

## Inspect AI sketch

```python
from inspect_ai import Task, task
from inspect_ai.dataset import json_dataset
from inspect_ai.scorer import model_graded_fact
from inspect_ai.solver import generate, system_message

@task
def support_answers():
    return Task(
        dataset=json_dataset("evals/support.jsonl"),   # fields: input, target, id, metadata
        solver=[system_message(open("prompts/support_v3.txt").read()), generate()],
        scorer=model_graded_fact(),
    )
```

Run `inspect eval evals/support.py --model <provider>/<model-id>`; browse logs with `inspect view`.

## pytest sketch

```python
import json, pytest
CASES = [json.loads(l) for l in open("evals/support.jsonl")]

@pytest.mark.eval
@pytest.mark.parametrize("case", CASES, ids=[c["id"] for c in CASES])
def test_support(case, cached_llm, judge, record_result):
    out = cached_llm(prompt_version="v3", **case["input"])
    checks = {"no_card_request": "card number" not in out.lower(),
              "rubric": judge(case["rubric"], out)}
    record_result(case["id"], out, checks)
    assert all(checks.values())
```

Collect per-case results to a JSONL file in a fixture; compute aggregate metrics in a separate step, because pytest's
pass/fail alone cannot express "pass rate ≥ baseline - 2 points".

## Harness conventions (any tool)

1. **Version everything in the run record**: dataset version/hash, prompt version, model id + version, temperature,
   judge model + judge prompt version, code commit.
2. **Cache model calls** keyed on a hash of (model, params, full prompt). Reruns that only change graders cost nothing;
   use `--no-cache` style switches for deliberate fresh runs.
3. **Write per-case results** (JSONL: id, input ref, output, each grader verdict + reason, latency, tokens, cost, error)
   plus a summary JSON. Never only the aggregate.
4. **Bounded concurrency with retries** on rate limits; record failures as errors, do not drop them.
5. **Separate generation from grading** so judges can be recalibrated and re-run over stored outputs.
6. **Keep secrets in env vars** (`ANTHROPIC_API_KEY`, `OPENAI_API_KEY`), never in config files.

## CI wiring

- On every PR touching prompts, model config, retrieval or tools: run the **smoke** subset (10-30 cases, < 5 min).
- Nightly or on label (`run-full-evals`): full dev set, multiple samples per case for variance.
- Compare to the stored baseline from the main branch (see `llm-regression-testing`); fail the job on threshold breach,
  not on any single case failure.
- Post a PR comment: headline metrics with CIs, delta vs baseline, list of flipped cases with links to outputs.
- Upload results as build artifacts; keep history so trends are visible.

```yaml
# .github/workflows/evals.yml (excerpt)
- run: npx promptfoo@latest eval -c promptfooconfig.yaml -o results.json
  env: { ANTHROPIC_API_KEY: "${{ secrets.ANTHROPIC_API_KEY }}" }
- run: python scripts/compare_to_baseline.py results.json baseline/main.json --max-drop 0.02
```

## Pitfalls

- Evals that hit live models on every run with no cache: slow, expensive, noisy.
- Results stored only as a pass rate; nobody can see what changed.
- CI that fails on any single flaky case, so people learn to ignore it.
- Prompt text duplicated in eval config and app code; load the same prompt file the app uses.
- Judges re-run with a different model version and compared to old numbers.
