---
name: llm-error-analysis
description: Do error analysis on LLM outputs - read traces and failed eval cases, write open notes, cluster them into a failure taxonomy, count categories, find root causes and pick the fixes with the largest impact. Use when eval scores are low or flat, when users report bad answers, or before deciding what to build next.
---

# LLM error analysis

Look at the data before you write metrics or fixes. A pass rate tells you how often you fail; error analysis tells you
why and which fix pays off. Budget the time: 100 traces read carefully beat 10,000 scored blindly.

## 1. Sample what to read

- Take 50-100 traces: failed eval cases, thumbs-down or escalated production traces, plus a random slice of "passing"
  traffic (judges and users miss failures).
- Stratify across intents, user segments and models so one dominant topic does not fill the sample.
- For agents and RAG, read the **full trace**: system prompt, retrieved context, tool calls and results, intermediate
  reasoning, final output. Most root causes sit upstream of the final message.

## 2. Open coding (first pass)

For each trace write one or two lines on the **first** thing that went wrong (the most upstream error), in plain
language, without a predefined list:

```csv
trace_id,first_failure_note,stage
t-0193,"Searched the 2023 policy doc; 2026 version not in index",retrieval
t-0201,"Called refund tool before verifying order belongs to user",tool-use
t-0207,"Answer correct but 400 words for a yes/no question",generation-style
```

Note the first failure, because downstream errors are usually consequences. Mark traces that are fine as fine.

## 3. Axial coding (build the taxonomy)

- Group notes into 5-12 categories with crisp names and a one-line definition each, e.g. `stale-or-missing-doc`,
  `wrong-tool-order`, `ignored-instruction`, `hallucinated-fact`, `format-violation`, `over-refusal`,
  `ambiguous-request-not-clarified`.
- Each category must be actionable: someone should know what kind of fix it implies.
- An LLM can propose clusters from the notes; a human must review and rename them. Keep an `other` bucket under ~10%.
- Re-label all sampled traces with the final categories (one primary, optional secondary).

## 4. Count and prioritise

| Category | Count | Share | Severity | Fix type | Effort |
| --- | --- | --- | --- | --- | --- |
| stale-or-missing-doc | 23 | 31% | high | index refresh job | S |
| ignored-instruction (format) | 14 | 19% | low | prompt + validator | S |
| wrong-tool-order | 9 | 12% | high | tool precondition in code | M |

Priority ≈ share × severity ÷ effort. Keep reading until new traces stop producing new categories (saturation),
typically 50-100 traces.

## 5. Map categories to fixes

| Root cause | Typical fix |
| --- | --- |
| Missing/stale knowledge | Data or index pipeline, not the prompt |
| Retrieval miss | Chunking, hybrid search, reranker, query rewrite |
| Instruction ignored | Make it explicit, move it up, add an example, or enforce in code/schema |
| Format errors | Structured outputs / schema validation with retry |
| Wrong tool use | Better tool descriptions, preconditions enforced in tool code, fewer overlapping tools |
| Hallucinated facts | Grounding + citation checks, refusal path |
| Ambiguity | Clarifying-question behaviour, product change |
| Capability limit | Bigger model, decomposition, or descoping |

Prefer fixes in code, data or tools over prompt patches when the failure is deterministic.

## 6. Close the loop

- For each top category, turn representative traces into eval cases and, where possible, a cheap automated check
  (assertion or calibrated judge) that detects that category.
- After the fix, rerun the eval and recount the category on fresh traces. The share should drop; check no other
  category grew.
- Repeat error analysis after every significant change and periodically on production traffic; failure modes shift.

## Pitfalls

- Starting from generic metrics ("helpfulness", "coherence") instead of observed failures.
- Delegating all reading to an LLM; it misses domain-specific wrongness. Humans read, models assist.
- Labelling downstream symptoms instead of the first failure.
- Taxonomies with 30 categories nobody can apply consistently.
- Fixing the most memorable failure instead of the most frequent severe one.
