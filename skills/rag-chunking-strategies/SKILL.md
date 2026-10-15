---
name: rag-chunking-strategies
description: Choose and tune how documents are split for RAG (fixed, recursive, structure-aware, semantic, parent-child, late chunking) and pick chunk size and overlap by measuring retrieval recall. Use when setting up ingestion, when retrieval misses answers that exist in the corpus, or when changing document types.
---

# RAG chunking strategies

Chunking decides what can be retrieved. A chunk must be small enough to be specific to one idea and large enough to be
understood on its own. Choose by document structure, then tune size and overlap against a labelled query set, never by
intuition.

## Decision table

| Content | Strategy |
| --- | --- |
| Markdown, HTML, docs sites, wikis | Structure-aware: split on headings, keep the heading path as chunk metadata, then recursive split inside long sections |
| PDFs (reports, manuals) | Layout-aware parse first (keep headings, tables, page numbers), then structure-aware split. Garbage parse = garbage chunks |
| Code | Split on syntax units (functions, classes) with a tree-sitter based splitter; include file path and enclosing class |
| Tables / CSV | One row (or row group) per chunk serialised as `column: value` pairs, with the table caption and headers repeated |
| FAQ, tickets, chat, short records | One item per chunk; do not merge or split |
| Long unstructured prose (transcripts, novels) | Recursive by paragraph/sentence; consider semantic chunking |
| Legal/contract text | Split on clause numbering; keep clause number and parent clause titles |

Default when unsure: **recursive character/token splitter** with separators `["\n## ", "\n### ", "\n\n", "\n", ". ", " "]`,
**~400 tokens, ~50 tokens overlap**, measured in the embedding model's tokenizer.

## Strategies in brief

- **Fixed-size**: N tokens with overlap. Simple baseline; splits mid-sentence and mid-table. Use only as a control.
- **Recursive**: try the coarsest separator first, fall back to finer ones until the chunk fits. Best general default.
- **Structure-aware**: use the document's own sections. Highest quality when structure exists.
- **Semantic**: embed sentences, split where similarity between neighbours drops below a percentile threshold. Costs an
  embedding pass at ingest; helps on long unstructured text, rarely beats structure-aware on well-structured docs.
- **Parent-child (small-to-big)**: index small chunks (100-200 tokens) for precise matching, return their parent section
  (1-2k tokens) to the LLM. Good when answers need surrounding context.
- **Contextual chunk headers**: prepend `doc title > section path` (or an LLM-written one-sentence summary of where the
  chunk sits in the document) to the text you embed. Cheap and consistently helpful.
- **Late chunking**: embed the whole document with a long-context embedding model, then pool token embeddings per chunk,
  so each chunk vector carries document context. Requires a model and library that expose token-level outputs.

## Tuning procedure

1. Build or reuse a labelled set: 50-200 real queries, each with the passage(s) that answer it (store the answer span
   text, not chunk ids, so labels survive re-chunking).
2. A chunk counts as relevant if it contains (or overlaps most of) the labelled span.
3. Grid: chunk size `{200, 400, 800}` tokens × overlap `{0, 10%, 20%}` × strategy `{recursive, structure-aware}`.
   Keep the embedding model and retriever fixed.
4. For each config, re-index and measure **recall@5, recall@20 and MRR**, plus index size and mean tokens per retrieved
   context.
5. Pick the smallest config within noise of the best recall@k at the k you will actually use. Then check end-to-end
   answer quality on a sample, since smaller chunks can raise recall but starve the generator.

```python
def recall_at_k(results, labels, k):
    hits = sum(any(span in r.text for r in res[:k]) for res, span in zip(results, labels))
    return hits / len(labels)
```

(Use fuzzy containment, e.g. normalised whitespace or token overlap ≥ 0.8, if parsing changes the text.)

## Rules of thumb

- Measure size in tokens of the embedding model, not characters. Respect the model's max input; text beyond it is
  silently truncated.
- Overlap beyond ~20% mostly adds duplicates; dedupe overlapping hits at query time.
- Never split inside a table row, code block or list item if you can avoid it.
- Keep a `chunk_index` and `doc_id` so neighbours can be fetched for context expansion.
- Factoid Q&A favours smaller chunks (200-400); synthesis and "explain" questions favour larger or parent-child.
- Different document types can use different strategies in the same index; record the strategy in metadata.

## Pitfalls

- Choosing chunk size from a blog post instead of your recall numbers.
- Labels tied to chunk ids, so every re-chunk invalidates the eval set.
- Boilerplate (headers, footers, nav) repeated in every chunk, making all chunks look alike to the embedder.
- Orphan chunks with pronouns and no subject ("This setting controls...") because the heading was not carried along.
- Changing chunking without re-embedding the whole corpus, leaving a mixed index.
