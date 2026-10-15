---
name: embedding-model-selection
description: Choose an embedding model for search or RAG by shortlisting from MTEB-style leaderboards, then benchmarking candidates on your own queries for recall, latency, dimension, cost, language coverage and licence. Use when starting a retrieval system, switching embedding providers, or adding languages or domains.
---

# Embedding model selection

Leaderboards shortlist; your own data decides. A model that is top-3 on MTEB retrieval can lose to a smaller one on your
domain (code, legal, product catalogues, a non-English language). Run a small bake-off before committing, because
switching later means re-embedding the whole corpus.

## 1. Write down constraints first

| Constraint | Questions |
| --- | --- |
| Hosting | API allowed, or must run self-hosted / on-prem / in-region? |
| Languages | Which languages in documents and queries? Cross-lingual queries? |
| Input length | Longest chunk in tokens? (Text beyond the model's max is truncated.) |
| Corpus size | Number of chunks × dimension × 4 bytes = raw vector memory (float32) |
| Latency | Query embedding budget (ms), on what hardware? |
| Cost | Per-token API price × (corpus + re-embeds + query volume) |
| Licence | Commercial use allowed for open-weight models? |

## 2. Shortlist (3-5 models)

- Use the MTEB leaderboard's **retrieval** task scores (not the overall average) and filter by language, size and max
  tokens. Prefer models evaluated on tasks resembling yours.
- Include at least: one strong hosted API model, one strong open-weight model you could self-host, and your current
  model (or BM25) as baseline.
- Note per model: dimension, max input tokens, whether it supports truncatable (Matryoshka) dimensions, required
  query/document prefixes or task instructions, and distance metric.

## 3. Build the bake-off set

- 100-300 real queries (from logs, support tickets, search analytics) with labelled relevant passages. If you have no
  logs, write queries the way users would phrase them, not by copying document sentences.
- Include hard cases: exact identifiers, abbreviations, multilingual, negation, very short queries.
- Keep chunking fixed across candidates.

## 4. Run it

For each candidate: embed the corpus (with the correct document prefix), embed queries (with the query prefix),
exact (flat) cosine search so ANN settings do not confound results, then compute:

- **recall@k** at the k you will feed the reranker or LLM (e.g. 20 and 5)
- **nDCG@10** / **MRR** for ranking quality
- p50/p95 query-embedding latency on target hardware, and corpus embedding throughput
- storage at the chosen dimension and precision

```python
import numpy as np
def evaluate(q_vecs, d_vecs, relevant, k=10):
    q = q_vecs / np.linalg.norm(q_vecs, axis=1, keepdims=True)
    d = d_vecs / np.linalg.norm(d_vecs, axis=1, keepdims=True)
    top = np.argsort(-q @ d.T, axis=1)[:, :k]
    return np.mean([len(set(t) & relevant[i]) > 0 for i, t in enumerate(top)])
```

Also run **hybrid (BM25 + dense)** for the top two candidates; hybrid often closes the gap between models and changes
the winner.

## 5. Decide

- Report a table: model, recall@5, recall@20, nDCG@10, latency, $/1M tokens or GPU cost, dim, storage, licence.
- Compute bootstrap confidence intervals on recall (resample queries). Differences under ~2 points on 200 queries are
  usually noise; break ties on cost and operability.
- Check per-slice results (language, query type). A model that wins overall but fails one language you serve is a loss.

## Dimension and precision

- Matryoshka-trained models can be truncated (e.g. 3072 → 1024 or 512) with small recall loss; measure it on your set.
- Scalar (int8) or binary quantisation cuts memory 4-32×; pair binary quantisation with rescoring on full vectors.
- Normalise vectors if you use dot product; use the metric the model was trained for.

## Operational rules

- Store `embedding_model` and version with every vector; never mix models in one index.
- Pin the model version for API models; providers can deprecate models, so keep source text to re-embed.
- Plan the migration: build the new index in parallel, dual-run the eval, switch with a flag.
- Fine-tuning an embedding model on your pairs can beat any off-the-shelf choice, but only after you have a few
  thousand labelled (query, passage) pairs and the bake-off harness above to prove it.

## Pitfalls

- Picking by overall MTEB average instead of retrieval scores on comparable data.
- Forgetting query/document prefixes or instructions, which can cost several recall points.
- Eval queries copied from documents, which flatters every model.
- Comparing models through different ANN settings or chunkings.
- Ignoring max input length and silently truncating long chunks.
