---
name: rag-evaluation
description: Evaluate a RAG system in two stages - retrieval (recall@k, MRR, nDCG) and generation (faithfulness, answer relevance, correctness) - using labelled sets and Ragas-style LLM-judged metrics. Use when tuning chunking, embeddings, rerankers or prompts, or before shipping a RAG change.
---

# RAG evaluation

Evaluate retrieval and generation separately. An end-to-end score alone cannot tell you whether to fix the index or
the prompt. Every RAG change should run against the same frozen eval set and be compared to a baseline.

## 1. Build the eval set

Each row:

```json
{"id": "q-042", "question": "How long do refunds take?", "reference_answer": "5-10 business days to the original payment method.",
 "relevant_spans": ["Refunds are issued to the original payment method within 5-10 business days"],
 "answerable": true, "slice": "billing"}
```

- 100-300 rows to start. Source questions from real logs first; add synthetic questions generated from documents only to
  fill coverage gaps (see `synthetic-data-generation`), and have a human check them.
- Label relevant **spans of text**, not chunk ids, so labels survive re-chunking.
- Include 15-30% unanswerable questions, multi-hop questions (need two passages), and questions with exact identifiers.
- Tag slices (topic, language, question type) so you can see where changes help or hurt.
- Freeze a held-out split you do not look at while tuning.

## 2. Retrieval metrics (no LLM needed)

| Metric | Meaning | Use |
| --- | --- | --- |
| recall@k | Share of questions with at least one relevant passage in top k (or share of relevant passages found, for multi-hop) | Primary; use the k you send to the LLM and the k you send to the reranker |
| MRR | Mean of 1/rank of first relevant hit | Is the right passage near the top? |
| nDCG@k | Graded relevance with position discount | When you have graded labels |
| context precision | Share of retrieved chunks that are relevant | Noise in the context window |

Compute them in plain code; they are fast enough to run on every commit.

## 3. Generation metrics (LLM-judged or reference-based)

| Metric | Question it answers | Method |
| --- | --- | --- |
| Faithfulness / groundedness | Is every claim supported by the retrieved context? | Split answer into claims, judge each against context; score = supported / total |
| Answer relevance | Does the answer address the question? | Judge, or embed generated-back questions vs original |
| Answer correctness | Does it match the reference answer? | Judge against reference, or token F1 for short factoid answers |
| Refusal accuracy | Refuses unanswerable, answers answerable | Exact on the `answerable` label |
| Citation precision | Cited sources support the cited claims | See `rag-citation-grounding` |

Libraries such as Ragas, DeepEval and TruLens implement these; read how each metric is computed and spot-check
judgements before trusting the numbers. Judges must be calibrated against human labels (see `llm-as-judge`).

## 4. Diagnose with a 2×2

| | Answer correct | Answer wrong |
| --- | --- | --- |
| **Relevant passage retrieved** | Fine | Generation problem: prompt, context order, too much noise, model |
| **Not retrieved** | Lucky / prior knowledge (check faithfulness) | Retrieval problem: parsing, chunking, embedding, hybrid, filters |

Count rows per cell; fix the larger failing cell first. Read 20 failures per cell before choosing a fix (see
`llm-error-analysis`).

## 5. Run comparisons properly

- Fix everything but the variable under test (one change per experiment).
- Cache retrieval results and generations keyed by config hash so reruns are cheap.
- Report means with bootstrap 95% CIs; on 200 questions a difference under ~3-4 points is often noise. Use paired
  comparisons (same questions, both systems) rather than comparing two independent averages.
- Look at per-slice deltas and at individual flipped cases (pass → fail), not only the mean.
- Track cost and latency per query next to quality.

## 6. In production

- Sample live traffic daily; run faithfulness and answer relevance with a judge (reference-free).
- Track retrieval score distributions and refusal rate for drift.
- Route thumbs-down and low-faithfulness cases into a review queue; promote reviewed cases into the eval set.

## Pitfalls

- One end-to-end score with no retrieval metrics.
- Eval questions generated from the same chunks you index, phrased like the documents: inflated recall.
- Uncalibrated LLM judges reported as ground truth.
- Tuning on the full set with no held-out split.
- Ignoring unanswerable questions, so a system that never refuses looks best.
